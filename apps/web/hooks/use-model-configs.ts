/**
 * [INPUT]: 依赖 @tanstack/react-query，依赖 @/lib/query/keys
 * [OUTPUT]: 对外提供 useModelConfigs 账号 API 接入配置数据 hook
 * [POS]: hooks 的模型配置数据层，被账户页面和节点配置面板共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

export interface ModelConfigItem {
  id: string
  configId: string
  label: string | null
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string | null
  capability: 'text' | 'image' | 'video' | 'audio'
  providerKind?: string
  providerId?: string
  modelId?: string
  baseUrl?: string
  hasSecretKey?: boolean
  maskedKey?: string
  imageCapabilities?: {
    minPixels?: number
    maxPixels?: number
    maxLongEdge?: number
    allowedSizes?: Array<'720p' | '1k' | '2k' | '4k' | '8k'>
    allowedAspectRatios?: Array<'1:1' | '2:3' | '3:2' | '9:16' | '16:9'>
    learnedFrom?: string
    learnedAt?: string
  }
}

interface ApiKeysResponse {
  ok: true
  data: {
    keys: ModelConfigItem[]
  }
}

async function fetchModelConfigs(): Promise<ModelConfigItem[]> {
  const res = await fetch('/api/settings/api-keys', { cache: 'no-store' })
  const payload = (await res.json()) as ApiKeysResponse | { error?: { message?: string } }
  if (!res.ok || !('data' in payload)) {
    const errorMessage = 'error' in payload ? payload.error?.message : undefined
    throw new Error(errorMessage ?? 'Failed to load model configs')
  }
  return payload.data.keys
}

export function useModelConfigs() {
  const query = useQuery({
    queryKey: queryKeys.settings.apiKeys(),
    queryFn: fetchModelConfigs,
    retry: false,
  })

  const configsByCapability = useMemo(() => {
    const items = query.data ?? []
    const map = new Map<string, ModelConfigItem[]>()

    for (const item of items) {
      const current = map.get(item.capability) ?? []
      current.push(item)
      map.set(item.capability, current)
    }

    return map
  }, [query.data])

  const configMap = useMemo(
    () => new Map((query.data ?? []).map((item) => [item.configId, item])),
    [query.data],
  )

  return {
    ...query,
    items: query.data ?? [],
    configsByCapability,
    getConfigsByCapability: (capability: 'text' | 'image' | 'video' | 'audio') =>
      configsByCapability.get(capability) ?? [],
    getConfigByCapability: (capability: 'text' | 'image' | 'video' | 'audio') =>
      (configsByCapability.get(capability) ?? []).find((item) => item.isActive),
    getConfigById: (configId?: string | null) =>
      (configId ? configMap.get(configId) : undefined),
  }
}
