/**
 * [INPUT]: 依赖 @/lib/r2 的 getR2，依赖 @/lib/nanoid 的 ID 生成，
 *          依赖 @/lib/db 的 getDb，依赖 @/lib/kv 的 getKV，依赖 @/lib/env 的 getEnv
 * [OUTPUT]: 对外提供 R2 存储路径生成 / 公开资产 URL 生成 / 私有输出路径解析 / 存储体积统计(D1 真相源 + KV 缓存) / 文件清理 / 缓存失效工具
 * [POS]: lib 的存储服务层，被文件上传 API / 异步任务 / 发布流程消费，当前只保留后台体积统计，不再限制用户存储空间
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
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
const INTERNAL_FILE_PREFIX = '/api/files/'

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

export function toInternalFileUrl(key: string): string {
  return `${INTERNAL_FILE_PREFIX}${key}`
}

export function extractR2KeyFromFileUrl(url: string): string | null {
  if (!url.startsWith(INTERNAL_FILE_PREFIX)) {
    return null
  }

  return url.slice(INTERNAL_FILE_PREFIX.length) || null
}

/* ─── Storage Quota ──────────────────────────── */

export interface StorageUsage {
  usedBytes: number
}

interface StorageUsageRow {
  user_id: string
  used_bytes: number | null
  updated_at: string | null
}

export interface CleanupExpiredOutputsResult {
  deleted: number
  errors: number
  prunedTasks: number
}

const STORAGE_CACHE_TTL = 300 // 5 分钟 KV 缓存
const OUTPUT_RETENTION_DAYS = 7
const TERMINAL_TASK_RETENTION_DAYS = 14

function normalizeStorageUsage(usedBytes: number): StorageUsage {
  return { usedBytes }
}

async function ensureStorageUsageSchema(db: D1Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS storage_usage (
      user_id TEXT PRIMARY KEY,
      used_bytes INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

export async function getPublicAssetBaseUrl(): Promise<string | null> {
  const directBaseUrl = (await getEnv('PUBLIC_ASSET_BASE_URL')).trim()
  if (!directBaseUrl) {
    return null
  }

  return directBaseUrl.replace(/\/+$/, '')
}

export async function toPublicFileUrl(key: string): Promise<string> {
  const assetBaseUrl = await getPublicAssetBaseUrl()
  if (!assetBaseUrl) {
    return toInternalFileUrl(key)
  }

  return `${assetBaseUrl}/${key}`
}

/**
 * 计算用户存储体积 (D1 真相源 → KV 5min 缓存 → R2 list 回填)
 * 上传/删除后调用 invalidateStorageCache 主动失效，调用 applyStorageUsageDelta 保持汇总新鲜
 */
export async function getStorageUsage(userId: string): Promise<StorageUsage> {
  const kv = await getKV()
  const db = await getDb()
  const cacheKey = `storage:${userId}:usage`

  /* KV 缓存命中 → 直接返回 */
  const cached = await kv.get<{ usedBytes: number }>(cacheKey, 'json')
  if (cached) {
    return normalizeStorageUsage(cached.usedBytes)
  }

  await ensureStorageUsageSchema(db)
  const usageRow = await db
    .prepare(
      `SELECT user_id, used_bytes, updated_at
       FROM storage_usage
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<StorageUsageRow>()

  if (usageRow) {
    const normalized = normalizeStorageUsage(Math.max(usageRow.used_bytes ?? 0, 0))
    await kv.put(cacheKey, JSON.stringify({
      usedBytes: normalized.usedBytes,
    }), {
      expirationTtl: STORAGE_CACHE_TTL,
    })
    return normalized
  }

  /* 首次回填时才做 R2 list */
  const r2 = await getR2()

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

  await db
    .prepare(
      `INSERT INTO storage_usage (user_id, used_bytes, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         used_bytes = excluded.used_bytes,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(userId, usedBytes)
    .run()

  /* 写入 KV 缓存 */
  await kv.put(cacheKey, JSON.stringify({ usedBytes }), {
    expirationTtl: STORAGE_CACHE_TTL,
  })

  return normalizeStorageUsage(usedBytes)
}

export async function applyStorageUsageDelta(userId: string, deltaBytes: number): Promise<void> {
  const db = await getDb()
  const kv = await getKV()
  await ensureStorageUsageSchema(db)

  const current = await db
    .prepare(
      `SELECT used_bytes
       FROM storage_usage
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ used_bytes: number | null }>()

  const nextUsedBytes = Math.max((current?.used_bytes ?? 0) + deltaBytes, 0)

  await db
    .prepare(
      `INSERT INTO storage_usage (user_id, used_bytes, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         used_bytes = excluded.used_bytes,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(userId, nextUsedBytes)
    .run()

  await kv.put(cacheKeyForUser(userId), JSON.stringify({
    usedBytes: nextUsedBytes,
  }), {
    expirationTtl: STORAGE_CACHE_TTL,
  })
}

/** 主动失效存储配额缓存 (上传/删除文件后调用) */
export async function invalidateStorageCache(userId: string): Promise<void> {
  const kv = await getKV()
  await kv.delete(cacheKeyForUser(userId))
}

function cacheKeyForUser(userId: string): string {
  return `storage:${userId}:usage`
}

/**
 * 清理过期的 AI 输出文件
 * 当前统一采用单一免费保留期，避免商业化套餐耦合
 */
export async function cleanupExpiredOutputs(): Promise<CleanupExpiredOutputsResult> {
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
      const r2Key = output.r2_key || (typeof output.url === 'string'
        ? extractR2KeyFromFileUrl(output.url)
        : null)
      if (r2Key) {
        await r2.delete(r2Key)
        deleted++
      }
    } catch {
      errors++
    }
  }

  const staleTasks = await db
    .prepare(
      `SELECT id
       FROM async_tasks
       WHERE status IN ('completed', 'failed', 'cancelled')
         AND COALESCE(completed_at, updated_at, created_at) < datetime('now', ?)
       ORDER BY COALESCE(completed_at, updated_at, created_at) ASC
       LIMIT 200`,
    )
    .bind(`-${TERMINAL_TASK_RETENTION_DAYS} days`)
    .all<{ id: string }>()

  const staleTaskIds = (staleTasks.results ?? []).map((row) => row.id).filter(Boolean)

  if (staleTaskIds.length > 0) {
    const placeholders = staleTaskIds.map(() => '?').join(', ')
    await db
      .prepare(`DELETE FROM async_tasks WHERE id IN (${placeholders})`)
      .bind(...staleTaskIds)
      .run()
  }

  return {
    deleted,
    errors,
    prunedTasks: staleTaskIds.length,
  }
}
