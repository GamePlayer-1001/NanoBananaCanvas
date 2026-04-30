/**
 * [INPUT]: 依赖 @/lib/api-key-crypto 的脱敏工具，依赖 @/lib/user-model-config 的运行时类型，依赖浏览器 localStorage
 * [OUTPUT]: 对外提供本地临时 API Key 配置的读写、订阅、公开视图与运行时配置转换工具
 * [POS]: lib 的访客临时模型配置层，被账户配置页、节点执行器与模型配置 hook 共同消费，专供本地联调用例
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { maskApiKey } from '@/lib/api-key-crypto'
import type { CapabilityId } from '@/lib/model-config-catalog'
import type {
  ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import type {
  PublicUserModelConfig,
  UserModelProviderKind,
  UserModelRuntimeConfig,
} from '@/lib/user-model-config'

export const GUEST_MODEL_CONFIG_STORAGE_KEY = 'guest-model-configs:v1'
export const GUEST_MODEL_CONFIG_CHANGE_EVENT = 'guest-model-configs:change'
export const GUEST_MODEL_CONFIG_ID_PREFIX = 'guest_'

export interface GuestModelConfigRecord {
  configId: string
  capability: CapabilityId
  providerKind: UserModelProviderKind
  providerId: string
  modelId: string
  apiKey: string
  baseUrl?: string
  secretKey?: string
  label?: string | null
  imageCapabilities?: ImageModelCapabilities
  createdAt: string
  updatedAt: string
  lastUsedAt?: string | null
}

export interface GuestModelConfigMutationInput {
  configId?: string
  capability: CapabilityId
  providerKind: UserModelProviderKind
  providerId: string
  modelId: string
  apiKey: string
  baseUrl?: string
  secretKey?: string
  label?: string | null
  imageCapabilities?: ImageModelCapabilities
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function normalizeText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function dispatchGuestConfigChange() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(GUEST_MODEL_CONFIG_CHANGE_EVENT))
}

function createConfigId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${GUEST_MODEL_CONFIG_ID_PREFIX}${crypto.randomUUID()}`
  }
  return `${GUEST_MODEL_CONFIG_ID_PREFIX}${Date.now()}`
}

function sanitizeRecord(
  input: Partial<GuestModelConfigRecord>,
): GuestModelConfigRecord | null {
  if (
    !input ||
    typeof input.configId !== 'string' ||
    typeof input.capability !== 'string' ||
    typeof input.providerKind !== 'string' ||
    typeof input.providerId !== 'string' ||
    typeof input.modelId !== 'string' ||
    typeof input.apiKey !== 'string'
  ) {
    return null
  }

  const configId = input.configId.trim()
  const capability = input.capability.trim() as CapabilityId
  const providerKind = input.providerKind.trim() as UserModelProviderKind
  const providerId = input.providerId.trim()
  const modelId = input.modelId.trim()
  const apiKey = input.apiKey.trim()

  if (!configId || !providerId || !modelId || !apiKey) {
    return null
  }

  return {
    configId,
    capability,
    providerKind,
    providerId,
    modelId,
    apiKey,
    baseUrl: normalizeText(input.baseUrl),
    secretKey: normalizeText(input.secretKey),
    label: normalizeText(input.label ?? undefined) ?? null,
    imageCapabilities: input.imageCapabilities,
    createdAt: normalizeText(input.createdAt) ?? new Date().toISOString(),
    updatedAt: normalizeText(input.updatedAt) ?? new Date().toISOString(),
    lastUsedAt: normalizeText(input.lastUsedAt ?? undefined) ?? null,
  }
}

export function isGuestModelConfigId(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(GUEST_MODEL_CONFIG_ID_PREFIX))
}

export function readGuestModelConfigRecords(): GuestModelConfigRecord[] {
  if (!isBrowser()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(GUEST_MODEL_CONFIG_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => sanitizeRecord(item as Partial<GuestModelConfigRecord>))
      .filter((item): item is GuestModelConfigRecord => Boolean(item))
  } catch {
    return []
  }
}

function writeGuestModelConfigRecords(records: GuestModelConfigRecord[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(GUEST_MODEL_CONFIG_STORAGE_KEY, JSON.stringify(records))
  dispatchGuestConfigChange()
}

export function upsertGuestModelConfig(
  input: GuestModelConfigMutationInput,
): GuestModelConfigRecord {
  const records = readGuestModelConfigRecords()
  const now = new Date().toISOString()
  const configId = normalizeText(input.configId) ?? createConfigId()
  const existing = records.find((item) => item.configId === configId)

  const nextRecord: GuestModelConfigRecord = {
    configId,
    capability: input.capability,
    providerKind: input.providerKind,
    providerId: input.providerId.trim(),
    modelId: input.modelId.trim(),
    apiKey: input.apiKey.trim(),
    baseUrl: normalizeText(input.baseUrl),
    secretKey: normalizeText(input.secretKey),
    label: normalizeText(input.label ?? undefined) ?? null,
    imageCapabilities: input.imageCapabilities,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    lastUsedAt: existing?.lastUsedAt ?? null,
  }

  const nextRecords = existing
    ? records.map((item) => (item.configId === configId ? nextRecord : item))
    : [...records, nextRecord]

  writeGuestModelConfigRecords(nextRecords)
  return nextRecord
}

export function deleteGuestModelConfig(configId: string) {
  const nextRecords = readGuestModelConfigRecords().filter((item) => item.configId !== configId)
  writeGuestModelConfigRecords(nextRecords)
}

export function touchGuestModelConfig(configId: string) {
  const nextRecords = readGuestModelConfigRecords().map((item) =>
    item.configId === configId
      ? { ...item, lastUsedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      : item,
  )
  writeGuestModelConfigRecords(nextRecords)
}

export function subscribeGuestModelConfigs(onStoreChange: () => void): () => void {
  if (!isBrowser()) {
    return () => {}
  }

  const handleStorage = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key && event.key !== GUEST_MODEL_CONFIG_STORAGE_KEY) {
        return
      }
    }
    onStoreChange()
  }

  window.addEventListener('storage', handleStorage)
  window.addEventListener(GUEST_MODEL_CONFIG_CHANGE_EVENT, handleStorage)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(GUEST_MODEL_CONFIG_CHANGE_EVENT, handleStorage)
  }
}

export function toGuestPublicModelConfig(
  record: GuestModelConfigRecord,
): PublicUserModelConfig & {
  id: string
  label: string | null
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string | null
} {
  return {
    id: record.configId,
    label: record.label ?? null,
    isActive: true,
    lastUsedAt: record.lastUsedAt ?? null,
    createdAt: record.createdAt,
    configId: record.configId,
    capability: record.capability,
    providerKind: record.providerKind,
    providerId: record.providerId,
    modelId: record.modelId,
    baseUrl: record.baseUrl,
    hasSecretKey: Boolean(record.secretKey),
    maskedKey: maskApiKey(record.apiKey),
    imageCapabilities: record.imageCapabilities,
  }
}

export function toGuestRuntimeConfig(record: GuestModelConfigRecord): UserModelRuntimeConfig {
  return {
    configId: record.configId,
    capability: record.capability,
    providerKind: record.providerKind,
    providerId: record.providerId,
    modelId: record.modelId,
    apiKey: record.apiKey,
    baseUrl: record.baseUrl,
    secretKey: record.secretKey,
    imageCapabilities: record.imageCapabilities,
  }
}

export function findGuestRuntimeConfig(
  capability: CapabilityId,
  configId?: string,
): UserModelRuntimeConfig | null {
  const records = readGuestModelConfigRecords()
  const matched = configId
    ? records.find((item) => item.configId === configId)
    : records.find((item) => item.capability === capability)

  return matched ? toGuestRuntimeConfig(matched) : null
}
