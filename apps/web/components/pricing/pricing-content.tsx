/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @clerk/nextjs 的 useAuth，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/ui/button，
 *          依赖 @/hooks/use-billing 的 useCheckout
 * [OUTPUT]: 对外提供 PricingContent 定价页客户端容器
 * [POS]: pricing 的主容器，被 pricing/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { Check } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useCheckout } from '@/hooks/use-billing'

/* ─── Plan Data ───────────────────────────────────────── */

interface Plan {
  id: string
  nameKey: string
  monthlyPrice: number
  yearlyPrice: number
  credits: number
  features: string[]
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    nameKey: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: 200,
    features: ['feature_basic', 'feature_community', 'feature_export'],
  },
  {
    id: 'standard',
    nameKey: 'standard',
    monthlyPrice: 9,
    yearlyPrice: 90,
    credits: 1000,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history'],
  },
  {
    id: 'pro',
    nameKey: 'pro',
    monthlyPrice: 29,
    yearlyPrice: 290,
    credits: 5000,
    popular: true,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history', 'feature_api', 'feature_team'],
  },
  {
    id: 'ultimate',
    nameKey: 'ultimate',
    monthlyPrice: 79,
    yearlyPrice: 790,
    credits: -1,
    features: ['feature_basic', 'feature_community', 'feature_export', 'feature_priority', 'feature_history', 'feature_api', 'feature_team', 'feature_unlimited', 'feature_dedicated'],
  },
]

/* ─── Component ──────────────────────────────────────── */

export function PricingContent() {
  const t = useTranslations('pricing')
  const { isSignedIn } = useAuth()
  const [yearly, setYearly] = useState(false)
  const { mutate: checkout, isPending } = useCheckout()

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
        <p className="mt-3 text-lg text-white/60">{t('subtitle')}</p>
      </div>

      {/* 月付/年付 toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <span className={`text-sm ${!yearly ? 'text-white' : 'text-white/50'}`}>
          {t('monthly')}
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            yearly ? 'bg-brand-500' : 'bg-white/20'
          }`}
        >
          <div
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              yearly ? 'translate-x-5.5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className={`text-sm ${yearly ? 'text-white' : 'text-white/50'}`}>
          {t('yearly')}
          <span className="ml-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
            {t('savePercent')}
          </span>
        </span>
      </div>

      {/* 套餐卡片 */}
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
          const period = yearly ? t('perYear') : t('perMonth')

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
                  {t('popular')}
                </span>
              )}

              {/* Plan name */}
              <h3 className="text-lg font-semibold text-white">{t(plan.nameKey)}</h3>

              {/* Price */}
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">
                  ${price}
                </span>
                {price > 0 && (
                  <span className="ml-1 text-sm text-white/50">{period}</span>
                )}
              </div>

              {/* Credits */}
              <p className="mt-2 text-sm text-white/60">
                {plan.credits === -1
                  ? t('unlimitedCredits')
                  : t('creditsIncluded', { count: plan.credits })}
              </p>

              {/* CTA */}
              {isSignedIn ? (
                <Button
                  className={`mt-6 w-full ${
                    plan.popular
                      ? 'bg-brand-500 hover:bg-brand-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  disabled={plan.id === 'free' || isPending}
                  onClick={() => {
                    if (plan.id !== 'free') {
                      checkout({ plan: plan.id, billingPeriod: yearly ? 'yearly' : 'monthly' })
                    }
                  }}
                >
                  {plan.id === 'free' ? t('currentPlan') : t('upgrade')}
                </Button>
              ) : (
                <Link href="/sign-up">
                  <Button
                    className={`mt-6 w-full ${
                      plan.popular
                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {t('getStarted')}
                  </Button>
                </Link>
              )}

              {/* Features */}
              <ul className="mt-6 space-y-2.5">
                {plan.features.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
