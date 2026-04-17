/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供能力卡片与 API 接入类型目录、标签查找工具
 * [POS]: lib 的模型配置目录层，被账户页面与节点配置面板共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export type CapabilityId = 'text' | 'image' | 'video' | 'audio'

export interface ModelProviderOption {
  providerId: string
  providerKind:
    | 'openai-compatible'
    | 'google-image'
    | 'gemini'
    | 'kling'
    | 'openai-audio'
  label: string
  requiresBaseUrl?: boolean
  requiresSecretKey?: boolean
  apiKeyLabel?: string
  secretKeyLabel?: string
}

export const MODEL_PROVIDER_OPTIONS: Record<CapabilityId, ModelProviderOption[]> = {
  text: [
    {
      providerId: 'openai-compatible',
      providerKind: 'openai-compatible',
      label: 'OpenAI Compatible',
      requiresBaseUrl: true,
    },
    {
      providerId: 'gemini',
      providerKind: 'gemini',
      label: 'Google Gemini',
    },
  ],
  image: [
    {
      providerId: 'openai-compatible',
      providerKind: 'openai-compatible',
      label: 'OpenAI Compatible',
      requiresBaseUrl: true,
    },
    {
      providerId: 'gemini',
      providerKind: 'google-image',
      label: 'Google Imagen / Gemini',
    },
  ],
  video: [
    {
      providerId: 'kling',
      providerKind: 'kling',
      label: 'Kling',
      requiresSecretKey: true,
      apiKeyLabel: 'Access Key',
      secretKeyLabel: 'Secret Key',
    },
  ],
  audio: [
    {
      providerId: 'openai',
      providerKind: 'openai-audio',
      label: 'OpenAI Audio',
    },
    {
      providerId: 'openai-compatible',
      providerKind: 'openai-compatible',
      label: 'OpenAI Compatible',
      requiresBaseUrl: true,
    },
  ],
}

export function getProviderOption(
  capability: CapabilityId,
  providerId?: string,
): ModelProviderOption | undefined {
  if (!providerId) return MODEL_PROVIDER_OPTIONS[capability][0]
  return MODEL_PROVIDER_OPTIONS[capability].find((item) => item.providerId === providerId)
}

export function getProviderLabel(capability: CapabilityId, providerId?: string): string {
  return getProviderOption(capability, providerId)?.label ?? 'Not configured'
}
