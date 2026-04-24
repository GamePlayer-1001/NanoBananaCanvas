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
        'border-cyan-300/18 bg-[radial-gradient(circle_at_top,rgba(86,196,255,0.18),transparent_26%),linear-gradient(180deg,rgba(11,24,34,0.98),rgba(8,12,18,0.98))] shadow-[0_26px_90px_rgba(28,122,171,0.18)]',
      badge: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
      button:
        'bg-[linear-gradient(135deg,#e7fbff,#77deff)] text-black hover:brightness-95',
    },
    pro: {
      shell:
        'border-emerald-300/20 bg-[radial-gradient(circle_at_top,rgba(104,255,196,0.18),transparent_28%),linear-gradient(180deg,rgba(10,30,24,0.98),rgba(8,15,12,0.98))] shadow-[0_28px_100px_rgba(18,147,104,0.2)]',
      badge: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
      button:
        'bg-[linear-gradient(135deg,#f2fff8,#87ffcc)] text-black hover:brightness-95',
    },
    ultimate: {
      shell:
        'border-violet-300/20 bg-[radial-gradient(circle_at_top,rgba(176,117,255,0.2),transparent_28%),linear-gradient(180deg,rgba(26,16,38,0.98),rgba(9,8,17,0.98))] shadow-[0_28px_100px_rgba(104,68,177,0.2)]',
      badge: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
      button:
        'bg-[linear-gradient(135deg,#f7efff,#bf96ff)] text-black hover:brightness-95',
    },
  } as const
  const creditPackCardStyles = {
    '500': {
      shell:
        'border-amber-300/18 bg-[radial-gradient(circle_at_top,rgba(255,194,93,0.18),transparent_28%),linear-gradient(180deg,rgba(34,25,18,0.98),rgba(15,11,9,0.98))] shadow-[0_26px_90px_rgba(166,110,33,0.16)]',
      button:
        'bg-[linear-gradient(135deg,#fff0d1,#ffc771)] text-black hover:brightness-95',
    },
    '1200': {
      shell:
        'border-sky-300/18 bg-[radial-gradient(circle_at_top,rgba(112,204,255,0.18),transparent_28%),linear-gradient(180deg,rgba(14,23,38,0.98),rgba(7,12,18,0.98))] shadow-[0_26px_90px_rgba(55,117,183,0.16)]',
      button:
        'bg-[linear-gradient(135deg,#ebf7ff,#7ec7ff)] text-black hover:brightness-95',
    },
    '3500': {
      shell:
        'border-fuchsia-300/18 bg-[radial-gradient(circle_at_top,rgba(220,120,255,0.18),transparent_28%),linear-gradient(180deg,rgba(30,14,36,0.98),rgba(11,8,18,0.98))] shadow-[0_26px_90px_rgba(143,68,171,0.16)]',
      button:
        'bg-[linear-gradient(135deg,#fdefff,#d78cff)] text-black hover:brightness-95',
    },
    '8000': {
      shell:
        'border-emerald-300/18 bg-[radial-gradient(circle_at_top,rgba(112,255,196,0.2),transparent_28%),linear-gradient(180deg,rgba(10,29,23,0.98),rgba(8,14,12,0.98))] shadow-[0_26px_90px_rgba(28,147,104,0.18)]',
      button:
        'bg-[linear-gradient(135deg,#effff7,#89ffcb)] text-black hover:brightness-95',
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
          <div className="mt-8 inline-flex rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
            <button
              type="button"
              onClick={() => setSelectedMode('plan_auto_monthly')}
              className={`rounded-2xl px-4 py-2.5 text-sm transition ${
                selectedMode === 'plan_auto_monthly'
                  ? 'bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.14)]'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleMonthly')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('plan_one_time')}
              className={`rounded-2xl px-4 py-2.5 text-sm transition ${
                selectedMode === 'plan_one_time'
                  ? 'bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.14)]'
                  : 'text-white/65 hover:text-white'
              }`}
            >
              {t('toggleOneTime')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode('credit_pack')}
              className={`rounded-2xl px-4 py-2.5 text-sm transition ${
                selectedMode === 'credit_pack'
                  ? 'bg-white text-black shadow-[0_10px_24px_rgba(255,255,255,0.14)]'
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">{t('billingNoticeTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{t('billingNoticeBody')}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm font-medium text-white">{t('refundNoticeTitle')}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">{t('refundNoticeBody')}</p>
          </article>
          <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
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
                  className={`relative flex h-full flex-col overflow-hidden rounded-[30px] border p-7 ${creditPackCardStyles[creditPack.packageId].shell}`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%)]" />
                  <div className="relative">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-white/80 uppercase">
                      {t('toggleCredits')}
                    </span>
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

                  <div className="relative mt-8">
                    <p className="text-5xl font-semibold tracking-tight">
                      {formatMoney(locale, creditPack.currency, creditPack.unitAmount)}
                    </p>
                    <p className="mt-2 text-sm text-white/45">{t('billedOneTime')}</p>
                  </div>

                  <div className="mt-8 space-y-3 text-sm text-white/78">
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/18 px-4 py-3">
                      <span>{t('creditsIncluded')}</span>
                      <span className="font-medium">{creditPack.credits.toLocaleString(locale)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/18 px-4 py-3">
                      <span>{t('creditsBonusLabel')}</span>
                      <span className="font-medium">+{creditPack.bonusCredits.toLocaleString(locale)}</span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-white/55">
                      {t('currencyResolved', { currency: creditPack.currency.toUpperCase() })}
                    </div>
                  </div>

                  <Button
                    className={`mt-8 h-12 w-full rounded-2xl border-0 text-sm font-semibold ${creditPackCardStyles[creditPack.packageId].button}`}
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
                className={`relative flex h-full flex-col overflow-hidden rounded-[30px] border p-7 ${planCardStyles[plan.plan].shell}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_30%)]" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] uppercase ${planCardStyles[plan.plan].badge}`}
                    >
                      {plan.purchaseMode === 'plan_auto_monthly'
                        ? t('toggleMonthly')
                        : t('toggleOneTime')}
                    </span>
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

                <div className="relative mt-8">
                  <p className="text-5xl font-semibold tracking-tight">
                    {formatMoney(locale, plan.currency, plan.unitAmount)}
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    {plan.purchaseMode === 'plan_auto_monthly'
                      ? t('billedMonthly')
                      : t('billedOneTime')}
                  </p>
                </div>

                <div className="mt-8 space-y-3 text-sm text-white/78">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/18 px-4 py-3">
                    <span>
                      {plan.purchaseMode === 'plan_auto_monthly'
                        ? t('monthlyCredits')
                        : t('permanentCredits')}
                    </span>
                    <span className="font-medium">{plan.monthlyCredits.toLocaleString(locale)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-black/18 px-4 py-3">
                    <span>{t('storageIncluded')}</span>
                    <span className="font-medium">{t('storageValue', { value: plan.storageGB })}</span>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-white/55">
                    {t('currencyResolved', { currency: plan.currency.toUpperCase() })}
                  </div>
                </div>

                <Button
                  className={`mt-8 h-12 w-full rounded-2xl border-0 text-sm font-semibold ${planCardStyles[plan.plan].button}`}
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
