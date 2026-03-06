/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/hooks/use-billing 的 useTransactions，
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 PaymentHistory 交易历史组件
 * [POS]: profile 的交易记录，被 billing-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { CreditCard, Loader2, ArrowDown, ArrowUp } from 'lucide-react'

import { useTransactions } from '@/hooks/use-billing'

/* ─── Component ──────────────────────────────────────── */

export function PaymentHistory() {
  const t = useTranslations('billing')
  const { data, isLoading } = useTransactions()
  const items = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-10">
        <CreditCard size={28} className="text-muted-foreground/30" />
        <p className="mt-2 text-sm text-muted-foreground">{t('noTransactions')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          {/* 图标 */}
          {tx.amount > 0 ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <ArrowDown size={14} className="text-emerald-500" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
              <ArrowUp size={14} className="text-orange-500" />
            </div>
          )}

          {/* 描述 */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{tx.description}</p>
            <p className="text-xs text-muted-foreground">{tx.created_at}</p>
          </div>

          {/* 金额 */}
          <span
            className={`text-sm font-medium ${
              tx.amount > 0 ? 'text-emerald-600' : 'text-orange-600'
            }`}
          >
            {tx.amount > 0 ? '+' : ''}{tx.amount}
          </span>
        </div>
      ))}
    </div>
  )
}
