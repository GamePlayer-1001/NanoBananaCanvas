/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (模型列表 + 积分定价)
 * [POS]: api/ai 的模型目录端点，支持 category 筛选 + 套餐可用性标记
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { optionalAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { modelsQuerySchema } from '@/lib/validations/ai'

/* ─── Plan Hierarchy ─────────────────────────────────── */

const PLAN_RANK: Record<string, number> = {
  free: 0,
  pro: 1,
}

/* ─── GET /api/ai/models ─────────────────────────────── */

export async function GET(req: Request) {
  try {
    const authUser = await optionalAuth()
    const db = await getDb()

    const url = new URL(req.url)
    const { category } = modelsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    )

    // 获取用户套餐
    let userPlan = 'free'
    if (authUser) {
      const sub = await db
        .prepare('SELECT plan FROM subscriptions WHERE user_id = ?')
        .bind(authUser.userId)
        .first<{ plan: string }>()
      userPlan = sub?.plan ?? 'free'
    }

    const userRank = PLAN_RANK[userPlan] ?? 0

    // 查模型列表
    let sql = `SELECT id, provider, model_id, model_name, category, credits_per_call, tier, min_plan
               FROM model_pricing WHERE is_active = 1`
    const binds: string[] = []

    if (category) {
      sql += ' AND category = ?'
      binds.push(category)
    }

    sql += ' ORDER BY category, credits_per_call ASC'

    const rows = await db.prepare(sql).bind(...binds).all()

    const models = rows.results.map((row) => ({
      id: row.id,
      provider: row.provider,
      modelId: row.model_id,
      modelName: row.model_name,
      category: row.category,
      creditsPerCall: row.credits_per_call,
      tier: row.tier,
      minPlan: row.min_plan,
      accessible: userRank >= (PLAN_RANK[row.min_plan as string] ?? 0),
    }))

    return apiOk({ models, userPlan })
  } catch (error) {
    return handleApiError(error)
  }
}
