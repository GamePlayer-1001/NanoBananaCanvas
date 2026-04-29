/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys，依赖 @/lib/platform-models 的统一目录类型
 * [OUTPUT]: 对外提供 useAIModels
 * [POS]: hooks 的 AI 模型目录数据层，被 video-analysis/canvas 平台模型选择器消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import type { PlatformModelCatalogItem } from '@/lib/platform-models'
import { queryKeys } from '@/lib/query/keys'

/* ─── Fetcher ────────────────────────────────────────── */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json()
  return json.data as T
}

/* ─── Hook ───────────────────────────────────────────── */

export function useAIModels(category?: string) {
  return useQuery({
    queryKey: queryKeys.ai.models(category),
    queryFn: () => {
      const qs = category ? `?category=${category}` : ''
      return fetchJson<PlatformModelCatalogItem[]>(`/api/ai/models${qs}`)
    },
    staleTime: 10 * 60 * 1000,
  })
}
