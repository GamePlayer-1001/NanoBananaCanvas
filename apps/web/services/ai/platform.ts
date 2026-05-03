/**
 * [INPUT]: 依赖 @/lib/env，依赖 @/lib/platform-runtime，依赖 ./provider 与 ./openai-compatible
 * [OUTPUT]: 对外提供平台模型运行时供应商解析、平台 Key 读取与平台文本 Provider 构建
 * [POS]: services/ai 的平台运行时门面，被平台模式执行链共享，负责把平台模型映射到内部供应商 API
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireEnv } from '@/lib/env'
import type { PlatformSupplierId } from '@/lib/platform-runtime'

import { OpenAICompatibleClient } from './openai-compatible'
import { getPlatformKey, getProvider } from './provider'
import type { AIProvider } from './types'

const PLATFORM_OPENAI_BASE_URLS: Partial<Record<PlatformSupplierId, string>> = {
  comfly: 'https://ai.comfly.chat/v1',
  dlapi: 'https://api.dlapi.xyz/v1',
}

export function getPlatformSupplierBaseUrl(
  supplierId: PlatformSupplierId,
): string | undefined {
  return PLATFORM_OPENAI_BASE_URLS[supplierId]
}

export async function getPlatformSupplierApiKey(
  supplierId: PlatformSupplierId,
): Promise<string> {
  switch (supplierId) {
    default:
      return getPlatformKey(supplierId)
  }
}

export function createPlatformTextProvider(
  supplierId: PlatformSupplierId,
): AIProvider {
  const baseUrl = getPlatformSupplierBaseUrl(supplierId)

  if (baseUrl && supplierId === 'comfly') {
    return new OpenAICompatibleClient(baseUrl)
  }

  return getProvider(supplierId)
}
