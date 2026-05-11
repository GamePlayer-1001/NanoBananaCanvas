/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useLocale/useTranslations，依赖 sonner 的 toast，
 *          依赖 @/lib/billing/pricing 与 @/lib/billing/subscription 类型，
 *          依赖 @/components/ui/button / tabs，依赖 @/i18n/navigation 的 useRouter
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅页签
 * [POS]: profile 的订阅购买面板，被账户页消费，当前只展示月度自动订阅并触发真实结账
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

type PurchaseMode = 'plan_auto_monthly'

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
  initialMode = 'plan_auto_monthly',
  onModeChange,
}: SubscriptionTabProps) {
  const t = useTranslations('profile')
  const pricingT = useTranslations('landing.sections.pricing')
  const locale = useLocale()
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<PurchaseMode>(initialMode)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    setSelectedMode(initialMode)
  }, [initialMode])

  const visiblePlans = plans.filter((plan) => plan.purchaseMode === 'plan_auto_monthly')
  const standardPlan = visiblePlans.find((plan) => plan.plan === 'standard')

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

  async function handleTrialCheckout(plan: PublicBillingPlanPrice | undefined) {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/account')
      return
    }

    if (!plan) {
      toast.error(t('subscriptionCheckoutFailed'))
      return
    }

    if (!subscription.standardTrialEligible) {
      await handlePlanCheckout(plan)
      return
    }

    setPendingKey('trial:standard')

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseMode: 'plan_trial_standard',
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
          </TabsList>
        </Tabs>

        <p className="mt-4 text-sm text-muted-foreground">
          {t('subscriptionModeMonthlyBody')}
        </p>
      </section>

      {!isPricingReady ? (
        <div className="rounded-[24px] border border-amber-300/40 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          {t('subscriptionPricingUnavailable')}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <article className="flex h-full flex-col rounded-[26px] border border-border/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {pricingT('plans.free.planLabel')}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-foreground">
                    {pricingT('plans.free.name')}
                  </h3>
                </div>
                {subscription.status === 'trialing' ? (
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {t('subscriptionCurrentPlan')}
                  </span>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                <p className="text-3xl font-semibold text-foreground">
                  {pricingT('plans.free.period')}
                </p>
              </div>

              <div className="mt-6 flex flex-1 flex-col">
                <div className="space-y-3">
                  <SubscriptionFeature value={pricingT('plans.free.note')} />
                  <SubscriptionFeature value={pricingT('plans.free.storageNote')} />
                  <SubscriptionFeature value={pricingT('plans.free.supportNote')} />
                </div>
              </div>

              <div className="mt-auto pt-16">
                <Button
                  type="button"
                  className="h-12 w-full rounded-xl"
                  disabled={pendingKey === 'trial:standard' || !standardPlan}
                  onClick={() => {
                    void handleTrialCheckout(standardPlan)
                  }}
                >
                  {pendingKey === 'trial:standard'
                    ? t('subscriptionRedirecting')
                    : isAuthenticated
                      ? pricingT('plans.free.cta')
                      : t('subscriptionSignInFirst')}
                </Button>
              </div>
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
                    {pricingT(`plans.${plan.plan}.planLabel`)}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-foreground">
                    {pricingT(`plans.${plan.plan}.name`)}
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

              <div className="mt-6 rounded-2xl border border-border/60 bg-muted/20 px-4 py-4">
                <p className="text-3xl font-semibold text-foreground">
                  {formatMoney(locale, plan.currency, plan.unitAmount)}{' '}
                  {pricingT(`plans.${plan.plan}.period`)}
                </p>
              </div>

              <div className="mt-6 flex flex-1 flex-col">
                <div className="space-y-3">
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.note`)} />
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.supportNote`)} />
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.useCase`)} />
                  {plan.plan === 'ultimate' ? (
                    <SubscriptionFeature value={pricingT('plans.ultimate.extra')} />
                  ) : null}
                </div>
              </div>

              <div className="mt-auto pt-16">
                <Button
                  type="button"
                  className={`h-12 w-full rounded-xl ${
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
                        ? pricingT(`plans.${plan.plan}.cta`)
                        : t('subscriptionSignInFirst')}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function SubscriptionFeature({ value }: { value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm leading-6">
      <span className="mt-0.5 text-emerald-600">✓</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}
