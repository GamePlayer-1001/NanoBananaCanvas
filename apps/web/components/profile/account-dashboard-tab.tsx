/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/lib/billing/credits 与 @/lib/billing/subscription 类型，
 *          依赖 @/components/billing 的流水表与用量图，依赖 @/components/ui/button / progress
 * [OUTPUT]: 对外提供 AccountDashboardTab 仪表盘页签
 * [POS]: profile 的账户仪表盘，被账户页消费，负责展示套餐摘要、积分分布、签到积分、升级入口、账本详情，以及仅在存在真实数据时展示的用量趋势
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { CreditBalanceSummary } from '@/lib/billing/credits'
import type { BillingSubscriptionSummary } from '@/lib/billing/subscription'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PaymentHistoryTable } from '@/components/billing/payment-history-table'
import { useBillingTransactions, useBillingUsage } from '@/hooks/use-account-billing'
import { hasUsageData, UsageChart } from '@/components/billing/usage-chart'

interface AccountDashboardTabProps {
  isAuthenticated: boolean
  timezone: string | null
  subscription: BillingSubscriptionSummary
  balance: CreditBalanceSummary
  onUpgrade: () => void
}

type CreditSlice = {
  key: string
  label: string
  value: number
  color: string
  tone: string
}

function buildCreditDonut(slices: CreditSlice[]) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (total <= 0) {
    return {
      total: 0,
      gradient: 'conic-gradient(#e5e7eb 0deg 360deg)',
    }
  }

  let start = 0
  const stops = slices.map((slice) => {
    const span = (slice.value / total) * 360
    const end = start + span
    const stop = `${slice.color} ${start}deg ${end}deg`
    start = end
    return stop
  })

  return {
    total,
    gradient: `conic-gradient(${stops.join(', ')})`,
  }
}

export function AccountDashboardTab({
  isAuthenticated,
  timezone,
  subscription,
  balance,
  onUpgrade,
}: AccountDashboardTabProps) {
  const t = useTranslations('profile')
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const transactions = useBillingTransactions(isAuthenticated)
  const usage = useBillingUsage(isAuthenticated)
  const showUsage = hasUsageData(usage)

  const creditSlices: CreditSlice[] = [
    {
      key: 'signin',
      label: t('dashboardSigninCredits'),
      value: balance.trialBalance,
      color: '#22c55e',
      tone: 'text-emerald-600',
    },
    {
      key: 'monthly',
      label: t('dashboardMonthlyPool'),
      value: balance.monthlyBalance,
      color: '#38bdf8',
      tone: 'text-sky-600',
    },
    {
      key: 'permanent',
      label: t('dashboardPermanentPool'),
      value: balance.permanentBalance,
      color: '#8b5cf6',
      tone: 'text-violet-600',
    },
  ]
  const donut = buildCreditDonut(creditSlices)
  const monthlyAllowance = Math.max(balance.currentPlanMonthlyCredits, 1)
  const monthlyUsed = Math.max(balance.currentPlanMonthlyCredits - balance.monthlyBalance, 0)
  const monthlyUsagePercent = Math.min((monthlyUsed / monthlyAllowance) * 100, 100)
  const statsCards = [
    {
      key: 'signin',
      label: t('dashboardSigninCreditsLabel'),
      value: balance.trialBalance,
      containerClassName: 'border-violet-200 bg-violet-50',
      labelClassName: 'text-violet-700',
      valueClassName: 'text-violet-950',
    },
    {
      key: 'allowance',
      label: t('dashboardMonthlyAllowanceLabel'),
      value: balance.currentPlanMonthlyCredits,
      containerClassName: 'border-sky-200 bg-sky-50',
      labelClassName: 'text-sky-700',
      valueClassName: 'text-sky-950',
    },
    {
      key: 'available',
      label: t('dashboardAvailableCreditsLabel'),
      value: balance.availableCredits,
      containerClassName: 'border-emerald-200 bg-emerald-50',
      labelClassName: 'text-emerald-700',
      valueClassName: 'text-emerald-950',
    },
    {
      key: 'spent',
      label: t('dashboardLifetimeSpentLabel'),
      value: balance.totalSpent,
      containerClassName: 'border-slate-200 bg-slate-50',
      labelClassName: 'text-slate-600',
      valueClassName: 'text-slate-950',
    },
  ] as const

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
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
              {t('dashboardEyebrow')}
            </p>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                {t('dashboardTitle')}
              </h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t('dashboardDescription')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" className="h-11 rounded-xl px-5" onClick={onUpgrade}>
              {t('dashboardUpgradeAction')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl px-5"
              onClick={() => {
                void handleOpenPortal()
              }}
              disabled={isOpeningPortal}
            >
              {isOpeningPortal ? t('openingBilling') : t('dashboardPortalAction')}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative mx-auto h-48 w-48 shrink-0">
              <div
                className="h-full w-full rounded-full"
                style={{ backgroundImage: donut.gradient }}
              />
              <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  {t('dashboardPlanRingLabel')}
                </span>
                <span className="mt-2 text-3xl font-semibold capitalize text-foreground">
                  {subscription.plan}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {t('dashboardAvailableCredits', {
                    value: balance.availableCredits.toLocaleString(),
                  })}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex min-h-[90px] flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-xs leading-4 tracking-[0.14em] text-muted-foreground uppercase [overflow-wrap:anywhere]">
                    {t('dashboardCurrentPlan')}
                  </p>
                  <p className="mt-2 text-lg font-semibold capitalize text-foreground break-words">
                    {subscription.plan}
                  </p>
                </div>
                <div className="flex min-h-[90px] flex-col justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-xs leading-4 tracking-[0.14em] text-muted-foreground uppercase [overflow-wrap:anywhere]">
                    {t('dashboardSubscriptionState')}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-foreground break-words">
                    {subscription.status}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {creditSlices.map((slice) => (
                  <div
                    key={slice.key}
                    className="flex items-center justify-between rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="text-muted-foreground">{slice.label}</span>
                    </div>
                    <span className={`font-semibold ${slice.tone}`}>
                      {slice.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
              <div
                key={card.key}
                className={`flex min-h-[132px] flex-col justify-between rounded-2xl border p-4 ${card.containerClassName}`}
              >
                <p className={`text-sm leading-6 ${card.labelClassName}`}>{card.label}</p>
                <p className={`mt-4 text-3xl font-semibold tabular-nums ${card.valueClassName}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[24px] border border-border/70 bg-muted/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('dashboardUsageProgressTitle')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('dashboardUsageProgressBody', {
                    used: monthlyUsed.toLocaleString(),
                    total: balance.currentPlanMonthlyCredits.toLocaleString(),
                  })}
                </p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(monthlyUsagePercent)}%
              </span>
            </div>
            <Progress
              value={monthlyUsagePercent}
              className="mt-4 h-3 rounded-full bg-slate-200 [&_[data-slot=progress-indicator]]:bg-[linear-gradient(90deg,#0ea5e9_0%,#8b5cf6_100%)]"
            />
          </div>
        </article>
      </section>

      <PaymentHistoryTable
        isAuthenticated={isAuthenticated}
        transactions={transactions}
        timezone={timezone}
      />
      {showUsage ? <UsageChart usage={usage} /> : null}
    </div>
  )
}
