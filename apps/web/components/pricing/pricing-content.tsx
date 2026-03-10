/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @clerk/nextjs 的 useAuth，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/components/ui/button，
 *          依赖 @/hooks/use-billing 的 usePlans/useCheckout，依赖 @nano-banana/shared
 * [OUTPUT]: 对外提供 PricingContent 定价页客户端容器（支持周/月/年切换）
 * [POS]: pricing 的主容器，被 pricing/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { Check, Loader2 } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useCheckout, usePlans } from '@/hooks/use-billing'
import { PLANS } from '@nano-banana/shared/constants'
import type { BillingPeriod } from '@nano-banana/shared/types'

/* ─── Constants ──────────────────────────────────────── */

const BILLING_PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'yearly']

/* ─── Component ──────────────────────────────────────── */

export function PricingContent() {
  const t = useTranslations('pricing')
  const { isSignedIn } = useAuth()
  const { mutate: checkout, isPending } = useCheckout()
  const { data: plansData, isLoading: plansLoading } = usePlans()
  const [selectedPeriod, setSelectedPeriod] = useState<BillingPeriod>('monthly')

  const stripePlans = plansData?.plans ?? []
  const selectedPrice = stripePlans.find((p: { interval: string }) => p.interval === selectedPeriod)

  const freePlan = PLANS.free
  const proPlan = PLANS.pro

  const formatPrice = (unitAmount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(unitAmount / 100)

  return (
    <div className="mx-auto max-w-[800px] px-6 pb-20 pt-28">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
        <p className="mt-3 text-lg text-white/60">{t('subtitle')}</p>
      </div>

      {/* 计费周期切换 */}
      <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        {BILLING_PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-brand-500 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t(period)}
          </button>
        ))}
      </div>

      {/* 套餐卡片 */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Free 套餐 */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">{t('free')}</h3>
          <div className="mt-4">
            <span className="text-4xl font-bold text-white">$0</span>
          </div>
          <p className="mt-2 text-sm text-white/60">
            {t('creditsIncluded', { count: freePlan.monthlyCredits })}
          </p>

          {isSignedIn ? (
            <Button className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white" disabled>
              {t('currentPlan')}
            </Button>
          ) : (
            <Link href="/sign-up">
              <Button className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white">
                {t('getStarted')}
              </Button>
            </Link>
          )}

          <ul className="mt-6 space-y-2.5">
            {freePlan.features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro 套餐 */}
        <div className="relative rounded-2xl border border-brand-500 bg-brand-500/10 p-6">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-medium text-white">
            {t('popular')}
          </span>

          <h3 className="text-lg font-semibold text-white">
            {plansData?.productName ?? proPlan.name}
          </h3>

          <div className="mt-4">
            {plansLoading ? (
              <Loader2 size={24} className="animate-spin text-white/40" />
            ) : selectedPrice ? (
              <>
                <span className="text-4xl font-bold text-white">
                  {formatPrice(selectedPrice.unitAmount, selectedPrice.currency)}
                </span>
                <span className="ml-1 text-sm text-white/50">/{t(`per_${selectedPeriod}`)}</span>
              </>
            ) : (
              <span className="text-sm text-white/40">—</span>
            )}
          </div>

          <p className="mt-2 text-sm text-white/60">
            {t('creditsIncluded', { count: proPlan.monthlyCredits })}
          </p>

          {isSignedIn ? (
            <Button
              className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white"
              disabled={isPending || !selectedPrice}
              onClick={() => {
                if (selectedPrice) checkout({ priceId: selectedPrice.priceId })
              }}
            >
              {t('upgrade')}
            </Button>
          ) : (
            <Link href="/sign-up">
              <Button className="mt-6 w-full bg-brand-500 hover:bg-brand-600 text-white">
                {t('getStarted')}
              </Button>
            </Link>
          )}

          <ul className="mt-6 space-y-2.5">
            {proPlan.features.map((key) => (
              <li key={key} className="flex items-start gap-2 text-sm text-white/70">
                <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
