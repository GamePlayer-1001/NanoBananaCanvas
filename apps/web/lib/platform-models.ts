/**
 * [INPUT]: 依赖无外部模块
 * [OUTPUT]: 对外提供平台模型目录类型、Provider 显示名与按 Provider 分组/选中解析工具
 * [POS]: lib 的平台模型目录语义层，被 /api/ai/models 消费方节点共享，负责把统一目录转成可渲染的 Provider/Model 结构
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

export function getPlatformProviderLabel(provider: string): string {
  return PLATFORM_PROVIDER_LABELS[provider] ?? provider
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
