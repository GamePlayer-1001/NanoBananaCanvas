/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db, @/lib/logger, @/lib/platform-models, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (统一平台模型目录)
 * [POS]: api/ai 的模型目录端点，支持 category 筛选，作为所有平台模式节点的单一模型真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import type { PlatformModelCatalogItem } from '@/lib/platform-models'
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

const FALLBACK_MODELS: PublicModelRow[] = [
  { id: 'mp-001', provider: 'openrouter', model_id: 'deepseek/deepseek-chat', model_name: 'DeepSeek V3', category: 'text', tier: 'basic' },
  { id: 'mp-002', provider: 'openrouter', model_id: 'google/gemini-2.0-flash-exp', model_name: 'Gemini 2.0 Flash', category: 'text', tier: 'basic' },
  { id: 'mp-003', provider: 'openrouter', model_id: 'openai/gpt-4o-mini', model_name: 'GPT-4o Mini', category: 'text', tier: 'standard' },
  { id: 'mp-004', provider: 'openrouter', model_id: 'anthropic/claude-3.5-haiku', model_name: 'Claude 3.5 Haiku', category: 'text', tier: 'standard' },
  { id: 'mp-005', provider: 'openrouter', model_id: 'openai/gpt-4o', model_name: 'GPT-4o', category: 'text', tier: 'premium' },
  { id: 'mp-006', provider: 'openrouter', model_id: 'anthropic/claude-sonnet-4', model_name: 'Claude Sonnet 4', category: 'text', tier: 'premium' },
  { id: 'mp-007', provider: 'openrouter', model_id: 'google/gemini-2.5-pro', model_name: 'Gemini 2.5 Pro', category: 'text', tier: 'premium' },
  { id: 'mp-008', provider: 'openrouter', model_id: 'openai/o1', model_name: 'OpenAI o1', category: 'text', tier: 'flagship' },
  { id: 'mp-009', provider: 'openrouter', model_id: 'anthropic/claude-opus-4', model_name: 'Claude Opus 4', category: 'text', tier: 'flagship' },
  { id: 'mp-ds-1', provider: 'deepseek', model_id: 'deepseek-chat', model_name: 'DeepSeek Chat', category: 'text', tier: 'basic' },
  { id: 'mp-ds-2', provider: 'deepseek', model_id: 'deepseek-reasoner', model_name: 'DeepSeek Reasoner', category: 'text', tier: 'standard' },
  { id: 'mp-gm-1', provider: 'gemini', model_id: 'gemini-2.0-flash', model_name: 'Gemini 2.0 Flash', category: 'text', tier: 'standard' },
  { id: 'mp-gm-2', provider: 'gemini', model_id: 'gemini-2.5-pro-preview-06-05', model_name: 'Gemini 2.5 Pro', category: 'text', tier: 'premium' },
  { id: 'mp-101', provider: 'openrouter', model_id: 'stabilityai/sd-3.5', model_name: 'Stable Diffusion 3.5', category: 'image', tier: 'standard' },
  { id: 'mp-102', provider: 'openrouter', model_id: 'black-forest-labs/flux-schnell', model_name: 'FLUX.1 Schnell', category: 'image', tier: 'standard' },
  { id: 'mp-103', provider: 'openrouter', model_id: 'openai/dall-e-3', model_name: 'DALL-E 3', category: 'image', tier: 'premium' },
  { id: 'mp-104', provider: 'openrouter', model_id: 'black-forest-labs/flux-pro', model_name: 'FLUX.1 Pro', category: 'image', tier: 'flagship' },
  { id: 'mp-img-2', provider: 'gemini', model_id: 'imagen-3.0-generate-002', model_name: 'Imagen 3', category: 'image', tier: 'standard' },
  { id: 'mp-105', provider: 'openai', model_id: 'dall-e-3', model_name: 'DALL-E 3', category: 'image', tier: 'premium' },
  { id: 'mp-201', provider: 'kling', model_id: 'kling-v2-0', model_name: 'Kling V2.0', category: 'video', tier: 'premium' },
  { id: 'mp-202', provider: 'kling', model_id: 'kling-v1-6', model_name: 'Kling V1.6', category: 'video', tier: 'standard' },
  { id: 'mp-301', provider: 'openai', model_id: 'tts-1', model_name: 'OpenAI TTS-1', category: 'audio', tier: 'basic' },
  { id: 'mp-302', provider: 'openai', model_id: 'tts-1-hd', model_name: 'OpenAI TTS-1 HD', category: 'audio', tier: 'premium' },
]

function toPublicModel(row: PublicModelRow): PlatformModelCatalogItem {
  return {
    id: row.id,
    provider: row.provider,
    modelId: row.model_id,
    modelName: row.model_name,
    category: row.category,
    tier: row.tier,
    accessible: true,
  }
}

function getFallbackModels(category?: ModelCategory) {
  return FALLBACK_MODELS
    .filter((row) => !category || row.category === category)
    .sort((a, b) => a.category.localeCompare(b.category) || a.model_name.localeCompare(b.model_name))
    .map(toPublicModel)
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
