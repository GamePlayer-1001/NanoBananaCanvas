/**
 * [INPUT]: 依赖 @/lib/r2 的 getR2，依赖 @/lib/nanoid 的 ID 生成，
 *          依赖 @/lib/db 的 getDb，依赖 @nano-banana/shared 的 PLANS 配置
 * [OUTPUT]: 对外提供 R2 存储路径生成 / 配额检查 / 文件清理工具
 * [POS]: lib 的存储服务层，被文件上传 API / 异步任务 / 发布流程消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { PLANS } from '@nano-banana/shared'

import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'
import { getR2 } from '@/lib/r2'

/* ============================================ */
/*  Storage Path Convention                      */
/*                                               */
/*  uploads/{user_id}/{file_id}.{ext}            */
/*    — 用户上传原始文件 (封面/素材)              */
/*                                               */
/*  outputs/{user_id}/{task_id}.{ext}            */
/*    — AI 生成结果 (图片/视频/音频)              */
/*                                               */
/*  thumbnails/{workflow_id}.webp                 */
/*    — 工作流画布快照缩略图                      */
/* ============================================ */

export type StorageCategory = 'uploads' | 'outputs' | 'thumbnails'

/* ─── Path Generators ────────────────────────── */

export function generateUploadPath(userId: string, ext: string): string {
  return `uploads/${userId}/${nanoid()}.${ext}`
}

export function generateOutputPath(userId: string, taskId: string, ext: string): string {
  return `outputs/${userId}/${taskId}.${ext}`
}

export function generateThumbnailPath(workflowId: string): string {
  return `thumbnails/${workflowId}.webp`
}

/* ─── Storage Quota ──────────────────────────── */

export interface StorageUsage {
  usedBytes: number
  limitBytes: number
  usedPercent: number
  isOverQuota: boolean
}

/**
 * 计算用户存储使用量 (uploads/ + outputs/ 两个前缀)
 * R2 list 按 prefix 查询，累计 size
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const r2 = await getR2()
  const db = await getDb()

  /* 查用户套餐 */
  const sub = await db
    .prepare('SELECT plan FROM subscriptions WHERE user_id = ?')
    .bind(userId)
    .first<{ plan: string }>()

  const plan = (sub?.plan ?? 'free') as keyof typeof PLANS
  const limitBytes = (PLANS[plan]?.storageGB ?? 1) * 1024 * 1024 * 1024

  /* 累计 R2 对象 size */
  let usedBytes = 0
  const prefixes = [`uploads/${userId}/`, `outputs/${userId}/`]

  for (const prefix of prefixes) {
    let cursor: string | undefined
    do {
      const result = await r2.list({ prefix, cursor, limit: 1000 })
      for (const obj of result.objects) {
        usedBytes += obj.size
      }
      cursor = result.truncated ? result.cursor : undefined
    } while (cursor)
  }

  const usedPercent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0

  return {
    usedBytes,
    limitBytes,
    usedPercent,
    isOverQuota: usedBytes >= limitBytes,
  }
}

/* ─── Retention Policy (per plan) ────────────── */

const RETENTION_DAYS: Record<string, number> = {
  free: 7,
  pro: 90,
}

/**
 * 清理过期的 AI 输出文件
 * 读取 async_tasks 中已完成且超出保留期的记录，删除关联 R2 对象
 */
export async function cleanupExpiredOutputs(): Promise<{ deleted: number; errors: number }> {
  const r2 = await getR2()
  const db = await getDb()

  /* 查询所有已完成且有 output_data 的任务，关联用户套餐 */
  const { results } = await db
    .prepare(`
      SELECT t.id, t.output_data, t.completed_at,
             COALESCE(s.plan, 'free') AS plan
      FROM async_tasks t
      LEFT JOIN subscriptions s ON s.user_id = t.user_id
      WHERE t.status = 'completed'
        AND t.output_data IS NOT NULL
        AND t.completed_at IS NOT NULL
    `)
    .all<{ id: string; output_data: string; completed_at: string; plan: string }>()

  const now = Date.now()
  let deleted = 0
  let errors = 0

  for (const task of results) {
    const retentionMs = (RETENTION_DAYS[task.plan] ?? 7) * 24 * 60 * 60 * 1000
    const completedAt = new Date(task.completed_at).getTime()

    if (now - completedAt < retentionMs) continue

    try {
      const output = JSON.parse(task.output_data)
      const r2Key = output.r2_key || output.url?.replace('/api/files/', '')
      if (r2Key) {
        await r2.delete(r2Key)
        deleted++
      }
    } catch {
      errors++
    }
  }

  return { deleted, errors }
}