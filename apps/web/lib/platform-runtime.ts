/**
 * [INPUT]: 依赖无外部模块
 * [OUTPUT]: 对外提供平台模型静态目录、平台默认模型与平台模型 -> 内部供应商解析工具
 * [POS]: lib 的平台运行时真相源，被模型目录、节点默认配置、Agent 提案与平台执行链共享，负责把平台模式严格收口为“真实可用静态目录”
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type PlatformModelCategory = 'text' | 'image' | 'video' | 'audio'

export type PlatformSupplierId =
  | 'dlapi'
  | 'comfly'
  | 'kling'
  | 'openai-compatible'

export interface PlatformRuntimeModel {
  supplierId: PlatformSupplierId
  modelId: string
  modelName: string
  category: PlatformModelCategory
  tier: string
  aliases?: string[]
}

const PLATFORM_RUNTIME_MODELS: readonly PlatformRuntimeModel[] = [
  {
    supplierId: 'comfly',
    modelId: 'gpt-5.4',
    modelName: 'gpt-5.4',
    category: 'text',
    tier: 'flagship',
  },
  {
    supplierId: 'comfly',
    modelId: 'gemini-3.1-pro-preview',
    modelName: 'gemini-3.1-pro-preview',
    category: 'text',
    tier: 'flagship',
  },
  {
    supplierId: 'comfly',
    modelId: 'gemini-2.5-flash',
    modelName: 'gemini-2.5-flash',
    category: 'text',
    tier: 'premium',
  },
  {
    supplierId: 'comfly',
    modelId: 'deepseek-v3',
    modelName: 'deepseek-v3',
    category: 'text',
    tier: 'standard',
  },

  {
    supplierId: 'dlapi',
    modelId: 'gpt-image-2',
    modelName: 'gpt-image-2',
    category: 'image',
    tier: 'premium',
  },
  {
    supplierId: 'comfly',
    modelId: 'gpt-image-2-all',
    modelName: 'gpt-image-2-all',
    category: 'image',
    tier: 'premium',
  },
  {
    supplierId: 'comfly',
    modelId: 'gemini-3.1-flash-image-preview',
    modelName: 'Nano Banana 2 pro',
    category: 'image',
    tier: 'flagship',
    aliases: ['nano-banana-2-pro', 'nano banana 2 pro'],
  },
  {
    supplierId: 'comfly',
    modelId: 'nano-banana-pro',
    modelName: 'nano-banana-pro',
    category: 'image',
    tier: 'premium',
  },
  {
    supplierId: 'comfly',
    modelId: 'nano-banana',
    modelName: 'nano-banana',
    category: 'image',
    tier: 'premium',
  },

  {
    supplierId: 'kling',
    modelId: 'kling-v1-6',
    modelName: 'Kling V1.6',
    category: 'video',
    tier: 'standard',
  },
  {
    supplierId: 'kling',
    modelId: 'kling-v2-0',
    modelName: 'Kling V2.0',
    category: 'video',
    tier: 'premium',
  },
  {
    supplierId: 'openai-compatible',
    modelId: 'tts-1',
    modelName: 'TTS-1',
    category: 'audio',
    tier: 'basic',
  },
] as const

export function listPlatformRuntimeModels(
  category?: PlatformModelCategory,
): PlatformRuntimeModel[] {
  return PLATFORM_RUNTIME_MODELS.filter((item) => !category || item.category === category)
}

export function getDefaultPlatformRuntimeModel(
  category: PlatformModelCategory,
): PlatformRuntimeModel {
  const first = PLATFORM_RUNTIME_MODELS.find((item) => item.category === category)
  if (!first) {
    throw new Error(`No platform runtime model configured for category: ${category}`)
  }
  return first
}

export function resolvePlatformRuntimeModel(input: {
  category: PlatformModelCategory
  modelId?: string
  supplierHint?: string
}): PlatformRuntimeModel {
  const candidates = PLATFORM_RUNTIME_MODELS.filter(
    (item) => item.category === input.category,
  )
  const normalizedModelId = input.modelId?.trim().toLowerCase()

  const exact = normalizedModelId
    ? candidates.find(
        (item) =>
          item.modelId.toLowerCase() === normalizedModelId &&
          (!input.supplierHint || item.supplierId === input.supplierHint),
      )
    : null

  if (exact) {
    return exact
  }

  const aliasMatch = normalizedModelId
    ? candidates.find(
        (item) =>
          item.aliases?.some((alias) => alias.toLowerCase() === normalizedModelId) &&
          (!input.supplierHint || item.supplierId === input.supplierHint),
      )
    : null

  if (aliasMatch) {
    return aliasMatch
  }

  const sameModelDifferentSupplier = normalizedModelId
    ? candidates.find((item) => item.modelId.toLowerCase() === normalizedModelId)
    : null

  if (sameModelDifferentSupplier) {
    return sameModelDifferentSupplier
  }

  return getDefaultPlatformRuntimeModel(input.category)
}
