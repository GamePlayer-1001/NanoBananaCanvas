/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useNotifications / useMarkAsRead
 * [POS]: hooks 的通知数据层，被 profile/notifications-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

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

/* ─── Types ──────────────────────────────────────────── */

export interface Notification {
  id: string
  type: string
  title: string
  body: string
  is_read: number
  created_at: string
}

/* ─── Hooks ──────────────────────────────────────────── */

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page),
    queryFn: () =>
      fetchJson<{
        items: Notification[]
        unread: number
        pagination: { page: number; totalPages: number }
      }>(`/api/notifications?page=${page}`),
  })
}

/** 标记单条或全部已读 */
export function useMarkAsRead() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id?: string) =>
      fetchJson('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
    },
  })
}
