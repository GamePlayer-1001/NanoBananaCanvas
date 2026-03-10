/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-user 的 useCreditsBalance，
 *          依赖 ./payment-history, ./topup-dialog, ./usage-chart
 * [OUTPUT]: 对外提供 BillingTab 账单面板 (积分余额 + 使用统计 + 充值 + 交易历史)
 * [POS]: profile 的账单 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'

import { useCreditsBalance } from '@/hooks/use-user'
import { PaymentHistory } from './payment-history'
import { TopupDialog } from './topup-dialog'
import { UsageChart } from './usage-chart'

/* ─── Component ──────────────────────────────────────── */

export function BillingTab() {
  const t = useTranslations('billing')
  const { data: balance } = useCreditsBalance()
  const [topupOpen, setTopupOpen] = useState(false)

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
          <button
            onClick={() => setTopupOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <ArrowUpRight size={14} />
            {t('topUp')}
          </button>
        </div>
      </div>

      {/* 使用统计图表 */}
      <UsageChart />

      {/* 交易历史 */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-foreground">{t('transactions')}</h4>
        <PaymentHistory />
      </div>

      {/* 充值弹窗 */}
      <TopupDialog open={topupOpen} onOpenChange={setTopupOpen} />
    </div>
  )
}
