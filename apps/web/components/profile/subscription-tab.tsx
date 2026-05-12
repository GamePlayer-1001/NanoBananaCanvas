/**
 * [INPUT]: 依赖 react 的 useState，依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/lib/billing/pricing 与 @/lib/billing/subscription 类型，
 *          依赖 @/components/ui/button / tabs，依赖 @/i18n/navigation 的 useRouter
 * [OUTPUT]: 对外提供 SubscriptionTab 订阅页签
 * [POS]: profile 的订阅购买面板，被账户页消费，当前只展示月度自动订阅并触发真实结账
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
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

function formatMoney(amount: number): string {
  return `$${(amount / 100).toFixed(2)}`
}

function splitPricePeriod(label: string) {
  const normalized = label.replace(/\s+/g, ' ').trim()
  const parts = normalized.split(' / ')

  if (parts.length === 2) {
    return {
      amount: parts[0],
      period: parts[1],
    }
  }

  return {
    amount: normalized,
    period: null,
  }
}

function PriceLine({
  amount,
  period,
}: {
  amount: string
  period: string | null
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-2 gap-y-1 text-foreground">
      <span className="text-[2.15rem] leading-none font-semibold tracking-tight tabular-nums sm:text-[2.35rem]">
        {amount}
      </span>
      {period ? (
        <span className="pb-0.5 text-sm font-medium leading-none text-muted-foreground sm:text-base">
          / {period}
        </span>
      ) : null}
    </div>
  )
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
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<PurchaseMode>(initialMode)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  useEffect(() => {
    setSelectedMode(initialMode)
  }, [initialMode])

  const visiblePlans = plans.filter((plan) => plan.purchaseMode === 'plan_auto_monthly')
  const standardPlan = visiblePlans.find((plan) => plan.plan === 'standard')
  const freeTrialPrice = splitPricePeriod(pricingT('plans.free.period'))

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

  async function handleOpenPortal() {
    if (!isAuthenticated) {
      router.push('/sign-in?redirect_url=/account?tab=subscription')
      return
    }

    setIsOpeningPortal(true)

    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const payload = (await response.json()) as {
        ok: boolean
        data?: { portalUrl: string }
        error?: { message?: string }
      }

      if (!response.ok || !payload.ok || !payload.data?.portalUrl) {
        throw new Error(payload.error?.message ?? t('subscriptionCheckoutFailed'))
      }

      window.location.assign(payload.data.portalUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('subscriptionCheckoutFailed'))
      setIsOpeningPortal(false)
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

      </section>

      {!isPricingReady ? (
        <div className="rounded-[24px] border border-amber-300/40 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          {t('subscriptionPricingUnavailable')}
        </div>
      ) : null}

      {isAuthenticated ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-border/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">{t('subscriptionCurrentPlan')}</p>
            <p className="text-sm text-muted-foreground">
              {subscription.plan} · {subscription.status}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl px-5"
            onClick={() => {
              void handleOpenPortal()
            }}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? t('openingBilling') : t('dashboardPortalAction')}
          </Button>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
        <article className="flex h-full flex-col rounded-[26px] border border-violet-300 bg-[linear-gradient(180deg,#ffffff_0%,#f7f3ff_100%)] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {pricingT('plans.free.planLabel')}
                  </p>
                  <h3 className="mt-2.5 text-2xl font-semibold text-foreground">
                    {pricingT('plans.free.name')}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {pricingT('plans.free.subtitle')}
                  </p>
                </div>
                <span className="rounded-full border border-violet-300 bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                  {t('subscriptionPopular')}
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5">
                <PriceLine amount={freeTrialPrice.amount} period={freeTrialPrice.period} />
              </div>

              <div className="mt-5 flex flex-1 flex-col">
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
          const formattedPrice = splitPricePeriod(
            `${formatMoney(plan.unitAmount)} ${pricingT(`plans.${plan.plan}.period`)}`,
          )
          return (
            <article
              key={`${plan.plan}:${plan.purchaseMode}`}
              className="flex h-full flex-col rounded-[26px] border border-border/70 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {pricingT(`plans.${plan.plan}.planLabel`)}
                  </p>
                  <h3 className="mt-2.5 text-2xl font-semibold text-foreground">
                    {pricingT(`plans.${plan.plan}.name`)}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {pricingT(`plans.${plan.plan}.subtitle`)}
                  </p>
                </div>
                {isCurrentPlan ? (
                  <span className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                    {t('subscriptionCurrentPlan')}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5">
                <PriceLine amount={formattedPrice.amount} period={formattedPrice.period} />
              </div>

              <div className="mt-5 flex flex-1 flex-col">
                <div className="space-y-3">
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.note`)} />
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.supportNote`)} />
                  {plan.plan === 'ultimate' ? (
                    <SubscriptionFeature value={pricingT('plans.ultimate.priorityNote')} />
                  ) : null}
                  <SubscriptionFeature value={pricingT(`plans.${plan.plan}.useCase`)} />
                  {plan.plan === 'ultimate' ? (
                    <SubscriptionFeature value={pricingT('plans.ultimate.extra')} />
                  ) : null}
                </div>
              </div>

              <div className="mt-auto pt-16">
                <Button
                  type="button"
                  className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90"
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
