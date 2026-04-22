/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useLocale/useTranslations，依赖 @/components/ui/button
 * [OUTPUT]: 对外提供 PricingContent 动态定价组件
 * [POS]: components/pricing 的主渲染器，被 /pricing 页面消费，负责展示 Stripe 动态价格并触发 Checkout
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

import { Link, useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import type { PublicBillingPlanPrice, PublicCreditPackPrice } from '@/lib/billing/pricing'

export interface PricingContentProps {
  isAuthenticated: boolean
  plans: PublicBillingPlanPrice[]
  creditPacks: PublicCreditPackPrice[]
}

function formatMoney(locale: string, currency: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

export function PricingContent({ isAuthenticated, plans, creditPacks }: PricingContentProps) {
  const t = useTranslations('pricing')
  const locale = useLocale()
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<
    'plan_auto_monthly' | 'plan_one_time' | 'credit_pack'
  >(
    'plan_auto_monthly',
  )
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const planLabels = {
    standard: t('standardName'),
    pro: t('proName'),
    ultimate: t('ultimateName'),
  } as const

  const planDescriptions = {
    standard: t('standardDescription'),
    pro: t('proDescription'),
    ultimate: t('ultimateDescription'),
  } as const

  const visiblePlans = plans.filter((plan) => plan.purchaseMode === selectedMode)
  const visibleCreditPacks = selectedMode === 'credit_pack' ? creditPacks : []

  async function handlePlanCheckout(plan: PublicBillingPlanPrice) {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    setPendingKey(`${plan.plan}:${plan.purchaseMode}`)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.plan,
          purchaseMode: plan.purchaseMode,
          currency: plan.currency,
        }),
      })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { checkoutUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.message ?? 'Checkout failed')
      }

      window.location.href = payload.data.checkoutUrl
    } finally {
      setPendingKey(null)
    }
  }

  async function handleCreditPackCheckout(creditPack: PublicCreditPackPrice) {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    setPendingKey(`${creditPack.packageId}:${creditPack.purchaseMode}`)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: creditPack.packageId,
          purchaseMode: creditPack.purchaseMode,
          currency: creditPack.currency,
        }),
      })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { checkoutUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.message ?? 'Checkout failed')
      }

      window.location.href = payload.data.checkoutUrl
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <section className="bg-[#0b0b0f] px-5 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium tracking-[0.2em] text-white/45 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-base leading-7 text-white/62 md:text-lg">
            {t('description')}
          </p>
          <p className="mt-4 text-sm text-white/45">{t('livePriceNote')}</p>
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setSelectedMode('plan_auto_monthly')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedMode === 'plan_auto_monthly'
                  ? 'bg-white text-black'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleMonthly')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('plan_one_time')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedMode === 'plan_one_time'
                  ? 'bg-white text-black'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleOneTime')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('credit_pack')}
              className={`rounded-full px-4 py-2 text-sm transition ${
                selectedMode === 'credit_pack'
                  ? 'bg-white text-black'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleCredits')}
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-[30px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(99,102,241,0.10))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.18em] text-emerald-200 uppercase">
                {t('freeEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                {t('freeTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/72 md:text-base">
                {t('freeDescription')}
              </p>
            </div>

            <div className="min-w-0 rounded-[26px] border border-white/10 bg-black/20 p-5 lg:w-[360px]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/55">{t('freePriceLabel')}</p>
                  <p className="mt-2 text-5xl font-semibold text-white">{t('freePriceValue')}</p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  {t('freeBadge')}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
                  <p className="text-white/50">{t('freeFeatureEntryTitle')}</p>
                  <p className="mt-1 font-medium text-white">{t('freeFeatureEntryBody')}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
                  <p className="text-white/50">{t('freeFeatureCreditsTitle')}</p>
                  <p className="mt-1 font-medium text-white">{t('freeFeatureCreditsBody')}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
                  <p className="text-white/50">{t('freeFeatureUpgradeTitle')}</p>
                  <p className="mt-1 font-medium text-white">{t('freeFeatureUpgradeBody')}</p>
                </div>
              </div>

              {isAuthenticated ? (
                <Link
                  href="/workspace"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-medium text-black transition hover:bg-white/90"
                >
                  {t('freePrimaryAuthenticated')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/sign-in?redirect_url=/workspace')}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-white text-sm font-medium text-black transition hover:bg-white/90"
                >
                  {t('freePrimaryGuest')}
                </button>
              )}
            </div>
          </div>
        </div>

        {selectedMode === 'credit_pack' ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {visibleCreditPacks.map((creditPack) => {
              const isPending = pendingKey === `${creditPack.packageId}:${creditPack.purchaseMode}`

              return (
                <article
                  key={creditPack.packageId}
                  className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.22)]"
                >
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {t('creditsValue', { value: creditPack.totalCredits.toLocaleString(locale) })}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {creditPack.bonusCredits > 0
                        ? t('creditsBonus', {
                            base: creditPack.credits.toLocaleString(locale),
                            bonus: creditPack.bonusCredits.toLocaleString(locale),
                          })
                        : t('creditsBaseOnly', {
                            base: creditPack.credits.toLocaleString(locale),
                          })}
                    </p>
                  </div>

                  <div className="mt-8">
                    <p className="text-4xl font-semibold">
                      {formatMoney(locale, creditPack.currency, creditPack.unitAmount)}
                    </p>
                    <p className="mt-2 text-sm text-white/45">{t('billedOneTime')}</p>
                  </div>

                  <div className="mt-8 space-y-3 text-sm text-white/78">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <span>{t('creditsIncluded')}</span>
                      <span className="font-medium">{creditPack.credits.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                      <span>{t('creditsBonusLabel')}</span>
                      <span className="font-medium">+{creditPack.bonusCredits.toLocaleString(locale)}</span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-white/55">
                      {t('currencyResolved', { currency: creditPack.currency.toUpperCase() })}
                    </div>
                  </div>

                  <Button
                    className="mt-8 h-11 w-full rounded-xl"
                    onClick={() => handleCreditPackCheckout(creditPack)}
                    disabled={isPending}
                  >
                    {isPending
                      ? t('redirecting')
                      : isAuthenticated
                        ? t('buyCredits')
                        : t('signInToSubscribe')}
                  </Button>
                </article>
              )
            })}
          </div>
        ) : (
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const isPending = pendingKey === `${plan.plan}:${plan.purchaseMode}`

            return (
              <article
                key={plan.plan}
                className="flex h-full flex-col rounded-[28px] border border-white/10 bg-white/[0.04] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.22)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{planLabels[plan.plan]}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {planDescriptions[plan.plan]}
                    </p>
                  </div>
                  {plan.plan === 'pro' ? (
                    <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium text-white/82">
                      {t('popularBadge')}
                    </span>
                  ) : null}
                </div>

                <div className="mt-8">
                  <p className="text-4xl font-semibold">
                    {formatMoney(locale, plan.currency, plan.unitAmount)}
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    {plan.purchaseMode === 'plan_auto_monthly'
                      ? t('billedMonthly')
                      : t('billedOneTime')}
                  </p>
                </div>

                <div className="mt-8 space-y-3 text-sm text-white/78">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <span>{t('monthlyCredits')}</span>
                    <span className="font-medium">{plan.monthlyCredits.toLocaleString(locale)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <span>{t('storageIncluded')}</span>
                    <span className="font-medium">{t('storageValue', { value: plan.storageGB })}</span>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-white/55">
                    {t('currencyResolved', { currency: plan.currency.toUpperCase() })}
                  </div>
                </div>

                <Button
                  className="mt-8 h-11 w-full rounded-xl"
                  onClick={() => handlePlanCheckout(plan)}
                  disabled={isPending}
                >
                  {isPending
                    ? t('redirecting')
                    : isAuthenticated
                      ? plan.purchaseMode === 'plan_auto_monthly'
                        ? t('startSubscription')
                        : t('buyOneTime')
                      : t('signInToSubscribe')}
                </Button>
              </article>
            )
          })}
        </div>
        )}
      </div>
    </section>
  )
}
