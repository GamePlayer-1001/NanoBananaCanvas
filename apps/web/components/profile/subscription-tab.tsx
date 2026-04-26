/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useLocale/useTranslations，依赖 sonner 的 toast，
 *          依赖 @/lib/billing/pricing 与 @/lib/billing/subscription 类型，
 *          依赖 @/components/ui/button / tabs，依赖 @/i18n/navigation 的 useRouter
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅页签
 * [POS]: profile 的订阅购买面板，被账户页消费，负责展示月付/一次性/积分包并触发真实结账
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import type { PublicBillingPlanPrice, PublicCreditPackPrice } from '@/lib/billing/pricing'
import type { BillingSubscriptionSummary } from '@/lib/billing/subscription'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type PurchaseMode = 'plan_auto_monthly' | 'plan_one_time' | 'credit_pack'

interface SubscriptionTabProps {
  isAuthenticated: boolean
  subscription: BillingSubscriptionSummary
  isPricingReady: boolean
  plans: PublicBillingPlanPrice[]
  creditPacks: PublicCreditPackPrice[]
  initialMode?: PurchaseMode
  onModeChange?: (mode: PurchaseMode) => void
}

function formatMoney(locale: string, currency: string, amount: number): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

export function SubscriptionTab({
  isAuthenticated,
  subscription,
  isPricingReady,
  plans,
  creditPacks,
  initialMode = 'plan_auto_monthly',
  onModeChange,
}: SubscriptionTabProps) {
  const t = useTranslations('profile')
  const locale = useLocale()
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<PurchaseMode>(initialMode)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    setSelectedMode(initialMode)
  }, [initialMode])

  const visiblePlans = plans.filter((plan) => plan.purchaseMode === selectedMode)
  const visibleCreditPacks = selectedMode === 'credit_pack' ? creditPacks : []

  const setMode = (mode: PurchaseMode) => {
    setSelectedMode(mode)
    onModeChange?.(mode)
  }

  async function handlePlanCheckout(plan: PublicBillingPlanPrice) {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/account')
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
        throw new Error(payload.error?.message ?? t('subscriptionCheckoutFailed'))
      }

      window.location.assign(payload.data.checkoutUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('subscriptionCheckoutFailed'))
      setPendingKey(null)
    }
  }

  async function handleCreditPackCheckout(creditPack: PublicCreditPackPrice) {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/account')
      return
    }

    setPendingKey(`${creditPack.packageId}:${creditPack.purchaseMode}`)

    try {
      const response = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: creditPack.packageId,
          currency: creditPack.currency,
        }),
      })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { checkoutUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.checkoutUrl) {
        throw new Error(payload.error?.message ?? t('subscriptionTopUpFailed'))
      }

      window.location.assign(payload.data.checkoutUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('subscriptionTopUpFailed'))
      setPendingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            {t('subscriptionEyebrow')}
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {t('subscriptionTitle')}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {t('subscriptionDescription')}
          </p>
        </div>

        <Tabs value={selectedMode} onValueChange={(value) => setMode(value as PurchaseMode)} className="mt-6">
          <TabsList className="h-auto rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="plan_auto_monthly" className="rounded-xl px-4 py-2.5">
              {t('subscriptionToggleMonthly')}
            </TabsTrigger>
            <TabsTrigger value="plan_one_time" className="rounded-xl px-4 py-2.5">
              {t('subscriptionToggleOneTime')}
            </TabsTrigger>
            <TabsTrigger value="credit_pack" className="rounded-xl px-4 py-2.5">
              {t('subscriptionToggleCredits')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="mt-4 text-sm text-muted-foreground">
          {selectedMode === 'plan_auto_monthly'
            ? t('subscriptionModeMonthlyBody')
            : selectedMode === 'plan_one_time'
              ? t('subscriptionModeOneTimeBody')
              : t('subscriptionModeCreditsBody')}
        </p>
      </section>

      {!isPricingReady ? (
        <div className="rounded-[24px] border border-amber-300/40 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          {t('subscriptionPricingUnavailable')}
        </div>
      ) : null}

      {selectedMode === 'credit_pack' ? (
        <div className="grid gap-5 xl:grid-cols-4">
          {visibleCreditPacks.map((creditPack) => {
            const isPending = pendingKey === `${creditPack.packageId}:${creditPack.purchaseMode}`
            const featured = creditPack.packageId === '3500'

            return (
              <article
                key={creditPack.packageId}
                className={`flex h-full flex-col rounded-[26px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
                  featured
                    ? 'border-violet-300 bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ff_100%)]'
                    : 'border-border/70 bg-white/95'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {t('subscriptionCreditsLabel')}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-foreground">
                      {t('subscriptionCreditsValue', {
                        value: creditPack.totalCredits.toLocaleString(locale),
                      })}
                    </h3>
                  </div>
                  {featured ? (
                    <span className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                      {t('subscriptionPopular')}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {creditPack.bonusCredits > 0
                    ? t('subscriptionCreditsBonus', {
                        base: creditPack.credits.toLocaleString(locale),
                        bonus: creditPack.bonusCredits.toLocaleString(locale),
                      })
                    : t('subscriptionCreditsBaseOnly', {
                        base: creditPack.credits.toLocaleString(locale),
                      })}
                </p>

                <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                  <p className="text-3xl font-semibold text-foreground">
                    {formatMoney(locale, creditPack.currency, creditPack.unitAmount)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('subscriptionOneTimeCharge')}
                  </p>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <div className="space-y-3">
                    <SubscriptionStat
                      label={t('subscriptionCreditsIncluded')}
                      value={creditPack.credits.toLocaleString(locale)}
                    />
                    <SubscriptionStat
                      label={t('subscriptionCreditsBonusLabel')}
                      value={`+${creditPack.bonusCredits.toLocaleString(locale)}`}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className={`mt-auto h-12 w-full rounded-xl ${
                    featured
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                  onClick={() => {
                    void handleCreditPackCheckout(creditPack)
                  }}
                  disabled={isPending}
                >
                  {isPending
                    ? t('subscriptionRedirecting')
                    : isAuthenticated
                      ? t('subscriptionBuyCredits')
                      : t('subscriptionSignInFirst')}
                </Button>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-4">
          <article className="flex h-full flex-col rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {t('subscriptionFreeLabel')}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-foreground">Free</h3>
              </div>
              {subscription.plan === 'free' && selectedMode === 'plan_auto_monthly' ? (
                <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  {t('subscriptionCurrentPlan')}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t('subscriptionFreeBody')}
            </p>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
              <p className="text-3xl font-semibold text-foreground">{t('subscriptionFreePrice')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('subscriptionFreePriceBody')}
              </p>
            </div>

            <div className="mt-6 flex flex-1 flex-col">
              <div className="space-y-3">
                <SubscriptionStat label={t('subscriptionCreditsIncluded')} value="0" />
                <SubscriptionStat
                  label={t('subscriptionStorageIncluded')}
                  value={t('subscriptionStorageValue', { value: 1 })}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="mt-auto h-12 w-full rounded-xl"
              disabled={subscription.plan === 'free' && selectedMode === 'plan_auto_monthly'}
              onClick={() => router.push('/workspace')}
            >
              {subscription.plan === 'free' && selectedMode === 'plan_auto_monthly'
                ? t('subscriptionCurrentPlan')
                : t('subscriptionContinueFree')}
            </Button>
          </article>

          {visiblePlans.map((plan) => {
            const isPending = pendingKey === `${plan.plan}:${plan.purchaseMode}`
            const isCurrentPlan =
              subscription.plan === plan.plan && subscription.purchaseMode === plan.purchaseMode
            const featured = plan.plan === 'pro'

            return (
              <article
                key={`${plan.plan}:${plan.purchaseMode}`}
                className={`flex h-full flex-col rounded-[26px] border p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] ${
                  featured
                    ? 'border-violet-300 bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ff_100%)]'
                    : 'border-border/70 bg-white/95'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {selectedMode === 'plan_auto_monthly'
                        ? t('subscriptionToggleMonthly')
                        : t('subscriptionToggleOneTime')}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold capitalize text-foreground">
                      {plan.plan}
                    </h3>
                  </div>
                  {featured ? (
                    <span className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                      {t('subscriptionPopular')}
                    </span>
                  ) : isCurrentPlan ? (
                    <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {t('subscriptionCurrentPlan')}
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(`subscriptionPlanBody_${plan.plan}`)}
                </p>

                <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                  <p className="text-3xl font-semibold text-foreground">
                    {formatMoney(locale, plan.currency, plan.unitAmount)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedMode === 'plan_auto_monthly'
                      ? t('subscriptionMonthlyCharge')
                      : t('subscriptionOneTimeCharge')}
                  </p>
                </div>

                <div className="mt-6 flex flex-1 flex-col">
                  <div className="space-y-3">
                    <SubscriptionStat
                      label={
                        selectedMode === 'plan_auto_monthly'
                          ? t('subscriptionMonthlyCreditsLabel')
                          : t('subscriptionPermanentCreditsLabel')
                      }
                      value={plan.monthlyCredits.toLocaleString(locale)}
                    />
                    <SubscriptionStat
                      label={t('subscriptionStorageIncluded')}
                      value={t('subscriptionStorageValue', { value: plan.storageGB })}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className={`mt-auto h-12 w-full rounded-xl ${
                    featured
                      ? 'bg-violet-600 text-white hover:bg-violet-700'
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                  onClick={() => {
                    void handlePlanCheckout(plan)
                  }}
                  disabled={isPending || isCurrentPlan}
                >
                  {isCurrentPlan
                    ? t('subscriptionCurrentPlan')
                    : isPending
                      ? t('subscriptionRedirecting')
                      : isAuthenticated
                        ? selectedMode === 'plan_auto_monthly'
                          ? t('subscriptionStartMonthly')
                          : t('subscriptionBuyOneTime')
                        : t('subscriptionSignInFirst')}
                </Button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SubscriptionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}
