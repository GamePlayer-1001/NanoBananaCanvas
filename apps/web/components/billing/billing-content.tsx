/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/lib/billing/credits 与 @/lib/billing/subscription 的摘要类型，
 *          依赖本目录下的余额卡片/流水表/usage 图表
 * [OUTPUT]: 对外提供 BillingContent 账单页主内容组件
 * [POS]: billing 的页面主渲染器，被 /billing 路由消费，负责组合本地账单概览与 Stripe Portal 操作入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { CreditBalanceSummary, CreditTransactionsResult, CreditUsageResult } from '@/lib/billing/credits'
import type { BillingSubscriptionSummary } from '@/lib/billing/subscription'
import { Button } from '@/components/ui/button'

import { CreditBalanceCard } from './credit-balance-card'
import { PaymentHistoryTable } from './payment-history-table'
import { UsageChart } from './usage-chart'

export interface BillingContentProps {
  subscription: BillingSubscriptionSummary
  balance: CreditBalanceSummary
  transactions: CreditTransactionsResult
  usage: CreditUsageResult
}

export function BillingContent({
  subscription,
  balance,
  transactions,
  usage,
}: BillingContentProps) {
  const t = useTranslations('billing')
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  async function handleOpenPortal() {
    setIsOpeningPortal(true)

    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { portalUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.portalUrl) {
        throw new Error(payload.error?.message ?? t('portalFailed'))
      }

      window.location.assign(payload.data.portalUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('portalFailed'))
      setIsOpeningPortal(false)
    }
  }

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.16),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-5 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-slate-200/80 bg-white/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
                {t('eyebrow')}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                {t('title')}
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                {t('description')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">{t('subscriptionLabel')}</p>
                <p className="mt-1 font-semibold capitalize text-slate-950">
                  {subscription.plan}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">{t('subscriptionStatus')}</p>
                <p className="mt-1 font-semibold text-slate-950">{subscription.status}</p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  void handleOpenPortal()
                }}
                disabled={!subscription.portalEligible || isOpeningPortal}
                className="h-11 rounded-xl"
              >
                {isOpeningPortal ? t('portalOpening') : t('portalAction')}
              </Button>
            </div>
          </div>
        </section>

        <CreditBalanceCard balance={balance} />
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <PaymentHistoryTable transactions={transactions} />
          <UsageChart usage={usage} />
        </div>
      </div>
    </div>
  )
}
