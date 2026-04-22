/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 ./config、./plans、./stripe-client
 * [OUTPUT]: 对外提供 createCheckoutSession()，返回 Stripe Checkout URL 与解析后的计费语义
 * [POS]: lib/billing 的结账编排层，负责把业务语义(plan/mode/currency)翻译成 Stripe Checkout Session
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import {
  type BillingCurrency,
  type BillingPlan,
  type BillingPurchaseMode,
  type CreditPackId,
  resolveStripePriceId,
} from './config'
import { getBillingPlanSnapshot } from './plans'
import { getOrCreateStripeCustomer, getStripe, requireAppBaseUrl } from './stripe-client'

export type CreateCheckoutSessionInput =
  | {
      userId: string
      plan: BillingPlan
      purchaseMode: Extract<BillingPurchaseMode, 'plan_auto_monthly' | 'plan_one_time'>
      preferredCurrency: BillingCurrency
    }
  | {
      userId: string
      packageId: CreditPackId
      purchaseMode: Extract<BillingPurchaseMode, 'credit_pack'>
      preferredCurrency: BillingCurrency
    }

export interface CheckoutSessionResult {
  checkoutUrl: string
  sessionId: string
  preferredCurrency: BillingCurrency
  plan?: BillingPlan
  packageId?: CreditPackId
  purchaseMode: Extract<BillingPurchaseMode, 'plan_auto_monthly' | 'plan_one_time' | 'credit_pack'>
}

function buildSuccessUrl(appUrl: string): string {
  return `${appUrl}/account?billing=checkout_success`
}

function buildCancelUrl(appUrl: string): string {
  return `${appUrl}/account?billing=checkout_canceled`
}

function buildCheckoutMetadata(input: CreateCheckoutSessionInput): Stripe.MetadataParam {
  if (input.purchaseMode === 'credit_pack') {
    return {
      userId: input.userId,
      purchaseMode: input.purchaseMode,
      packageId: input.packageId,
      preferredCurrency: input.preferredCurrency,
    }
  }

  const snapshot = getBillingPlanSnapshot(input.plan)

  return {
    userId: input.userId,
    plan: input.plan,
    purchaseMode: input.purchaseMode,
    preferredCurrency: input.preferredCurrency,
    monthlyCredits: String(snapshot.monthlyCredits),
    storageGB: String(snapshot.storageGB),
  }
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = await getStripe()
  const appUrl = await requireAppBaseUrl()
  const customer = await getOrCreateStripeCustomer(input.userId)
  const priceId = await resolveStripePriceId({
    purchaseMode: input.purchaseMode,
    plan: input.purchaseMode === 'credit_pack' ? undefined : input.plan,
    packageId: input.purchaseMode === 'credit_pack' ? input.packageId : undefined,
    currency: input.preferredCurrency,
  })

  const session = await stripe.checkout.sessions.create({
    mode: input.purchaseMode === 'plan_auto_monthly' ? 'subscription' : 'payment',
    customer: customer.customerId,
    client_reference_id: input.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: buildCheckoutMetadata(input),
    ...(input.purchaseMode === 'plan_auto_monthly'
      ? {
          subscription_data: {
            metadata: buildCheckoutMetadata(input),
          },
        }
      : {}),
    allow_promotion_codes: true,
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    success_url: buildSuccessUrl(appUrl),
    cancel_url: buildCancelUrl(appUrl),
  })

  if (!session.url) {
    throw new Error('Stripe checkout session url is missing')
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    preferredCurrency: input.preferredCurrency,
    plan: input.purchaseMode === 'credit_pack' ? undefined : input.plan,
    packageId: input.purchaseMode === 'credit_pack' ? input.packageId : undefined,
    purchaseMode: input.purchaseMode,
  }
}
