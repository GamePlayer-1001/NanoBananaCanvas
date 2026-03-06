/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useExplore / useExploreSearch / useToggleLike / useToggleFavorite / useCloneWorkflow
 * [POS]: hooks 的社区广场数据层，被 explore 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

interface ExploreParams {
  category?: string
  sort?: string
  page?: number
  limit?: number
}

/* ─── Fetcher ────────────────────────────────────────── */

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

/* ─── Hooks ──────────────────────────────────────────── */

export function useExplore(params?: ExploreParams) {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.sort) qs.set('sort', params.sort)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  return useQuery({
    queryKey: queryKeys.explore.list(params as Record<string, unknown>),
    queryFn: () => fetchJson(`/api/explore${query ? `?${query}` : ''}`),
  })
}

export function useExploreSearch(q: string, page?: number) {
  return useQuery({
    queryKey: queryKeys.explore.search(q, page),
    queryFn: () => {
      const qs = new URLSearchParams({ q })
      if (page) qs.set('page', String(page))
      return fetchJson(`/api/explore/search?${qs}`)
    },
    enabled: q.length > 0,
  })
}

export function useToggleLike() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}/like`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}/favorite`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}

export function useCloneWorkflow() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}/clone`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}
