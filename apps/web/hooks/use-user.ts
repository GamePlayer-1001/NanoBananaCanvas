/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useCurrentUser
 * [POS]: hooks 的用户数据层，被 profile 等账户面板消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'

/* ─── Fetcher ────────────────────────────────────────── */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

/* ─── Types ──────────────────────────────────────────── */

export interface UserProfile {
  id: string
  actorId: string
  actorKind: 'anonymous' | 'clerk'
  isAuthenticated: boolean
  identityKey: string
  clerkUserId?: string | null
  username: string
  firstName: string
  lastName: string
  name: string
  email: string
  avatarUrl?: string
  tier: string
  plan: string
  membershipStatus: string
  createdAt: string
}

/* ─── Hooks ──────────────────────────────────────────── */

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => fetchJson<UserProfile>('/api/users/me'),
  })
}
