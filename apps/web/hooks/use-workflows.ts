/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useWorkflows / useWorkflow / useCreateWorkflow / useImportLocalWorkflow / useUpdateWorkflow / useDeleteWorkflow / usePublishWorkflow / useUnpublishWorkflow
 * [POS]: hooks 的工作流数据层，被 workspace/canvas 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

interface WorkflowListParams {
  page?: number
  limit?: number
  folder?: string | null
}

interface WorkflowQueryOptions {
  enabled?: boolean
}

interface CreateWorkflowInput {
  name: string
  description?: string
  data?: string
  folderId?: string | null
  template?: {
    id: string
    key: string
    name: string
    description: string
    goal: string
    category: string
    targetAudience: string[]
    applicableIndustries: string[]
    recommendedStyles: string[]
    defaultPrompt?: string
    defaultModel?: string
    defaultOutputSpec?: {
      modality?: 'text' | 'image' | 'video' | 'audio' | 'mixed'
      count?: number
      aspectRatio?: string
    }
    source: 'system-template' | 'user-template'
    createdFromWorkflowId?: string
  }
}

interface CreateWorkflowResult {
  id: string
  name: string
  description: string
}

interface UpdateWorkflowInput {
  name?: string
  description?: string
  data?: unknown
  isPublic?: boolean
}

/* ─── Fetchers ───────────────────────────────────────── */

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

export function useWorkflows(params?: WorkflowListParams, options?: WorkflowQueryOptions) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.folder) qs.set('folder', params.folder)
  const query = qs.toString()

  return useQuery({
    queryKey: queryKeys.workflows.list(params),
    queryFn: () => fetchJson(`/api/workflows${query ? `?${query}` : ''}`),
    enabled: options?.enabled,
  })
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(id),
    queryFn: () => fetchJson(`/api/workflows/${id}`),
    enabled: !!id,
  })
}

export function useCreateWorkflow() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) =>
      fetchJson<CreateWorkflowResult>('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}

export function useImportLocalWorkflow() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateWorkflowInput) =>
      fetchJson<CreateWorkflowResult>('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}

export function useUpdateWorkflow(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateWorkflowInput) =>
      fetchJson(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}

export function useDeleteWorkflow() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/workflows/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
    },
  })
}

export function usePublishWorkflow(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { categoryId: string; thumbnail?: string }) =>
      fetchJson(`/api/workflows/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}

export function useUnpublishWorkflow(id: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetchJson(`/api/workflows/${id}/publish`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workflows.all })
      qc.invalidateQueries({ queryKey: queryKeys.explore.all })
    },
  })
}
