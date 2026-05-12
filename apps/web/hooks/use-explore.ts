/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useExplore / useExploreDetail / useExploreSearch / useToggleLike / useToggleFavorite / useCloneWorkflow / useReportWorkflow / usePublishOutput
 * [POS]: hooks 的社区广场数据层，被 explore 页面 + explore 详情页消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import type { ExploreQuery } from '@/lib/validations/explore'

/* ─── Types ──────────────────────────────────────────── */

interface ExploreParams {
  category?: string
  sort?: ExploreQuery['sort']
  type?: ExploreQuery['type']
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
  if (params?.type && params.type !== 'all') qs.set('type', params.type)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString()

  return useQuery({
    queryKey: queryKeys.explore.list(params as Record<string, unknown>),
    queryFn: () => fetchJson(`/api/explore${query ? `?${query}` : ''}`),
    staleTime: 5_000,
    refetchOnMount: true,
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
    staleTime: 5_000,
    refetchOnMount: true,
  })
}

export function useToggleLike() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; entityType?: 'workflow' | 'output' }) =>
      fetchJson(
        input.entityType === 'output'
          ? `/api/explore/outputs/${input.id}/like`
          : `/api/workflows/${input.id}/like`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; entityType?: 'workflow' | 'output' }) =>
      fetchJson(
        input.entityType === 'output'
          ? `/api/explore/outputs/${input.id}/favorite`
          : `/api/workflows/${input.id}/favorite`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}

export function useExploreDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.explore.detail(id),
    queryFn: () => fetchJson(`/api/explore/${id}`),
    enabled: !!id,
    staleTime: 5_000,
    refetchOnMount: true,
  })
}

export function useCloneWorkflow() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; entityType?: 'workflow' | 'output' }) =>
      fetchJson<{ id: string; clonedFrom: string }>(
        input.entityType === 'output'
          ? `/api/explore/outputs/${input.id}/clone`
          : `/api/workflows/${input.id}/clone`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}

export function useReportWorkflow() {
  return useMutation({
    mutationFn: (input: {
      id: string
      reason: string
      description?: string
      entityType?: 'workflow' | 'output'
    }) =>
      fetchJson(
        input.entityType === 'output'
          ? `/api/explore/outputs/${input.id}/report`
          : `/api/workflows/${input.id}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: input.reason, description: input.description }),
        },
      ),
  })
}

export function usePublishOutput() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: {
      taskId: string
      title: string
      description?: string
      prompt?: string
      sourceUrl?: string
      thumbnail?: string
    }) =>
      fetchJson<{ id: string; published: boolean }>('/api/explore/outputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
      qc.invalidateQueries({ queryKey: queryKeys.tasks.all })
    },
  })
}
