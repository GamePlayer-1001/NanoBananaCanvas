/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-billing 的 useSubscription/useCheckout/usePortal，
 *          依赖 @nano-banana/shared/constants 的 PLANS，依赖 @nano-banana/shared/types 的 PlanType
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅面板 (套餐对比 + 升级)
 * [POS]: profile 的订阅 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

import { PLANS } from '@nano-banana/shared/constants'
import type { PlanType } from '@nano-banana/shared/types'
import { useSubscription, useCheckout, usePortal } from '@/hooks/use-billing'

/* ─── Derived Plan List ─────────────────────────────── */

const PLAN_LIST = (Object.keys(PLANS) as PlanType[]).map((id) => ({
  id,
  ...PLANS[id],
}))

/* ─── Component ──────────────────────────────────────── */

export function SubscriptionTab() {
  const t = useTranslations('billing')
  const tp = useTranslations('pricing')
  const { data: subscription } = useSubscription()
  const { mutate: checkout, isPending: checkoutPending } = useCheckout()
  const { mutate: openPortal, isPending: portalPending } = usePortal()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPlan = ((subscription as any)?.plan as PlanType) ?? 'free'

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
        {PLAN_LIST.map((plan) => {
          const isCurrent = plan.id === currentPlan

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-4 ${
                isCurrent
                  ? 'border-brand-500 bg-brand-50/50'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{plan.name}</h4>
                {plan.popular && (
                  <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-600">
                    {tp('popular')}
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-foreground">
                ${plan.monthlyPrice}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {tp('creditsIncluded', { count: plan.monthlyCredits })}
              </p>

              <ul className="mt-3 space-y-1.5">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check size={12} className="text-brand-500" />
                    {tp(f)}
                  </li>
                ))}
              </ul>

              <button
                className={`mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : 'bg-brand-500 text-white hover:bg-brand-600'
                }`}
                disabled={isCurrent || checkoutPending}
                onClick={() => {
                  if (!isCurrent) {
                    checkout({ plan: plan.id, billingPeriod: 'monthly' })
                  }
                }}
              >
                {isCurrent ? t('current') : t('upgrade')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
