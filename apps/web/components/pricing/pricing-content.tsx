/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useLocale/useTranslations，依赖 @/i18n/navigation 的 Link/useRouter，
 *          依赖 @/components/ui/button
 * [OUTPUT]: 对外提供 PricingContent 动态定价组件
 * [POS]: components/pricing 的主渲染器，被 /pricing 页面消费，负责展示 Stripe 动态价格、Free 降级态并触发 Checkout
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
  isPricingReady?: boolean
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

export function PricingContent({
  isAuthenticated,
  isPricingReady = true,
  plans,
  creditPacks,
}: PricingContentProps) {
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
  const planCardStyles = {
    standard: {
      shell:
        'border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      badge: 'border-white/10 bg-white/6 text-white/78',
      button:
        'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    pro: {
      shell:
        'border-[#6b5cff]/55 bg-[linear-gradient(180deg,rgba(19,18,29,0.98),rgba(13,13,21,0.98))] shadow-[0_22px_70px_rgba(88,76,214,0.16)]',
      badge: 'border-[#6b5cff]/30 bg-[#6b5cff]/12 text-[#c8c1ff]',
      button:
        'bg-[#7b65ff] text-white hover:bg-[#8a76ff]',
    },
    ultimate: {
      shell:
        'border-white/8 bg-[linear-gradient(180deg,rgba(28,28,26,0.98),rgba(20,20,19,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      badge: 'border-white/10 bg-white/6 text-white/78',
      button:
        'bg-[#4c4c50] text-white hover:bg-[#5a5a60]',
    },
  } as const
  const creditPackCardStyles = {
    '500': {
      shell:
        'border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    '1200': {
      shell:
        'border-white/8 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    '3500': {
      shell:
        'border-[#6b5cff]/45 bg-[linear-gradient(180deg,rgba(19,18,29,0.98),rgba(13,13,21,0.98))] shadow-[0_22px_70px_rgba(88,76,214,0.14)]',
      button: 'bg-[#7b65ff] text-white hover:bg-[#8a76ff]',
    },
    '8000': {
      shell:
        'border-white/8 bg-[linear-gradient(180deg,rgba(28,28,26,0.98),rgba(20,20,19,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#4c4c50] text-white hover:bg-[#5a5a60]',
    },
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
          {!isPricingReady ? (
            <p className="mx-auto mt-4 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
              {t('pricingUnavailable')}
            </p>
          ) : null}
          <div className="mt-8 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setSelectedMode('plan_auto_monthly')}
              className={`rounded-full px-5 py-2.5 text-sm transition ${
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
              className={`rounded-full px-5 py-2.5 text-sm transition ${
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
              className={`rounded-full px-5 py-2.5 text-sm transition ${
                selectedMode === 'credit_pack'
                  ? 'bg-white text-black'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleCredits')}
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(22,22,27,0.98),rgba(14,14,18,0.98))] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.18em] text-white/45 uppercase">
                {t('freeEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
                {t('freeTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/72 md:text-base">
                {t('freeDescription')}
              </p>
            </div>

            <div className="min-w-0 rounded-[26px] border border-white/8 bg-black/18 p-5 lg:w-[360px]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-white/55">{t('freePriceLabel')}</p>
                  <p className="mt-2 text-5xl font-semibold text-white">{t('freePriceValue')}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/82">
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
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#5d55d6] text-sm font-medium text-white transition hover:bg-[#6a63e2]"
                >
                  {t('freePrimaryAuthenticated')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/sign-in?redirect_url=/workspace')}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#5d55d6] text-sm font-medium text-white transition hover:bg-[#6a63e2]"
                >
                  {t('freePrimaryGuest')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">{t('billingNoticeTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{t('billingNoticeBody')}</p>
          </article>
          <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">{t('refundNoticeTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{t('refundNoticeBody')}</p>
          </article>
          <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">{t('currencyNoticeTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{t('currencyNoticeBody')}</p>
          </article>
        </div>

        {selectedMode === 'credit_pack' ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-4">
            {visibleCreditPacks.map((creditPack) => {
              const isPending = pendingKey === `${creditPack.packageId}:${creditPack.purchaseMode}`

              return (
                <article
                  key={creditPack.packageId}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border p-7 ${creditPackCardStyles[creditPack.packageId].shell}`}
                >
                  <div className="relative">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-white/72 uppercase">
                      {t('toggleCredits')}
                    </span>
                    <h2 className="mt-6 text-2xl font-semibold">
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

                  <div className="relative mt-8">
                    <p className="text-[3.2rem] font-semibold tracking-tight">
                      {formatMoney(locale, creditPack.currency, creditPack.unitAmount)}
                    </p>
                    <p className="mt-2 text-sm text-white/45">{t('billedOneTime')}</p>
                  </div>

                  <div className="mt-8 space-y-3 text-sm text-white/78">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <span>{t('creditsIncluded')}</span>
                      <span className="font-medium">{creditPack.credits.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                      <span>{t('creditsBonusLabel')}</span>
                      <span className="font-medium">+{creditPack.bonusCredits.toLocaleString(locale)}</span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-white/55">
                      {t('currencyResolved', { currency: creditPack.currency.toUpperCase() })}
                    </div>
                  </div>

                  <Button
                    className={`mt-8 h-12 w-full rounded-xl border-0 text-sm font-semibold ${creditPackCardStyles[creditPack.packageId].button}`}
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
                className={`relative flex h-full flex-col overflow-hidden rounded-[28px] border p-7 ${planCardStyles[plan.plan].shell} ${
                  plan.plan === 'pro' ? 'lg:-mt-4 lg:pb-9' : ''
                }`}
              >
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] uppercase ${planCardStyles[plan.plan].badge}`}
                    >
                      {plan.purchaseMode === 'plan_auto_monthly'
                        ? t('toggleMonthly')
                        : t('toggleOneTime')}
                    </span>
                    <h2 className="mt-6 text-2xl font-semibold">{planLabels[plan.plan]}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {planDescriptions[plan.plan]}
                    </p>
                  </div>
                  {plan.plan === 'pro' ? (
                    <span className="rounded-full border border-[#6b5cff]/35 bg-[#6b5cff]/12 px-3 py-1 text-xs font-medium text-[#d3ccff]">
                      {t('popularBadge')}
                    </span>
                  ) : null}
                </div>

                <div className="relative mt-8">
                  <p
                    className={`text-[3.4rem] font-semibold tracking-tight ${
                      plan.plan === 'pro' ? 'text-[#9e8cff]' : 'text-white'
                    }`}
                  >
                    {formatMoney(locale, plan.currency, plan.unitAmount)}
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    {plan.purchaseMode === 'plan_auto_monthly'
                      ? t('billedMonthly')
                      : t('billedOneTime')}
                  </p>
                </div>

                <div className="mt-8 space-y-3 text-sm text-white/78">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span>
                      {plan.purchaseMode === 'plan_auto_monthly'
                        ? t('monthlyCredits')
                        : t('permanentCredits')}
                    </span>
                    <span className="font-medium">{plan.monthlyCredits.toLocaleString(locale)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                    <span>{t('storageIncluded')}</span>
                    <span className="font-medium">{t('storageValue', { value: plan.storageGB })}</span>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-white/55">
                    {t('currencyResolved', { currency: plan.currency.toUpperCase() })}
                  </div>
                </div>

                <Button
                  className={`mt-8 h-12 w-full rounded-xl border-0 text-sm font-semibold ${planCardStyles[plan.plan].button}`}
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
