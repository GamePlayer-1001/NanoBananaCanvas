/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useCategories
 * [POS]: hooks 的分类数据层，被 explore/workflow 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

export interface Category {
  id: string
  slug: string
  name: string
  translations: Record<string, string>
}

/* ─── Fetcher ────────────────────────────────────────── */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json()
  return json.data as T
}

/* ─── Hook ───────────────────────────────────────────── */

export function useCategories(locale?: string) {
  return useQuery({
    queryKey: queryKeys.categories.list(locale),
    queryFn: () => {
      const qs = locale ? `?locale=${locale}` : ''
      return fetchJson<Category[]>(`/api/categories${qs}`)
    },
    staleTime: 5 * 60 * 1000,
  })
}
