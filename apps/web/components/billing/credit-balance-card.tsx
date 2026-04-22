/**
 * [INPUT]: 依赖 @/lib/billing/credits 的 CreditBalanceSummary，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 CreditBalanceCard 余额摘要卡片
 * [POS]: billing 的资产概览组件，被 BillingContent 消费，负责展示双池积分与套餐镜像
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'

import type { CreditBalanceSummary } from '@/lib/billing/credits'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CreditBalanceCard({ balance }: { balance: CreditBalanceSummary }) {
  const t = useTranslations('billing')

  return (
    <Card className="border-border/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <CardHeader className="border-b border-border/60">
        <CardTitle>{t('balanceTitle')}</CardTitle>
        <CardDescription>{t('balanceDescription')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">{t('availableCredits')}</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-950">
              {balance.availableCredits.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm text-sky-700">{t('monthlyPool')}</p>
            <p className="mt-2 text-3xl font-semibold text-sky-950">
              {balance.monthlyBalance.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
            <p className="text-sm text-violet-700">{t('permanentPool')}</p>
            <p className="mt-2 text-3xl font-semibold text-violet-950">
              {balance.permanentBalance.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">{t('frozenCredits')}</p>
            <p className="mt-2 text-3xl font-semibold text-amber-950">
              {balance.frozenCredits.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('currentPlan')}
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-foreground">{balance.plan}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('monthlyAllowance')}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {balance.currentPlanMonthlyCredits.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('storageAllowance')}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {t('storageValue', { value: balance.storageGB })}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {t('lifetimeEarned')}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {balance.totalEarned.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{t('totalSpent', { value: balance.totalSpent.toLocaleString() })}</span>
          <span>{t('lastUpdated', { value: balance.updatedAt ?? t('notAvailable') })}</span>
        </div>
      </CardContent>
    </Card>
  )
}
