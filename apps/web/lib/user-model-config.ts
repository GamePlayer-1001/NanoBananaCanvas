/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供账号级模型配置槽位定义与配置编解码工具
 * [POS]: lib 的用户模型配置契约层，被设置 API、AI 执行路由和异步任务服务共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Slot Definitions ──────────────────────────────── */

export const USER_MODEL_CONFIG_SLOTS = {
  'llm-openai': {
    capability: 'llm',
    providerKind: 'openai-compatible',
  },
  'image-openai': {
    capability: 'image',
    providerKind: 'openai-compatible',
  },
  'image-google': {
    capability: 'image',
    providerKind: 'google-image',
  },
} as const

export type UserModelConfigSlotId = keyof typeof USER_MODEL_CONFIG_SLOTS
export type UserModelCapability = (typeof USER_MODEL_CONFIG_SLOTS)[UserModelConfigSlotId]['capability']
export type UserModelProviderKind = (typeof USER_MODEL_CONFIG_SLOTS)[UserModelConfigSlotId]['providerKind']

export function isUserModelConfigSlotId(value: string): value is UserModelConfigSlotId {
  return value in USER_MODEL_CONFIG_SLOTS
}

/* ─── Stored Payload ─────────────────────────────────── */

export interface UserModelConfigPayload {
  version: 1
  providerKind: UserModelProviderKind
  apiKey: string
  modelId: string
  baseUrl?: string
}

export interface PublicUserModelConfig {
  slotId: UserModelConfigSlotId
  capability: UserModelCapability
  providerKind: UserModelProviderKind
  modelId: string
  baseUrl?: string
}

export interface UserModelRuntimeConfig {
  slotId: UserModelConfigSlotId
  capability: UserModelCapability
  providerKind: UserModelProviderKind
  providerId: string
  apiKey: string
  modelId: string
  baseUrl?: string
}

export function serializeUserModelConfig(payload: UserModelConfigPayload): string {
  return JSON.stringify(payload)
}

export function deserializeUserModelConfig(
  slotId: UserModelConfigSlotId,
  decrypted: string,
): UserModelConfigPayload {
  try {
    const parsed = JSON.parse(decrypted) as Partial<UserModelConfigPayload>
    if (
      parsed &&
      parsed.version === 1 &&
      typeof parsed.apiKey === 'string' &&
      typeof parsed.modelId === 'string' &&
      isProviderKind(parsed.providerKind)
    ) {
      return {
        version: 1,
        providerKind: parsed.providerKind,
        apiKey: parsed.apiKey,
        modelId: parsed.modelId,
        baseUrl: normalizeOptionalBaseUrl(parsed.baseUrl),
      }
    }
  } catch {
    /* legacy plain key fallback below */
  }

  const slot = USER_MODEL_CONFIG_SLOTS[slotId]
  return {
    version: 1,
    providerKind: slot.providerKind,
    apiKey: decrypted,
    modelId: '',
    baseUrl: undefined,
  }
}

export function toPublicUserModelConfig(
  slotId: UserModelConfigSlotId,
  payload: UserModelConfigPayload,
): PublicUserModelConfig {
  const slot = USER_MODEL_CONFIG_SLOTS[slotId]
  return {
    slotId,
    capability: slot.capability,
    providerKind: payload.providerKind,
    modelId: payload.modelId,
    baseUrl: normalizeOptionalBaseUrl(payload.baseUrl),
  }
}

export function toRuntimeUserModelConfig(
  slotId: UserModelConfigSlotId,
  payload: UserModelConfigPayload,
): UserModelRuntimeConfig {
  const slot = USER_MODEL_CONFIG_SLOTS[slotId]
  return {
    slotId,
    capability: slot.capability,
    providerKind: payload.providerKind,
    providerId: toRuntimeProviderId(payload.providerKind),
    apiKey: payload.apiKey,
    modelId: payload.modelId,
    baseUrl: normalizeOptionalBaseUrl(payload.baseUrl),
  }
}

/* ─── URL Helpers ────────────────────────────────────── */

export function normalizeOpenAIBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '')
}

function normalizeOptionalBaseUrl(baseUrl: unknown): string | undefined {
  if (typeof baseUrl !== 'string') return undefined
  const trimmed = baseUrl.trim()
  return trimmed ? normalizeOpenAIBaseUrl(trimmed) : undefined
}

function isProviderKind(value: unknown): value is UserModelProviderKind {
  return value === 'openai-compatible' || value === 'google-image'
}

function toRuntimeProviderId(providerKind: UserModelProviderKind): string {
  return providerKind === 'google-image' ? 'gemini' : 'openai-compatible'
}
