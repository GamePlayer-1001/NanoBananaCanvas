/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/hooks/use-billing
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅面板 (套餐对比 + 升级)
 * [POS]: profile 的订阅 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'

/* ─── Plan Data ──────────────────────────────────────── */

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    features: ['100 credits/month', 'Community workflows', 'Basic models'],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    features: ['2000 credits/month', 'Priority execution', 'All models', 'Video analysis'],
    current: false,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$49',
    features: ['10000 credits/month', 'Team collaboration', 'Custom models', 'API access'],
    current: false,
  },
]

/* ─── Component ──────────────────────────────────────── */

export function SubscriptionTab() {
  const t = useTranslations('billing')

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">{t('currentPlan')}</h3>

      <div className="grid grid-cols-3 gap-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-4 ${
              plan.current
                ? 'border-brand-500 bg-brand-50/50'
                : 'border-border bg-background'
            }`}
          >
            <h4 className="font-semibold text-foreground">{plan.name}</h4>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {plan.price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>

            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check size={12} className="text-brand-500" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className={`mt-4 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                plan.current
                  ? 'bg-muted text-muted-foreground cursor-default'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
              disabled={plan.current}
            >
              {plan.current ? 'Current' : t('upgrade')}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
