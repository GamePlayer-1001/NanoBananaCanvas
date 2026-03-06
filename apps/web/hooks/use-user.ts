/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useCurrentUser / useCreditsBalance / useCreditsUsage
 * [POS]: hooks 的用户数据层，被 sidebar/profile/billing 消费
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
  clerkId: string
  name: string
  email: string
  avatarUrl?: string
  plan: string
  createdAt: string
}

export interface CreditsBalance {
  subscription: number
  topup: number
  bonus: number
  total: number
}

/* ─── Hooks ──────────────────────────────────────────── */

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => fetchJson<UserProfile>('/api/users/me'),
  })
}

export function useCreditsBalance() {
  return useQuery({
    queryKey: queryKeys.credits.balance(),
    queryFn: () => fetchJson<CreditsBalance>('/api/credits/balance'),
  })
}

export function useCreditsUsage() {
  return useQuery({
    queryKey: queryKeys.credits.all,
    queryFn: () => fetchJson('/api/credits/usage'),
  })
}
