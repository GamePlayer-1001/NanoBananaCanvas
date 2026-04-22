/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 ./config、./plans、./stripe-client，依赖 @/lib/errors
 * [OUTPUT]: 对外提供 getPublicPricingPlans()，返回面向 UI 的动态套餐价格目录
 * [POS]: lib/billing 的公开价格读取层，把 Stripe Price 真相源收口为前端可消费的套餐视图
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { BillingError, ErrorCode } from '@/lib/errors'

import {
  BILLING_PLANS,
  type BillingCurrency,
  CREDIT_PACK_IDS,
  type CreditPackId,
  resolveBillingCurrency,
  resolveStripePriceId,
} from './config'
import { getBillingPlanSnapshot, getCreditPackSnapshot } from './plans'
import { getStripe } from './stripe-client'

export interface PublicBillingPlanPrice {
  plan: (typeof BILLING_PLANS)[number]
  purchaseMode: 'plan_auto_monthly' | 'plan_one_time'
  stripePriceId: string
  currency: BillingCurrency
  unitAmount: number
  interval: 'month' | null
  monthlyCredits: number
  storageGB: number
}

export interface PublicPricingPlansResult {
  currency: BillingCurrency
  plans: PublicBillingPlanPrice[]
  creditPacks: PublicCreditPackPrice[]
}

export interface PublicCreditPackPrice {
  packageId: CreditPackId
  purchaseMode: 'credit_pack'
  stripePriceId: string
  currency: BillingCurrency
  unitAmount: number
  credits: number
  bonusCredits: number
  totalCredits: number
}

function resolveDisplayedAmount(
  price: Stripe.Price,
  requestedCurrency: BillingCurrency,
): { currency: BillingCurrency; unitAmount: number } {
  const currencyOptions = price.currency_options as
    | Partial<Record<BillingCurrency, { unit_amount?: number | null }>>
    | undefined

  const requestedOption = currencyOptions?.[requestedCurrency]
  if (requestedOption?.unit_amount != null) {
    return {
      currency: requestedCurrency,
      unitAmount: requestedOption.unit_amount,
    }
  }

  if (price.unit_amount == null) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Stripe price is missing unit_amount',
      { priceId: price.id },
    )
  }

  return {
    currency: price.currency as BillingCurrency,
    unitAmount: price.unit_amount,
  }
}

function assertRecurringInterval(price: Stripe.Price): 'month' | null {
  const interval = price.recurring?.interval

  if (!interval) {
    return null
  }

  if (interval !== 'month') {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Stripe price uses an unsupported recurring interval',
      { priceId: price.id, interval },
    )
  }

  return interval
}

export async function getPublicPricingPlans(options: {
  requestedCurrency?: string | null
  countryCode?: string | null
}): Promise<PublicPricingPlansResult> {
  const preferredCurrency = resolveBillingCurrency({
    requestedCurrency: options.requestedCurrency,
    countryCode: options.countryCode,
  })
  const stripe = await getStripe()

  const plans = await Promise.all(
    BILLING_PLANS.flatMap((plan) =>
      (['plan_auto_monthly', 'plan_one_time'] as const).map(async (purchaseMode) => {
        const stripePriceId = await resolveStripePriceId({
          plan,
          purchaseMode,
          currency: preferredCurrency,
        })
        const stripePrice = await stripe.prices.retrieve(stripePriceId)
        const displayed = resolveDisplayedAmount(stripePrice, preferredCurrency)
        const snapshot = getBillingPlanSnapshot(plan)

        return {
          plan,
          purchaseMode,
          stripePriceId,
          currency: displayed.currency,
          unitAmount: displayed.unitAmount,
          interval: assertRecurringInterval(stripePrice),
          monthlyCredits: snapshot.monthlyCredits,
          storageGB: snapshot.storageGB,
        }
      }),
    ),
  )

  const creditPacks = await Promise.all(
    CREDIT_PACK_IDS.map(async (packageId) => {
      const stripePriceId = await resolveStripePriceId({
        purchaseMode: 'credit_pack',
        packageId,
        currency: preferredCurrency,
      })
      const stripePrice = await stripe.prices.retrieve(stripePriceId)
      const displayed = resolveDisplayedAmount(stripePrice, preferredCurrency)
      const snapshot = getCreditPackSnapshot(packageId)

      return {
        packageId,
        purchaseMode: 'credit_pack' as const,
        stripePriceId,
        currency: displayed.currency,
        unitAmount: displayed.unitAmount,
        credits: snapshot.credits,
        bonusCredits: snapshot.bonusCredits,
        totalCredits: snapshot.totalCredits,
      }
    }),
  )

  return {
    currency: preferredCurrency,
    plans,
    creditPacks,
  }
}
