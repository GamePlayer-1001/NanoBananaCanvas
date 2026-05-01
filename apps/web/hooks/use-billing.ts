/**
 * [INPUT]: 依赖 @tanstack/react-query，依赖 @/lib/query/keys 的 queryKeys
 * [OUTPUT]: 对外提供 useCreditBalance 当前用户积分余额数据
 * [POS]: hooks 的账单数据层，被 sidebar/billing 等界面消费，负责读取本地账本余额摘要
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/keys'
import type { CreditBalanceSummary } from '@/lib/billing/credits'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data as T
}

export function useCreditBalance(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.balance(),
    queryFn: () => fetchJson<CreditBalanceSummary>('/api/credits/balance'),
    enabled,
  })
}

export interface DailySigninStatus {
  status: 'available' | 'claimed' | 'unavailable'
  available: boolean
  checkedInToday: boolean
  trialBalance: number
  trialExpiresAt: string | null
}

export function useDailySigninStatus(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.signinStatus(),
    queryFn: () => fetchJson<DailySigninStatus>('/api/credits/signin'),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
}
