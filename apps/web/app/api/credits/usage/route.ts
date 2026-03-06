/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/validations/credits
 * [OUTPUT]: 对外提供 GET /api/credits/usage (AI 使用统计)
 * [POS]: api/credits 的使用分析端点，聚合 ai_usage_logs 返回摘要/模型/日趋势
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { usageQuerySchema } from '@/lib/validations/credits'

/* ─── GET /api/credits/usage ─────────────────────────── */

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const url = new URL(req.url)
    const { days } = usageQuerySchema.parse({
      days: url.searchParams.get('days') ?? undefined,
    })

    // 并行查询三组数据
    const [summary, byModel, daily] = await Promise.all([
      querySummary(db, userId),
      queryByModel(db, userId),
      queryDaily(db, userId, days),
    ])

    return apiOk({ summary, byModel, daily })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── Queries ────────────────────────────────────────── */

async function querySummary(db: D1Database, userId: string) {
  const row = await db
    .prepare(
      `SELECT
        COUNT(*) as total_calls,
        COALESCE(SUM(credits_charged), 0) as total_credits,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        COALESCE(CAST(AVG(duration_ms) AS INTEGER), 0) as avg_duration_ms
       FROM ai_usage_logs WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{
      total_calls: number
      total_credits: number
      success_count: number
      failed_count: number
      avg_duration_ms: number
    }>()

  return {
    totalCalls: row?.total_calls ?? 0,
    totalCredits: row?.total_credits ?? 0,
    successCount: row?.success_count ?? 0,
    failedCount: row?.failed_count ?? 0,
    avgDurationMs: row?.avg_duration_ms ?? 0,
  }
}

async function queryByModel(db: D1Database, userId: string) {
  const { results } = await db
    .prepare(
      `SELECT provider, model_id, COUNT(*) as calls, COALESCE(SUM(credits_charged), 0) as credits
       FROM ai_usage_logs WHERE user_id = ?
       GROUP BY provider, model_id ORDER BY credits DESC LIMIT 20`,
    )
    .bind(userId)
    .all<{ provider: string; model_id: string; calls: number; credits: number }>()

  return (results ?? []).map((r) => ({
    provider: r.provider,
    modelId: r.model_id,
    calls: r.calls,
    credits: r.credits,
  }))
}

async function queryDaily(db: D1Database, userId: string, days: number) {
  const { results } = await db
    .prepare(
      `SELECT DATE(created_at) as date, COUNT(*) as calls, COALESCE(SUM(credits_charged), 0) as credits
       FROM ai_usage_logs WHERE user_id = ? AND created_at >= datetime('now', ?)
       GROUP BY DATE(created_at) ORDER BY date`,
    )
    .bind(userId, `-${days} days`)
    .all<{ date: string; calls: number; credits: number }>()

  return (results ?? []).map((r) => ({
    date: r.date,
    calls: r.calls,
    credits: r.credits,
  }))
}
