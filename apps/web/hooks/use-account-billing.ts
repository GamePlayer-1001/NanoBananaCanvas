/**
 * [INPUT]: 依赖 react 的 useEffect/useState，依赖 @/lib/billing/credits 类型
 * [OUTPUT]: 对外提供 useBillingTransactions / useBillingUsage，按需读取账户页重查询数据
 * [POS]: hooks 的账户账单懒加载层，被 dashboard 页签消费，避免账户首页首屏提前打重查询
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useQuery } from '@tanstack/react-query'

import type { CreditTransactionsResult, CreditUsageResult } from '@/lib/billing/credits'
import { queryKeys } from '@/lib/query/keys'

const EMPTY_TRANSACTIONS: CreditTransactionsResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  hasMore: false,
}

const EMPTY_USAGE: CreditUsageResult = {
  windowDays: 30,
  summary: {
    totalRequests: 0,
    successCount: 0,
    failedCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCreditsSpent: 0,
  },
  byModel: [],
  daily: [],
}

export function useBillingTransactions(enabled: boolean) {
  const query = useQuery({
    queryKey: [...queryKeys.billing.all, 'transactions', 1, 10] as const,
    queryFn: async () => {
      const res = await fetch('/api/credits/transactions?page=1&pageSize=10', {
        cache: 'no-store',
      })
      const payload = (await res.json()) as { data?: CreditTransactionsResult }
      return payload.data ?? EMPTY_TRANSACTIONS
    },
    enabled,
    staleTime: 60_000,
  })

  return query.data ?? EMPTY_TRANSACTIONS
}

export function useBillingUsage(enabled: boolean) {
  const query = useQuery({
    queryKey: [...queryKeys.billing.all, 'usage', 30] as const,
    queryFn: async () => {
      const res = await fetch('/api/credits/usage?windowDays=30', {
        cache: 'no-store',
      })
      const payload = (await res.json()) as { data?: CreditUsageResult }
      return payload.data ?? EMPTY_USAGE
    },
    enabled,
    staleTime: 60_000,
  })

  return query.data ?? EMPTY_USAGE
}
