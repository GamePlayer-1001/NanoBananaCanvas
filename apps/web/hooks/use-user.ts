/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useCurrentUser
 * [POS]: hooks 的用户数据层，被 profile 等账户面板消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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
  hasPassword: boolean
  tier: string
  plan: string
  membershipStatus: string
  timezone: string | null
  createdAt: string
}

export interface SidebarBootstrapPayload {
  user: UserProfile
  balance: {
    availableCredits: number
    trialBalance: number
    trialExpiresAt: string | null
    checkedInToday: boolean
  } | null
  signinStatus: {
    status: 'available' | 'claimed' | 'unavailable'
    available: boolean
    checkedInToday: boolean
    trialBalance: number
    trialExpiresAt: string | null
  } | null
  folders: Array<{
    id: string
    name: string
    sort_order: number
    created_at: string
    updated_at: string
    project_count: number
  }>
}

/* ─── Hooks ──────────────────────────────────────────── */

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.profile(),
    queryFn: () => fetchJson<UserProfile>('/api/users/me'),
  })
}

export function useSidebarBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap.sidebar(),
    queryFn: () => fetchJson<SidebarBootstrapPayload>('/api/bootstrap/sidebar'),
    staleTime: 60_000,
  })
}

export function useUpdateUserTimezone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (timezone: string) => {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timezone }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
      }

      const json = await res.json()
      return json.data as { timezone: string }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap.sidebar() })
      await queryClient.invalidateQueries({ queryKey: queryKeys.billing.signinStatus() })
    },
  })
}
