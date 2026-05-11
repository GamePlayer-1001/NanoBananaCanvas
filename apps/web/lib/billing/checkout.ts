/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 @/lib/db，依赖 ./config、./plans、./schema、./stripe-client
 * [OUTPUT]: 对外提供 createCheckoutSession()，返回 Stripe Checkout URL 与解析后的计费语义
 * [POS]: lib/billing 的结账编排层，负责把业务语义(plan/mode/currency)翻译成 Stripe Checkout Session
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'

import {
  type BillingCurrency,
  type BillingPlan,
  type BillingPurchaseMode,
  type CreditPackId,
  STANDARD_TRIAL_DAYS,
  STANDARD_TRIAL_PURCHASE_MODE,
  resolveStripePriceId,
} from './config'
import { getBillingPlanSnapshot } from './plans'
import { getBillingSchemaInfo } from './schema'
import { withStripeErrorMapping } from './stripe-error'
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
      purchaseMode: Extract<BillingPurchaseMode, 'plan_trial_standard'>
      preferredCurrency: BillingCurrency
    }
  | {
      userId: string
      packageId: CreditPackId
      purchaseMode: Extract<BillingPurchaseMode, 'credit_pack'>
      preferredCurrency: BillingCurrency
    }

type PlanCheckoutSessionInput = Exclude<CreateCheckoutSessionInput, { purchaseMode: 'credit_pack' }>

export interface CheckoutSessionResult {
  checkoutUrl: string
  sessionId: string
  preferredCurrency: BillingCurrency
  plan?: BillingPlan
  packageId?: CreditPackId
  purchaseMode: BillingPurchaseMode
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

  const plan = resolveCheckoutPlan(input)
  const snapshot = getBillingPlanSnapshot(plan)

  return {
    userId: input.userId,
    plan,
    purchaseMode: input.purchaseMode,
    preferredCurrency: input.preferredCurrency,
    monthlyCredits: String(snapshot.monthlyCredits),
    storageGB: String(snapshot.storageGB),
    ...(isStandardTrialCheckout(input) ? { trialDays: String(STANDARD_TRIAL_DAYS) } : {}),
  }
}

function isStandardTrialCheckout(
  input: CreateCheckoutSessionInput,
): input is Extract<CreateCheckoutSessionInput, { purchaseMode: 'plan_trial_standard' }> {
  return input.purchaseMode === STANDARD_TRIAL_PURCHASE_MODE
}

function isSubscriptionCheckout(input: CreateCheckoutSessionInput): boolean {
  return input.purchaseMode === 'plan_auto_monthly' || isStandardTrialCheckout(input)
}

function resolveCheckoutPlan(input: PlanCheckoutSessionInput): BillingPlan {
  return isStandardTrialCheckout(input) ? 'standard' : input.plan
}

async function assertStandardTrialAvailable(userId: string) {
  const schema = await getBillingSchemaInfo()
  const db = await getDb()

  if (schema.usersColumns.has('standard_trial_used_at')) {
    const user = await db
      .prepare('SELECT standard_trial_used_at FROM users WHERE id = ?')
      .bind(userId)
      .first<{ standard_trial_used_at: string | null }>()

    if (user?.standard_trial_used_at) {
      throw new BillingError(
        ErrorCode.BILLING_TRIAL_ALREADY_USED,
        'Standard trial has already been used for this account',
        { userId, trial: 'standard' },
      )
    }
  }

  if (!schema.hasSubscriptions || !schema.subscriptionsColumns.has('user_id')) {
    return
  }

  const existing = await db
    .prepare(
      `SELECT plan, status, stripe_subscription_id
       FROM subscriptions
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ plan: string | null; status: string | null; stripe_subscription_id: string | null }>()

  const activeStatuses = new Set(['active', 'trialing', 'past_due', 'incomplete'])
  if (existing?.stripe_subscription_id && activeStatuses.has(existing.status ?? '')) {
    throw new BillingError(
      ErrorCode.BILLING_TRIAL_ALREADY_USED,
      'An active or pending subscription already exists for this account',
      { userId, plan: existing.plan, status: existing.status },
    )
  }
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const stripe = await getStripe()
  const appUrl = await requireAppBaseUrl()

  if (isStandardTrialCheckout(input)) {
    await assertStandardTrialAvailable(input.userId)
  }

  const customer = await getOrCreateStripeCustomer(input.userId)
  const priceId = await resolveStripePriceId({
    purchaseMode: input.purchaseMode,
    plan: input.purchaseMode === 'credit_pack' ? undefined : resolveCheckoutPlan(input),
    packageId: input.purchaseMode === 'credit_pack' ? input.packageId : undefined,
    currency: input.preferredCurrency,
  })
  const metadata = buildCheckoutMetadata(input)

  const session = await withStripeErrorMapping('creating checkout session', () =>
    stripe.checkout.sessions.create({
      mode: isSubscriptionCheckout(input) ? 'subscription' : 'payment',
      customer: customer.customerId,
      client_reference_id: input.userId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      ...(isSubscriptionCheckout(input)
        ? {
            subscription_data: {
              metadata,
              ...(isStandardTrialCheckout(input) ? { trial_period_days: STANDARD_TRIAL_DAYS } : {}),
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
    }),
  )

  if (!session.url) {
    throw new BillingError(
      ErrorCode.BILLING_PROVIDER_ERROR,
      'Stripe checkout session url is missing',
      { sessionId: session.id, action: 'creating checkout session' },
    )
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
    preferredCurrency: input.preferredCurrency,
    plan: input.purchaseMode === 'credit_pack' ? undefined : resolveCheckoutPlan(input),
    packageId: input.purchaseMode === 'credit_pack' ? input.packageId : undefined,
    purchaseMode: input.purchaseMode,
  }
}
