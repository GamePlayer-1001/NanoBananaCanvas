/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @nano-banana/shared/constants 的 PLANS，依赖 @nano-banana/shared/types 的 PlanType/BillingPeriod，
 *          依赖 @/hooks/use-billing 的 useSubscription/useCheckout/usePortal/usePlans
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅面板（套餐对比 + 周期选择 + 升级）
 * [POS]: profile 的订阅 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, Loader2 } from 'lucide-react'

import { PLANS } from '@nano-banana/shared/constants'
import type { BillingPeriod, PlanType } from '@nano-banana/shared/types'
import { useSubscription, useCheckout, usePortal, usePlans } from '@/hooks/use-billing'

/* ─── Constants ──────────────────────────────────────── */

const BILLING_PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'yearly']

/* ─── Component ──────────────────────────────────────── */

export function SubscriptionTab() {
  const t = useTranslations('billing')
  const tp = useTranslations('pricing')
  const { data: subscription } = useSubscription()
  const { data: plansData, isLoading: plansLoading } = usePlans()
  const { mutate: checkout, isPending: checkoutPending } = useCheckout()
  const { mutate: openPortal, isPending: portalPending } = usePortal()
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('monthly')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPlan = ((subscription as any)?.plan as PlanType) ?? 'free'
  const stripePlans = plansData?.plans ?? []
  const selectedPrice = stripePlans.find((p: { interval: string }) => p.interval === selectedPeriod)

  const formatPrice = (unitAmount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(unitAmount / 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{t('currentPlan')}</h3>
        {currentPlan !== 'free' && (
          <button
            onClick={() => openPortal()}
            disabled={portalPending}
            className="text-sm text-brand-500 hover:text-brand-600 transition-colors"
          >
            {t('manageBilling')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Free 套餐 */}
        <div
          className={`rounded-xl border p-4 ${
            currentPlan === 'free'
              ? 'border-brand-500 bg-brand-50/50'
              : 'border-border bg-background'
          }`}
        >
          <h4 className="font-semibold text-foreground">{PLANS.free.name}</h4>
          <div className="mt-1 text-2xl font-bold text-foreground">$0</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {tp('creditsIncluded', { count: PLANS.free.monthlyCredits })}
          </p>
          <ul className="mt-3 space-y-1.5">
            {PLANS.free.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check size={12} className="text-brand-500" />
                {tp(f)}
              </li>
            ))}
          </ul>
          <button
            className="mt-4 w-full rounded-lg py-2 text-sm font-medium bg-muted text-muted-foreground cursor-default"
            disabled
          >
            {currentPlan === 'free' ? t('current') : t('free')}
          </button>
        </div>

        {/* Pro 套餐 */}
        <div
          className={`rounded-xl border p-4 ${
            currentPlan === 'pro'
              ? 'border-brand-500 bg-brand-50/50'
              : 'border-border bg-background'
          }`}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">{PLANS.pro.name}</h4>
            <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
              {tp('popular')}
            </span>
          </div>

          {/* 计费周期切换 */}
          <div className="mt-2 flex gap-1 rounded-lg bg-muted p-0.5">
            {BILLING_PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tp(period)}
              </button>
            ))}
          </div>

          <div className="mt-2 text-2xl font-bold text-foreground">
            {plansLoading ? (
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            ) : selectedPrice ? (
              <>
                {formatPrice(selectedPrice.unitAmount, selectedPrice.currency)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{tp(`per_${selectedPeriod}`)}
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {tp('creditsIncluded', { count: PLANS.pro.monthlyCredits })}
          </p>

          <ul className="mt-3 space-y-1.5">
            {PLANS.pro.features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check size={12} className="text-brand-500" />
                {tp(f)}
              </li>
            ))}
          </ul>

          <button
            className={`mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
              currentPlan === 'pro'
                ? 'bg-muted text-muted-foreground cursor-default'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
            disabled={currentPlan === 'pro' || checkoutPending || !selectedPrice}
            onClick={() => {
              if (currentPlan !== 'pro' && selectedPrice) {
                checkout({ priceId: selectedPrice.priceId })
              }
            }}
          >
            {currentPlan === 'pro' ? t('current') : t('upgrade')}
          </button>
        </div>
      </div>
    </div>
  )
}
