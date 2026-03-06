/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-user 的 useCreditsBalance
 * [OUTPUT]: 对外提供 BillingTab 账单面板 (积分余额 + 交易历史)
 * [POS]: profile 的账单 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { CreditCard, ArrowUpRight } from 'lucide-react'

import { useCreditsBalance } from '@/hooks/use-user'

/* ─── Component ──────────────────────────────────────── */

export function BillingTab() {
  const t = useTranslations('billing')
  const { data: balance } = useCreditsBalance()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('credits')}</h3>

      {/* 积分卡片 */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-brand-50 to-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('credits')}</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {(balance as { balance?: number })?.balance ?? 0}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t('remaining', { count: (balance as { balance?: number })?.balance ?? 0 })}
            </p>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600">
            <ArrowUpRight size={14} />
            {t('topUp')}
          </button>
        </div>
      </div>

      {/* 交易历史 */}
      <div>
        <h4 className="text-sm font-medium text-foreground">{t('transactions')}</h4>
        <div className="mt-3 flex flex-col items-center rounded-xl border border-dashed border-border py-10">
          <CreditCard size={28} className="text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">No transactions yet</p>
        </div>
      </div>
    </div>
  )
}
