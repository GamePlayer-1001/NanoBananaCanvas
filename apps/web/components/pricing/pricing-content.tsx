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

type PurchaseMode = 'plan_auto_monthly' | 'plan_one_time' | 'credit_pack'

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
  const [selectedMode, setSelectedMode] = useState<PurchaseMode>('plan_auto_monthly')
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
        'border-white/10 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      badge: 'border-white/10 bg-white/6 text-white/78',
      button: 'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    pro: {
      shell:
        'border-[#6b5cff]/55 bg-[linear-gradient(180deg,rgba(20,18,31,0.98),rgba(13,13,22,0.98))] shadow-[0_26px_72px_rgba(88,76,214,0.18)]',
      badge: 'border-[#6b5cff]/30 bg-[#6b5cff]/12 text-[#c8c1ff]',
      button: 'bg-[#7b65ff] text-white hover:bg-[#8a76ff]',
    },
    ultimate: {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(28,28,26,0.98),rgba(20,20,19,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      badge: 'border-white/10 bg-white/6 text-white/78',
      button: 'bg-[#4c4c50] text-white hover:bg-[#5a5a60]',
    },
  } as const

  const creditPackCardStyles = {
    '500': {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    '1200': {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(23,23,28,0.98),rgba(16,16,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#5d55d6] text-white hover:bg-[#6a63e2]',
    },
    '3500': {
      shell:
        'border-[#6b5cff]/45 bg-[linear-gradient(180deg,rgba(20,18,31,0.98),rgba(13,13,22,0.98))] shadow-[0_24px_68px_rgba(88,76,214,0.16)]',
      button: 'bg-[#7b65ff] text-white hover:bg-[#8a76ff]',
    },
    '8000': {
      shell:
        'border-white/10 bg-[linear-gradient(180deg,rgba(28,28,26,0.98),rgba(20,20,19,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.18)]',
      button: 'bg-[#4c4c50] text-white hover:bg-[#5a5a60]',
    },
  } as const

  const visiblePlans = plans.filter((plan) => plan.purchaseMode === selectedMode)
  const visibleCreditPacks = selectedMode === 'credit_pack' ? creditPacks : []
  const modeNotes = {
    plan_auto_monthly: t('billingNoticeBody'),
    plan_one_time: t('refundNoticeBody'),
    credit_pack: t('currencyNoticeBody'),
  } as const

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
    <section className="relative overflow-hidden bg-[#0b0b0f] px-5 py-20 text-white md:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[#6b5cff]/18 blur-3xl" />
        <div className="absolute right-8 top-40 h-56 w-56 rounded-full bg-[#2e6cff]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium tracking-[0.24em] text-white/45 uppercase">
            {t('eyebrow')}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-white/62 md:text-lg">
            {t('description')}
          </p>
          <p className="mt-4 text-sm text-white/45">{t('livePriceNote')}</p>
          {!isPricingReady ? (
            <p className="mx-auto mt-5 max-w-2xl rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
              {t('pricingUnavailable')}
            </p>
          ) : null}
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1.5">
            <PricingModeButton
              active={selectedMode === 'plan_auto_monthly'}
              label={t('toggleMonthly')}
              onClick={() => setSelectedMode('plan_auto_monthly')}
            />
            <PricingModeButton
              active={selectedMode === 'plan_one_time'}
              label={t('toggleOneTime')}
              onClick={() => setSelectedMode('plan_one_time')}
            />
            <PricingModeButton
              active={selectedMode === 'credit_pack'}
              label={t('toggleCredits')}
              onClick={() => setSelectedMode('credit_pack')}
            />
          </div>
          <p className="max-w-3xl text-center text-sm leading-6 text-white/50">
            {modeNotes[selectedMode]}
          </p>
        </div>

        {selectedMode === 'credit_pack' ? (
          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {visibleCreditPacks.map((creditPack) => {
              const isPending = pendingKey === `${creditPack.packageId}:${creditPack.purchaseMode}`

              return (
                <article
                  key={creditPack.packageId}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[30px] border p-7 ${creditPackCardStyles[creditPack.packageId].shell}`}
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-white/12" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-white/72 uppercase">
                      {t('toggleCredits')}
                    </span>
                    {creditPack.bonusCredits > 0 ? (
                      <span className="rounded-full border border-[#6b5cff]/25 bg-[#6b5cff]/12 px-3 py-1 text-xs font-medium text-[#d3ccff]">
                        +{creditPack.bonusCredits.toLocaleString(locale)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold">
                      {t('creditsValue', { value: creditPack.totalCredits.toLocaleString(locale) })}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/58">
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

                  <div className="mt-8 border-t border-white/8 pt-6">
                    <p className="text-[3rem] font-semibold tracking-tight">
                      {formatMoney(locale, creditPack.currency, creditPack.unitAmount)}
                    </p>
                    <p className="mt-2 text-sm text-white/45">{t('billedOneTime')}</p>
                  </div>

                  <div className="mt-8 space-y-3 text-sm text-white/78">
                    <PricingStat
                      label={t('creditsIncluded')}
                      value={creditPack.credits.toLocaleString(locale)}
                    />
                    <PricingStat
                      label={t('creditsBonusLabel')}
                      value={`+${creditPack.bonusCredits.toLocaleString(locale)}`}
                    />
                    <PricingMeta value={t('currencyResolved', { currency: creditPack.currency.toUpperCase() })} />
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
          <div className="mt-14 grid gap-6 lg:grid-cols-4">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(27,27,31,0.98),rgba(18,18,22,0.98))] p-7 shadow-[0_18px_48px_rgba(0,0,0,0.16)]">
              <div className="absolute inset-x-6 top-0 h-px bg-white/12" />
              <div className="flex items-start justify-between gap-4">
                <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  {t('freeEyebrow')}
                </span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-white/82">
                  {t('freeBadge')}
                </span>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-semibold">{t('freeTitle')}</h2>
                <p className="mt-3 text-sm leading-6 text-white/58">{t('freeDescription')}</p>
              </div>

              <div className="mt-8 border-t border-white/8 pt-6">
                <p className="text-[3rem] font-semibold tracking-tight text-white">
                  {t('freePriceValue')}
                </p>
                <p className="mt-2 text-sm text-white/45">{t('freePriceLabel')}</p>
              </div>

              <div className="mt-8 space-y-3 text-sm text-white/78">
                <PricingStat label={t('freeFeatureEntryTitle')} value={t('freeFeatureEntryBody')} />
                <PricingStat
                  label={t('freeFeatureCreditsTitle')}
                  value={t('freeFeatureCreditsBody')}
                />
                <PricingMeta value={t('freeFeatureUpgradeBody')} />
              </div>

              {isAuthenticated ? (
                <Link
                  href="/workspace"
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#5d55d6] text-sm font-semibold text-white transition hover:bg-[#6a63e2]"
                >
                  {t('freePrimaryAuthenticated')}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/sign-in?redirect_url=/workspace')}
                  className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#5d55d6] text-sm font-semibold text-white transition hover:bg-[#6a63e2]"
                >
                  {t('freePrimaryGuest')}
                </button>
              )}
            </article>

            {visiblePlans.map((plan) => {
              const isPending = pendingKey === `${plan.plan}:${plan.purchaseMode}`

              return (
                <article
                  key={plan.plan}
                  className={`relative flex h-full flex-col overflow-hidden rounded-[30px] border p-7 ${planCardStyles[plan.plan].shell}`}
                >
                  <div
                    className={`absolute inset-x-6 top-0 h-px ${
                      plan.plan === 'pro' ? 'bg-[#8f7bff]/50' : 'bg-white/12'
                    }`}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] uppercase ${planCardStyles[plan.plan].badge}`}
                    >
                      {plan.purchaseMode === 'plan_auto_monthly'
                        ? t('toggleMonthly')
                        : t('toggleOneTime')}
                    </span>
                    {plan.plan === 'pro' ? (
                      <span className="rounded-full border border-[#6b5cff]/35 bg-[#6b5cff]/12 px-3 py-1 text-xs font-medium text-[#d3ccff]">
                        {t('popularBadge')}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8">
                    <h2 className="text-2xl font-semibold">{planLabels[plan.plan]}</h2>
                    <p className="mt-3 text-sm leading-6 text-white/58">
                      {planDescriptions[plan.plan]}
                    </p>
                  </div>

                  <div className="mt-8 border-t border-white/8 pt-6">
                    <p
                      className={`text-[3rem] font-semibold tracking-tight ${
                        plan.plan === 'pro' ? 'text-[#a493ff]' : 'text-white'
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
                    <PricingStat
                      label={
                        plan.purchaseMode === 'plan_auto_monthly'
                          ? t('monthlyCredits')
                          : t('permanentCredits')
                      }
                      value={plan.monthlyCredits.toLocaleString(locale)}
                    />
                    <PricingStat
                      label={t('storageIncluded')}
                      value={t('storageValue', { value: plan.storageGB })}
                    />
                    <PricingMeta value={t('currencyResolved', { currency: plan.currency.toUpperCase() })} />
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

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <PricingNotice title={t('billingNoticeTitle')} body={t('billingNoticeBody')} />
          <PricingNotice title={t('refundNoticeTitle')} body={t('refundNoticeBody')} />
          <PricingNotice title={t('currencyNoticeTitle')} body={t('currencyNoticeBody')} />
        </div>
      </div>
    </section>
  )
}

function PricingModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
        active ? 'bg-white text-black' : 'text-white/65 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function PricingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span>{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  )
}

function PricingMeta({ value }: { value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white/55">
      {value}
    </div>
  )
}

function PricingNotice({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/62">{body}</p>
    </article>
  )
}
