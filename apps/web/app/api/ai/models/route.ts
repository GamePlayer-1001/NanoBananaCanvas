/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/logger, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (统一免费模型目录)
 * [POS]: api/ai 的模型目录端点，支持 category 筛选，不再暴露计费/套餐语义
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { modelsQuerySchema } from '@/lib/validations/ai'

const log = createLogger('api:ai-models')

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

    const statement = db.prepare(sql)
    const rows = binds.length
      ? await statement.bind(...binds).all<{
          id: string
          provider: string
          model_id: string
          model_name: string
          category: string
          tier: string
        }>()
      : await statement.all<{
          id: string
          provider: string
          model_id: string
          model_name: string
          category: string
          tier: string
        }>()

    const models = (rows.results ?? []).map((row) => ({
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
    log.error('Failed to load AI models', error)
    return handleApiError(error)
  }
}
