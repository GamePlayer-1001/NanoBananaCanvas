/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (统一免费模型目录)
 * [POS]: api/ai 的模型目录端点，支持 category 筛选，不再暴露计费/套餐语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { modelsQuerySchema } from '@/lib/validations/ai'

/* ─── GET /api/ai/models ─────────────────────────────── */

export async function GET(req: Request) {
  try {
    const db = await getDb()

    const url = new URL(req.url)
    const { category } = modelsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    )

    let sql = `SELECT id, provider, model_id, model_name, category, tier
               FROM ai_models WHERE is_active = 1`
    const binds: string[] = []

    if (category) {
      sql += ' AND category = ?'
      binds.push(category)
    }

    sql += ' ORDER BY category, model_name ASC'

    const rows = await db.prepare(sql).bind(...binds).all()

    const models = rows.results.map((row) => ({
      id: row.id,
      provider: row.provider,
      modelId: row.model_id,
      modelName: row.model_name,
      category: row.category,
      tier: row.tier,
      accessible: true,
    }))

    return apiOk(models)
  } catch (error) {
    return handleApiError(error)
  }
}
