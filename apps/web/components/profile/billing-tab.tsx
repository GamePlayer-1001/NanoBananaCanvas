/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-user 的 useCreditsBalance，
 *          依赖 ./payment-history, ./usage-chart
 * [OUTPUT]: 对外提供 BillingTab 账单面板 (积分余额 + 使用统计 + 交易历史)
 * [POS]: profile 的账单 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import { useCreditsBalance } from '@/hooks/use-user'
import { PaymentHistory } from './payment-history'
import { UsageChart } from './usage-chart'

/* ─── Component ──────────────────────────────────────── */

export function BillingTab() {
  const t = useTranslations('billing')
  const { data: balance } = useCreditsBalance()

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('credits')}</h3>

      {/* 积分卡片 */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-brand-50 to-white p-5">
        <div>
          <p className="text-sm text-muted-foreground">{t('credits')}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {balance?.available ?? 0}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('remaining', { count: balance?.available ?? 0 })}
          </p>
        </div>
      </div>

      {/* 使用统计图表 */}
      <UsageChart />

      {/* 交易历史 */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">{t('transactions')}</h4>
        <PaymentHistory />
      </div>
    </div>
  )
}
