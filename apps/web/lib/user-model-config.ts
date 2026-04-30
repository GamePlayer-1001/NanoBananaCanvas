/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供账号级模型配置槽位定义与配置编解码工具
 * [POS]: lib 的用户模型配置契约层，被设置 API、AI 执行路由和异步任务服务共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { CapabilityId } from '@/lib/model-config-catalog'
import {
  isImageAspectRatio,
  isImageSizePreset,
} from '@/lib/image-model-capabilities'
import type {
  ImageModelCapabilities,
} from '@/lib/image-model-capabilities'

/* ─── Slot Definitions ──────────────────────────────── */

export const PRIMARY_USER_MODEL_CONFIG_SLOTS = {
  text: {
    capability: 'text',
    providerKind: 'openai-compatible',
    legacySlots: ['llm-openai'],
  },
  image: {
    capability: 'image',
    providerKind: 'openai-compatible',
    legacySlots: ['image-openai', 'image-google'],
  },
  video: {
    capability: 'video',
    providerKind: 'kling',
    legacySlots: [],
  },
  audio: {
    capability: 'audio',
    providerKind: 'openai-audio',
    legacySlots: [],
  },
} as const

const LEGACY_USER_MODEL_CONFIG_SLOTS = {
  'llm-openai': {
    capability: 'text',
    providerKind: 'openai-compatible',
    legacySlots: [],
  },
  'image-openai': {
    capability: 'image',
    providerKind: 'openai-compatible',
    legacySlots: [],
  },
  'image-google': {
    capability: 'image',
    providerKind: 'google-image',
    legacySlots: [],
  },
} as const

export const USER_MODEL_CONFIG_SLOTS = {
  ...PRIMARY_USER_MODEL_CONFIG_SLOTS,
  ...LEGACY_USER_MODEL_CONFIG_SLOTS,
} as const

export type UserModelPrimarySlotId = keyof typeof PRIMARY_USER_MODEL_CONFIG_SLOTS
export type UserModelConfigSlotId = keyof typeof USER_MODEL_CONFIG_SLOTS
export type UserModelCapability = (typeof USER_MODEL_CONFIG_SLOTS)[UserModelConfigSlotId]['capability']
export type UserModelProviderKind =
  | 'openai-compatible'
  | 'openrouter'
  | 'google-image'
  | 'gemini'
  | 'kling'
  | 'openai-audio'

export function isUserModelConfigSlotId(value: string): value is UserModelConfigSlotId {
  return value in USER_MODEL_CONFIG_SLOTS
}

export function isPrimaryUserModelSlotId(value: string): value is UserModelPrimarySlotId {
  return value in PRIMARY_USER_MODEL_CONFIG_SLOTS
}

export function isUserModelCapability(value: string): value is CapabilityId {
  return value === 'text' || value === 'image' || value === 'video' || value === 'audio'
}

export function getSlotLookupOrder(slotId: UserModelConfigSlotId): UserModelConfigSlotId[] {
  if (!isPrimaryUserModelSlotId(slotId)) return [slotId]
  return [slotId, ...PRIMARY_USER_MODEL_CONFIG_SLOTS[slotId].legacySlots]
}

export function getLegacyCapability(slotId: string): CapabilityId | undefined {
  if (!isUserModelConfigSlotId(slotId)) return undefined
  return USER_MODEL_CONFIG_SLOTS[slotId].capability
}

/* ─── Stored Payload ─────────────────────────────────── */

export interface UserModelConfigPayload {
  version: 1 | 2 | 3 | 4
  capability: CapabilityId
  providerKind: UserModelProviderKind
  providerId?: string
  apiKey: string
  modelId: string
  baseUrl?: string
  secretKey?: string
  imageCapabilities?: ImageModelCapabilities
}

export interface PublicUserModelConfig {
  configId: string
  capability: CapabilityId
  providerKind: UserModelProviderKind
  providerId: string
  modelId: string
  baseUrl?: string
  hasSecretKey: boolean
  maskedKey: string
  imageCapabilities?: ImageModelCapabilities
}

export interface UserModelRuntimeConfig {
  configId: string
  capability: CapabilityId
  providerKind: UserModelProviderKind
  providerId: string
  apiKey: string
  modelId: string
  baseUrl?: string
  secretKey?: string
  imageCapabilities?: ImageModelCapabilities
}

export function serializeUserModelConfig(payload: UserModelConfigPayload): string {
  return JSON.stringify(payload)
}

