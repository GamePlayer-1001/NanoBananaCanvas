/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/platform-runtime, @/lib/validations/ai
 * [OUTPUT]: 对外提供 GET /api/ai/models (静态平台模型目录)
 * [POS]: api/ai 的模型目录端点，仅返回静态平台真相源，彻底不再依赖动态数据库目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import {
  listPlatformRuntimeModels,
  type PlatformModelCategory,
} from '@/lib/platform-runtime'
import { modelsQuerySchema } from '@/lib/validations/ai'

/* ─── GET /api/ai/models ─────────────────────────────── */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const { category } = modelsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    )

    const models = listPlatformRuntimeModels(
      category as PlatformModelCategory | undefined,
    ).map((item, index) => ({
      id: `runtime-${item.category}-${index + 1}`,
      provider: item.supplierId,
      modelId: item.modelId,
      modelName: item.modelName,
      category: item.category,
      tier: item.tier,
      accessible: true,
    }))

    return apiOk(models)
  } catch (error) {
    return handleApiError(error)
  }
}
