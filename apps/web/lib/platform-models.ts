/**
 * [INPUT]: 依赖无外部模块
 * [OUTPUT]: 对外提供平台模型目录类型、Provider/模型展示元数据、Agent 平台模型预设，以及按 Provider 分组/选中解析工具
 * [POS]: lib 的平台模型目录语义层，被 Agent 面板、生成节点与 /api/ai/models 消费方共享，负责把统一目录转成可渲染且可校验的模型结构
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export interface PlatformModelCatalogItem {
  id: string
  modelId: string
  modelName: string
  provider: string
  category: string
  tier: string
  accessible: boolean
}

export interface PlatformModelProviderGroup {
  provider: string
  providerLabel: string
  models: PlatformModelCatalogItem[]
}

export interface PlatformModelVisualOption {
  selectionValue: string
  value: string
  label: string
  provider: string
  providerLabel: string
  logoText: string
  logoClassName: string
  description?: string
  credits?: number
}

export interface AgentPlatformModelPreset {
  provider: string
  modelId: string
  modelName: string
  credits: number
}

export interface StaticPlatformImagePreset {
  provider: 'dlapi' | 'comfly'
  modelId: string
  modelName: string
}

const PLATFORM_PROVIDER_LABELS: Record<string, string> = {
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  dlapi: 'DLAPI',
  comfly: 'Comfly',
  kling: 'Kling',
  jimeng: 'Jimeng',
}

const PLATFORM_PROVIDER_LOGOS: Record<
  string,
  {
    text: string
    className: string
  }
> = {
  openrouter: {
    text: 'OR',
    className: 'bg-slate-900 text-white',
  },
  deepseek: {
    text: 'DS',
    className: 'bg-sky-500 text-white',
  },
  gemini: {
    text: 'GM',
    className: 'bg-emerald-500 text-white',
  },
  openai: {
    text: 'AI',
    className: 'bg-emerald-950 text-white',
  },
  dlapi: {
    text: 'DL',
    className: 'bg-fuchsia-600 text-white',
  },
  comfly: {
    text: 'CF',
    className: 'bg-amber-500 text-slate-950',
  },
  kling: {
    text: 'KG',
    className: 'bg-rose-500 text-white',
  },
  jimeng: {
    text: 'JM',
    className: 'bg-violet-500 text-white',
  },
}

export const AGENT_PLATFORM_MODEL_PRESETS: readonly AgentPlatformModelPreset[] = [
  {
    provider: 'comfly',
    modelId: 'gpt-5.4',
    modelName: 'gpt-5.4',
    credits: 1.5,
  },
  {
    provider: 'comfly',
    modelId: 'gemini-3.1-pro-preview',
    modelName: 'gemini-3.1-pro-preview',
    credits: 3,
  },
  {
    provider: 'comfly',
    modelId: 'gemini-2.5-flash',
    modelName: 'gemini-2.5-flash',
    credits: 0.5,
  },
  {
    provider: 'comfly',
    modelId: 'deepseek-v3',
    modelName: 'deepseek-v3',
    credits: 1,
  },
] as const

export const STATIC_PLATFORM_IMAGE_PRESETS: readonly StaticPlatformImagePreset[] = [
  {
    provider: 'dlapi',
    modelId: 'gpt-image-2',
    modelName: 'gpt-image-2',
  },
  {
    provider: 'comfly',
    modelId: 'gpt-image-2-all',
    modelName: 'gpt-image-2-all',
  },
  {
    provider: 'comfly',
    modelId: 'gemini-3.1-flash-image-preview',
    modelName: 'Nano Banana 2 pro',
  },
  {
    provider: 'comfly',
    modelId: 'nano-banana-pro',
    modelName: 'nano-banana-pro',
  },
  {
    provider: 'comfly',
    modelId: 'nano-banana',
    modelName: 'nano-banana',
  },
] as const

export function getPlatformProviderLabel(provider: string): string {
  return PLATFORM_PROVIDER_LABELS[provider] ?? provider
}

export function getPlatformProviderLogo(provider: string): {
  text: string
  className: string
} {
  return (
    PLATFORM_PROVIDER_LOGOS[provider] ?? {
      text: provider.slice(0, 2).toUpperCase(),
      className: 'bg-slate-200 text-slate-700',
    }
  )
}

export function groupPlatformModelsByProvider(
  models: readonly PlatformModelCatalogItem[],
): PlatformModelProviderGroup[] {
  const groups = new Map<string, PlatformModelProviderGroup>()

  for (const model of models) {
    const existing =
      groups.get(model.provider) ??
      {
        provider: model.provider,
        providerLabel: getPlatformProviderLabel(model.provider),
        models: [],
      }

    existing.models.push(model)
    groups.set(model.provider, existing)
  }

  return Array.from(groups.values())
}

export function toPlatformVisualOption(
  model: PlatformModelCatalogItem,
  extra?: {
    description?: string
    credits?: number
  },
): PlatformModelVisualOption {
  const logo = getPlatformProviderLogo(model.provider)

  return {
    selectionValue: `${model.provider}:${model.modelId}`,
    value: model.modelId,
    label: model.modelName,
    provider: model.provider,
    providerLabel: getPlatformProviderLabel(model.provider),
    logoText: logo.text,
    logoClassName: logo.className,
    description: extra?.description,
    credits: extra?.credits,
  }
}

export function getAgentPlatformModelOptions(
  models?: readonly PlatformModelCatalogItem[],
): PlatformModelVisualOption[] {
  const presetMap = new Map(
    AGENT_PLATFORM_MODEL_PRESETS.map((preset) => [
      `${preset.provider}:${preset.modelId}`,
      preset,
    ]),
  )

  const sourceModels =
    models
      ?.filter((model) => presetMap.has(`${model.provider}:${model.modelId}`))
      .sort((left, right) => {
        const leftIndex = AGENT_PLATFORM_MODEL_PRESETS.findIndex(
          (preset) =>
            preset.provider === left.provider && preset.modelId === left.modelId,
        )
        const rightIndex = AGENT_PLATFORM_MODEL_PRESETS.findIndex(
          (preset) =>
            preset.provider === right.provider && preset.modelId === right.modelId,
        )
        return leftIndex - rightIndex
      }) ?? []

  if (sourceModels.length > 0) {
    return sourceModels.map((model) => {
      const preset = presetMap.get(`${model.provider}:${model.modelId}`)
      return toPlatformVisualOption(model, {
        credits: preset?.credits,
        description: preset ? `${preset.credits} 积分/次` : undefined,
      })
    })
  }

  return AGENT_PLATFORM_MODEL_PRESETS.map((preset) => {
    const logo = getPlatformProviderLogo(preset.provider)

    return {
      selectionValue: `${preset.provider}:${preset.modelId}`,
      value: preset.modelId,
      label: preset.modelName,
      provider: preset.provider,
      providerLabel: getPlatformProviderLabel(preset.provider),
      logoText: logo.text,
      logoClassName: logo.className,
      credits: preset.credits,
      description: `${preset.credits} 积分/次`,
    }
  })
}

export function toPlatformVisualOptions(
  models: readonly PlatformModelCatalogItem[],
): PlatformModelVisualOption[] {
  return models.map((model) => toPlatformVisualOption(model))
}

export function resolvePlatformModelSelection(
  groups: readonly PlatformModelProviderGroup[],
  preferredProvider: string,
  preferredModelId: string,
): { provider: string; modelId: string } | null {
  const preferredGroup = groups.find((group) => group.provider === preferredProvider)
  const preferredModel = preferredGroup?.models.find(
    (model) => model.modelId === preferredModelId,
  )

  if (preferredGroup && preferredModel) {
    return {
      provider: preferredGroup.provider,
      modelId: preferredModel.modelId,
    }
  }

  if (preferredGroup?.models[0]) {
    return {
      provider: preferredGroup.provider,
      modelId: preferredGroup.models[0].modelId,
    }
  }

  const firstGroup = groups[0]
  const firstModel = firstGroup?.models[0]

  if (!firstGroup || !firstModel) {
    return null
  }

  return {
    provider: firstGroup.provider,
    modelId: firstModel.modelId,
  }
}
