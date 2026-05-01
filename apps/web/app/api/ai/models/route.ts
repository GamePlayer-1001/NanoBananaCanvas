/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/logger, @/lib/platform-models, @/lib/platform-runtime, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (统一平台模型目录)
 * [POS]: api/ai 的模型目录端点，支持 category 筛选，作为所有平台模式节点的单一模型真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import type { PlatformModelCatalogItem } from '@/lib/platform-models'
import {
  listPlatformRuntimeModels,
  resolvePlatformRuntimeModel,
  type PlatformModelCategory,
} from '@/lib/platform-runtime'
import { modelsQuerySchema } from '@/lib/validations/ai'

const log = createLogger('api:ai-models')

type ModelCategory = 'text' | 'image' | 'video' | 'audio'

interface PublicModelRow {
  id: string
  provider: string
  model_id: string
  model_name: string
  category: ModelCategory
  tier: string
}

function toPublicModel(row: PublicModelRow): PlatformModelCatalogItem {
  const runtimeModel = resolvePlatformRuntimeModel({
    category: row.category,
    modelId: row.model_id,
    supplierHint: row.provider,
  })

  return {
    id: row.id,
    provider: runtimeModel.supplierId,
    modelId: runtimeModel.modelId,
    modelName: runtimeModel.modelName,
    category: row.category,
    tier: runtimeModel.tier || row.tier,
    accessible: true,
  }
}

function getFallbackModels(category?: ModelCategory) {
  return listPlatformRuntimeModels(category as PlatformModelCategory | undefined)
    .sort((a, b) => a.category.localeCompare(b.category) || a.modelName.localeCompare(b.modelName))
    .map((item, index) => ({
      id: `runtime-${item.category}-${index + 1}`,
      provider: item.supplierId,
      modelId: item.modelId,
      modelName: item.modelName,
      category: item.category,
      tier: item.tier,
      accessible: true,
    }))
}

/* ─── GET /api/ai/models ─────────────────────────────── */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const { category } = modelsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    )

    try {
      const db = await getDb()

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
        ? await statement.bind(...binds).all<PublicModelRow>()
        : await statement.all<PublicModelRow>()

      const models = (rows.results ?? []).map(toPublicModel)
      return apiOk(models)
    } catch (error) {
      log.error('Failed to load AI models, serving fallback catalog', error, { category })
      return apiOk(getFallbackModels(category))
    }
  } catch (error) {
    return handleApiError(error)
  }
}