export function deserializeUserModelConfig(
  configId: string,
  decrypted: string,
): UserModelConfigPayload {
  try {
    const parsed = JSON.parse(decrypted) as Partial<UserModelConfigPayload>
    if (
      parsed &&
      (parsed.version === 1 || parsed.version === 2 || parsed.version === 3 || parsed.version === 4) &&
      typeof parsed.apiKey === 'string' &&
      typeof parsed.modelId === 'string' &&
      isProviderKind(parsed.providerKind) &&
      isResolvedCapability(parsed.capability, configId)
    ) {
      return {
        version: parsed.version,
        capability: parsed.capability,
        providerKind: parsed.providerKind,
        providerId: normalizeProviderId(parsed.providerId),
        apiKey: parsed.apiKey,
        modelId: parsed.modelId,
        baseUrl: normalizeOptionalBaseUrl(parsed.baseUrl),
        secretKey: normalizeOptionalSecretKey(parsed.secretKey),
        imageCapabilities: normalizeImageCapabilities(parsed.imageCapabilities),
      }
    }
  } catch {
    /* legacy plain key fallback below */
  }

  const capability = getLegacyCapability(configId)
  if (!capability) {
    throw new Error(`Config ${configId} cannot be resolved to a capability`)
  }
  const slot = USER_MODEL_CONFIG_SLOTS[configId as UserModelConfigSlotId]
  return {
    version: 1,
    capability,
    providerKind: slot.providerKind,
    apiKey: decrypted,
    modelId: '',
    baseUrl: undefined,
    secretKey: undefined,
    imageCapabilities: undefined,
  }
}

export function toPublicUserModelConfig(
  configId: string,
  payload: UserModelConfigPayload,
  maskedKey: string,
): PublicUserModelConfig {
  return {
    configId,
    capability: payload.capability,
    providerKind: payload.providerKind,
    providerId: payload.providerId ?? toRuntimeProviderId(payload.providerKind),
    modelId: payload.modelId,
    baseUrl: normalizeOptionalBaseUrl(payload.baseUrl),
    hasSecretKey: !!normalizeOptionalSecretKey(payload.secretKey),
    maskedKey,
    imageCapabilities: normalizeImageCapabilities(payload.imageCapabilities),
  }
}

export function toRuntimeUserModelConfig(
  configId: string,
  payload: UserModelConfigPayload,
): UserModelRuntimeConfig {
  return {
    configId,
    capability: payload.capability,
    providerKind: payload.providerKind,
    providerId: payload.providerId ?? toRuntimeProviderId(payload.providerKind),
    apiKey: payload.apiKey,
    modelId: payload.modelId,
    baseUrl: normalizeOptionalBaseUrl(payload.baseUrl),
    secretKey: normalizeOptionalSecretKey(payload.secretKey),
    imageCapabilities: normalizeImageCapabilities(payload.imageCapabilities),
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

function normalizeOptionalSecretKey(secretKey: unknown): string | undefined {
  if (typeof secretKey !== 'string') return undefined
  const trimmed = secretKey.trim()
  return trimmed ? trimmed : undefined
}

function normalizeProviderId(providerId: unknown): string | undefined {
  if (typeof providerId !== 'string') return undefined
  const trimmed = providerId.trim()
  return trimmed ? trimmed : undefined
}

function normalizeImageCapabilities(value: unknown): ImageModelCapabilities | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const raw = value as Partial<ImageModelCapabilities> & {
    allowedSizes?: unknown
    allowedAspectRatios?: unknown
    learnedFrom?: unknown
    learnedAt?: unknown
  }

  const allowedSizes = Array.isArray(raw.allowedSizes)
    ? raw.allowedSizes.filter(isImageSizePreset)
    : undefined
  const allowedAspectRatios = Array.isArray(raw.allowedAspectRatios)
    ? raw.allowedAspectRatios.filter(isImageAspectRatio)
    : undefined

  const normalized: ImageModelCapabilities = {
    minPixels: normalizeOptionalPositiveInteger(raw.minPixels),
    maxPixels: normalizeOptionalPositiveInteger(raw.maxPixels),
    maxLongEdge: normalizeOptionalPositiveInteger(raw.maxLongEdge),
    allowedSizes: allowedSizes?.length ? allowedSizes : undefined,
    allowedAspectRatios: allowedAspectRatios?.length ? allowedAspectRatios : undefined,
    learnedFrom: typeof raw.learnedFrom === 'string' && raw.learnedFrom.trim()
      ? raw.learnedFrom.trim()
      : undefined,
    learnedAt: typeof raw.learnedAt === 'string' && raw.learnedAt.trim()
      ? raw.learnedAt.trim()
      : undefined,
  }

  if (!Object.values(normalized).some(Boolean)) {
    return undefined
  }

  return normalized
}

function normalizeOptionalPositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value)
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed)
    }
  }

  return undefined
}

function isResolvedCapability(capability: unknown, configId: string): capability is CapabilityId {
  if (isUserModelCapability(String(capability))) return true
  return Boolean(getLegacyCapability(configId))
}

function isProviderKind(value: unknown): value is UserModelProviderKind {
  return (
    value === 'openai-compatible' ||
    value === 'openrouter' ||
    value === 'google-image' ||
    value === 'gemini' ||
    value === 'kling' ||
    value === 'openai-audio'
  )
}

function toRuntimeProviderId(providerKind: UserModelProviderKind): string {
  switch (providerKind) {
    case 'google-image':
    case 'gemini':
      return 'gemini'
    case 'kling':
      return 'kling'
    case 'openai-audio':
      return 'openai'
    case 'openrouter':
      return 'openrouter'
    case 'openai-compatible':
    default:
      return 'openai-compatible'
  }
}
