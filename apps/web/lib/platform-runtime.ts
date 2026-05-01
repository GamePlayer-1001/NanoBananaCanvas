/**
 * [INPUT]: 依赖无外部模块
 * [OUTPUT]: 对外提供平台模型运行时目录、平台默认模型与平台模型 -> 内部供应商解析工具
 * [POS]: lib 的平台运行时真相源，被模型目录、节点默认配置、Agent 提案与平台执行链共享，负责把“平台模式”从用户自配置协议概念中解耦出来
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type PlatformModelCategory = 'text' | 'image' | 'video' | 'audio'

export type PlatformSupplierId =
  | 'openrouter'
  | 'deepseek'
  | 'gemini'
  | 'dlapi'
  | 'comfly'
  | 'openai'
  | 'kling'

export interface PlatformRuntimeModel {
  supplierId: PlatformSupplierId
  modelId: string
  modelName: string
  category: PlatformModelCategory
  tier: string
  aliases?: string[]
}

const PLATFORM_RUNTIME_MODELS: readonly PlatformRuntimeModel[] = [
  { supplierId: 'openrouter', modelId: 'deepseek/deepseek-chat', modelName: 'DeepSeek V3', category: 'text', tier: 'basic', aliases: ['deepseek-v3'] },
  { supplierId: 'deepseek', modelId: 'deepseek-chat', modelName: 'DeepSeek Chat', category: 'text', tier: 'basic', aliases: ['deepseek-v3'] },
  { supplierId: 'deepseek', modelId: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner', category: 'text', tier: 'standard' },
  { supplierId: 'gemini', modelId: 'gemini-2.0-flash', modelName: 'Gemini 2.0 Flash', category: 'text', tier: 'standard' },
  { supplierId: 'gemini', modelId: 'gemini-2.5-pro-preview-06-05', modelName: 'Gemini 2.5 Pro', category: 'text', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'gpt-5.4', modelName: 'gpt-5.4', category: 'text', tier: 'flagship' },
  { supplierId: 'comfly', modelId: 'gemini-3.1-pro-preview', modelName: 'gemini-3.1-pro-preview', category: 'text', tier: 'flagship' },
  { supplierId: 'comfly', modelId: 'gemini-2.5-flash', modelName: 'gemini-2.5-flash', category: 'text', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'deepseek-v3', modelName: 'deepseek-v3', category: 'text', tier: 'standard', aliases: ['deepseek-chat'] },
  { supplierId: 'openrouter', modelId: 'openai/gpt-4o-mini', modelName: 'GPT-4o Mini', category: 'text', tier: 'standard' },
  { supplierId: 'openrouter', modelId: 'openai/gpt-4o', modelName: 'GPT-4o', category: 'text', tier: 'premium' },
  { supplierId: 'openrouter', modelId: 'anthropic/claude-sonnet-4', modelName: 'Claude Sonnet 4', category: 'text', tier: 'premium' },
  { supplierId: 'openrouter', modelId: 'anthropic/claude-opus-4', modelName: 'Claude Opus 4', category: 'text', tier: 'flagship' },

  { supplierId: 'openrouter', modelId: 'stabilityai/sd-3.5', modelName: 'Stable Diffusion 3.5', category: 'image', tier: 'standard' },
  { supplierId: 'openrouter', modelId: 'black-forest-labs/flux-schnell', modelName: 'FLUX.1 Schnell', category: 'image', tier: 'standard' },
  { supplierId: 'openrouter', modelId: 'black-forest-labs/flux-pro', modelName: 'FLUX.1 Pro', category: 'image', tier: 'flagship' },
  { supplierId: 'gemini', modelId: 'imagen-3.0-generate-002', modelName: 'Imagen 3', category: 'image', tier: 'standard' },
  { supplierId: 'openai', modelId: 'dall-e-3', modelName: 'DALL-E 3', category: 'image', tier: 'premium' },
  { supplierId: 'dlapi', modelId: 'gpt-image-2', modelName: 'GPT Image 2', category: 'image', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'dall-e-3', modelName: 'DALL-E 3 (Comfly)', category: 'image', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'gemini-2.5-flash-image', modelName: 'Gemini 2.5 Flash Image', category: 'image', tier: 'premium' },

  { supplierId: 'kling', modelId: 'kling-v1-6', modelName: 'Kling V1.6', category: 'video', tier: 'standard' },
  { supplierId: 'kling', modelId: 'kling-v2-0', modelName: 'Kling V2.0', category: 'video', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'gemini-2.5-flash', modelName: 'Gemini 2.5 Flash', category: 'video', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'gemini-3-pro-preview', modelName: 'Gemini 3 Pro Preview', category: 'video', tier: 'flagship' },

  { supplierId: 'openai', modelId: 'tts-1', modelName: 'OpenAI TTS-1', category: 'audio', tier: 'basic' },
  { supplierId: 'openai', modelId: 'tts-1-hd', modelName: 'OpenAI TTS-1 HD', category: 'audio', tier: 'premium' },
  { supplierId: 'comfly', modelId: 'tts-1', modelName: 'Comfly TTS-1', category: 'audio', tier: 'basic', aliases: ['openai-tts-1'] },
  { supplierId: 'comfly', modelId: 'tts-1-hd', modelName: 'Comfly TTS-1 HD', category: 'audio', tier: 'premium', aliases: ['openai-tts-1-hd'] },
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

