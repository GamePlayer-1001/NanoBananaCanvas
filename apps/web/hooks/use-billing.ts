/**
 * [INPUT]: 依赖 @tanstack/react-query, 依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useSubscription / usePackages / useCheckout / usePortal / useCancelSubscription / useTransactions / useTopup
 * [POS]: hooks 的账单数据层，被 profile/billing 页面消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

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

/* ─── Hooks ──────────────────────────────────────────── */

export function useSubscription() {
  return useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: () => fetchJson('/api/billing/subscription'),
  })
}

export function usePackages() {
  return useQuery({
    queryKey: queryKeys.billing.packages(),
    queryFn: () => fetchJson('/api/billing/packages'),
  })
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (input: { plan: string; billingPeriod?: 'monthly' | 'yearly'; currency?: 'usd' | 'cny' }) => {
      const data = await fetchJson<{ url: string }>('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      window.location.href = data.url
    },
  })
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const data = await fetchJson<{ url: string }>('/api/billing/portal', {
        method: 'POST',
      })
      window.location.href = data.url
    },
  })
}

export function useCancelSubscription() {
  return useMutation({
    mutationFn: () =>
      fetchJson('/api/billing/cancel', { method: 'POST' }),
  })
}

export function useTransactions() {
  return useQuery({
    queryKey: queryKeys.credits.transactions(),
    queryFn: () =>
      fetchJson<{
        items: Array<{
          id: string
          type: string
          amount: number
          description: string
          created_at: string
        }>
      }>('/api/credits/transactions'),
  })
}

export function useTopup() {
  return useMutation({
    mutationFn: async (input: { packageId: string; currency?: 'usd' | 'cny' }) => {
      const data = await fetchJson<{ url: string }>('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      window.location.href = data.url
    },
  })
}
