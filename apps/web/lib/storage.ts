/**
 * [INPUT]: 依赖 @/lib/r2 的 getR2，依赖 @/lib/nanoid 的 ID 生成，
 *          依赖 @/lib/db 的 getDb，依赖 @/lib/kv 的 getKV
 * [OUTPUT]: 对外提供 R2 存储路径生成 / 配额检查(KV 缓存) / 文件清理 / 缓存失效工具
 * [POS]: lib 的存储服务层，被文件上传 API / 异步任务 / 发布流程消费，当前采用统一免费配额策略
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { getKV } from '@/lib/kv'
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

const STORAGE_CACHE_TTL = 300 // 5 分钟 KV 缓存
const FREE_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024
const OUTPUT_RETENTION_DAYS = 7

/**
 * 计算用户存储使用量 (KV 缓存 5min → R2 list fallback)
 * 上传/删除后调用 invalidateStorageCache 主动失效
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const kv = await getKV()
  const cacheKey = `storage:${userId}:usage`

  /* KV 缓存命中 → 直接返回 */
  const cached = await kv.get<{ usedBytes: number; limitBytes: number }>(cacheKey, 'json')
  if (cached) {
    const usedPercent = cached.limitBytes > 0 ? Math.round((cached.usedBytes / cached.limitBytes) * 100) : 0
    return { ...cached, usedPercent, isOverQuota: cached.usedBytes >= cached.limitBytes }
  }

  /* 缓存未命中 → R2 list 计算 */
  const r2 = await getR2()
  const limitBytes = FREE_STORAGE_LIMIT_BYTES

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

  /* 写入 KV 缓存 */
  await kv.put(cacheKey, JSON.stringify({ usedBytes, limitBytes }), {
    expirationTtl: STORAGE_CACHE_TTL,
  })

  const usedPercent = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0

  return { usedBytes, limitBytes, usedPercent, isOverQuota: usedBytes >= limitBytes }
}

/** 主动失效存储配额缓存 (上传/删除文件后调用) */
export async function invalidateStorageCache(userId: string): Promise<void> {
  const kv = await getKV()
  await kv.delete(`storage:${userId}:usage`)
}

/**
 * 清理过期的 AI 输出文件
 * 当前统一采用单一免费保留期，避免商业化套餐耦合
 */
export async function cleanupExpiredOutputs(): Promise<{ deleted: number; errors: number }> {
  const r2 = await getR2()
  const db = await getDb()

  const { results } = await db
    .prepare(`
      SELECT t.id, t.output_data
      FROM async_tasks t
      WHERE t.status = 'completed'
        AND t.output_data IS NOT NULL
        AND t.completed_at IS NOT NULL
        AND t.completed_at < datetime('now', ?)
    `)
    .bind(`-${OUTPUT_RETENTION_DAYS} days`)
    .all<{ id: string; output_data: string }>()

  let deleted = 0
  let errors = 0

  for (const task of results) {
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
