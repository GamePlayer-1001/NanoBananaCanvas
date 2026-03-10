/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useFolders / useCreateFolder
 * [POS]: hooks 的文件夹数据层，被 app-sidebar 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

interface Folder {
  id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

interface CreateFolderResult {
  id: string
  name: string
  sort_order: number
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

export function useFolders() {
  return useQuery<Folder[]>({
    queryKey: queryKeys.folders.list(),
    queryFn: () => fetchJson<Folder[]>('/api/folders'),
  })
}

export function useCreateFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { name?: string }) =>
      fetchJson<CreateFolderResult>('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.folders.all })
    },
  })
}
