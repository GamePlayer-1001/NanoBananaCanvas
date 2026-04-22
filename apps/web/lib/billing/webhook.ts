/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 @/lib/db、@/lib/errors、@/lib/logger、@/lib/nanoid，依赖 ./config、./entitlements、./stripe-client
 * [OUTPUT]: 对外提供 processStripeWebhookEvent()，处理 Stripe 事件验签后的幂等落账
 * [POS]: lib/billing 的 Webhook 处理层，负责把 Stripe 事件翻译成订单审计与权益同步动作
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

import { type BillingPlan, type CreditPackId, getStripeBillingConfig } from './config'
import {
  applyFreePlanDowngrade,
  awardCreditPackCredits,
  awardOneTimePlanCredits,
  resetPlanMonthlyCredits,
  syncUserPlanEntitlement,
} from './entitlements'
import { getBillingPlanSnapshot, getCreditPackSnapshot } from './plans'
import { getStripe } from './stripe-client'

const log = createLogger('billing:webhook')

const BILLING_WEBHOOK_EVENTS = new Set([
  'checkout.session.completed',
  'invoice.paid',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

type OrderKind = 'plan_one_time' | 'credit_pack'

function isSupportedWebhookEvent(type: string): boolean {
  return BILLING_WEBHOOK_EVENTS.has(type)
}

function toIsoOrNull(value: number | null | undefined): string | null {
  if (!value) {
    return null
  }

  return new Date(value * 1000).toISOString()
}

function toPlanPurchaseMode(value: string | null | undefined): 'auto_monthly' | 'one_time' {
  return value === 'plan_one_time' ? 'one_time' : 'auto_monthly'
}

function toSubscriptionStatus(value: string | null | undefined): string {
  return value ?? 'active'
}

function toCreditPackageRowId(packageId: CreditPackId): string {
  return `pack_${packageId}`
}

function getSubscriptionItemPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
} {
  const primaryItem = subscription.items.data[0]

  return {
    currentPeriodStart: toIsoOrNull(primaryItem?.current_period_start),
    currentPeriodEnd: toIsoOrNull(primaryItem?.current_period_end),
  }
}

async function ensureEventNotProcessed(event: Stripe.Event): Promise<boolean> {
  const db = await getDb()
  const result = await db
    .prepare(
      `INSERT OR IGNORE INTO processed_stripe_events (event_id, event_type)
       VALUES (?, ?)`,
    )
    .bind(event.id, event.type)
    .run()

  return (result.meta.changes ?? 0) > 0
}

async function insertBillingOrder(input: {
  userId: string
  stripeCheckoutSessionId: string
  stripePaymentIntentId: string | null
  stripeCustomerId: string | null
  orderKind: OrderKind
  plan: BillingPlan | null
  packageId: CreditPackId | null
  currency: string
  amountTotal: number
  creditsAwarded: number
  metadata: Record<string, unknown>
}) {
  const db = await getDb()
  await db
    .prepare(
      `INSERT INTO billing_orders (
         id,
         user_id,
         stripe_checkout_session_id,
         stripe_payment_intent_id,
         stripe_customer_id,
         order_kind,
         plan,
         package_id,
         currency,
         amount_total,
         credits_awarded,
         status,
         metadata,
         paid_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, datetime('now'))`,
    )
    .bind(
      nanoid(),
      input.userId,
      input.stripeCheckoutSessionId,
      input.stripePaymentIntentId,
      input.stripeCustomerId,
      input.orderKind,
      input.plan,
      input.packageId ? toCreditPackageRowId(input.packageId) : null,
      input.currency,
      input.amountTotal,
      input.creditsAwarded,
      JSON.stringify(input.metadata),
    )
    .run()
}

async function retrieveSubscriptionOrThrow(id: string): Promise<Stripe.Subscription> {
  const stripe = await getStripe()
  return (await stripe.subscriptions.retrieve(id)) as Stripe.Subscription
}

async function handlePlanCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  purchaseMode: 'plan_auto_monthly' | 'plan_one_time',
  plan: BillingPlan,
  userId: string,
) {
  if (purchaseMode === 'plan_auto_monthly') {
    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id

    if (!subscriptionId) {
      throw new BillingError(
        ErrorCode.BILLING_CONFIG_INVALID,
        'Stripe checkout session is missing subscription id for recurring plan',
        { eventId: event.id, sessionId: session.id },
      )
    }

    const subscription = await retrieveSubscriptionOrThrow(subscriptionId)
    const period = getSubscriptionItemPeriod(subscription)

    await syncUserPlanEntitlement({
      userId,
      stripeCustomerId:
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      plan,
      purchaseMode: 'auto_monthly',
      status: toSubscriptionStatus(subscription.status),
      currentPeriodStart: period.currentPeriodStart,
      currentPeriodEnd: period.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
    return
  }

  const snapshot = getBillingPlanSnapshot(plan)

  await syncUserPlanEntitlement({
    userId,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripeSubscriptionId: null,
    plan,
    purchaseMode: 'one_time',
    status: 'active',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  })
  await insertBillingOrder({
    userId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    orderKind: 'plan_one_time',
    plan,
    packageId: null,
    currency: session.currency ?? 'usd',
    amountTotal: session.amount_total ?? 0,
    creditsAwarded: snapshot.monthlyCredits,
    metadata: session.metadata ?? {},
  })
  await awardOneTimePlanCredits({
    userId,
    plan,
    referenceId: session.id,
  })
}

async function handleCreditPackCheckoutCompleted(
  session: Stripe.Checkout.Session,
  packageId: CreditPackId,
  userId: string,
) {
  const snapshot = getCreditPackSnapshot(packageId)

  await insertBillingOrder({
    userId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    orderKind: 'credit_pack',
    plan: null,
    packageId,
    currency: session.currency ?? 'usd',
    amountTotal: session.amount_total ?? 0,
    creditsAwarded: snapshot.totalCredits,
    metadata: session.metadata ?? {},
  })
  await awardCreditPackCredits({
    userId,
    packageId,
    referenceId: session.id,
  })
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata ?? {}
  const userId = metadata.userId
  const purchaseMode = metadata.purchaseMode

  if (!userId || !purchaseMode) {
    log.warn('Skip checkout.session.completed without billing metadata', {
      eventId: event.id,
      sessionId: session.id,
    })
    return
  }

  if (purchaseMode === 'credit_pack') {
    const packageId = metadata.packageId as CreditPackId | undefined
    if (!packageId) {
      throw new BillingError(
        ErrorCode.BILLING_PACKAGE_INVALID,
        'Stripe checkout session is missing credit pack metadata',
        { eventId: event.id, sessionId: session.id },
      )
    }

    await handleCreditPackCheckoutCompleted(session, packageId, userId)
    return
  }

  const plan = metadata.plan as BillingPlan | undefined
  if (!plan) {
    throw new BillingError(
      ErrorCode.BILLING_PLAN_INVALID,
      'Stripe checkout session is missing plan metadata',
      { eventId: event.id, sessionId: session.id },
    )
  }

  await handlePlanCheckoutCompleted(
    event,
    session,
    purchaseMode as 'plan_auto_monthly' | 'plan_one_time',
    plan,
    userId,
  )
}

async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const parentSubscription = invoice.parent?.subscription_details?.subscription
  const subscriptionId = typeof parentSubscription === 'string'
    ? parentSubscription
    : parentSubscription?.id

  if (!subscriptionId) {
    log.warn('Skip invoice.paid without subscription id', { eventId: event.id, invoiceId: invoice.id })
    return
  }

  const subscription = await retrieveSubscriptionOrThrow(subscriptionId)
  const metadata = subscription.metadata ?? {}
  const userId = metadata.userId
  const plan = metadata.plan as BillingPlan | undefined

  if (!userId || !plan) {
    log.warn('Skip invoice.paid without recurring plan metadata', {
      eventId: event.id,
      invoiceId: invoice.id,
      subscriptionId,
    })
    return
  }

  const period = getSubscriptionItemPeriod(subscription)
  await syncUserPlanEntitlement({
    userId,
    stripeCustomerId:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    plan,
    purchaseMode: 'auto_monthly',
    status: toSubscriptionStatus(subscription.status),
    currentPeriodStart: period.currentPeriodStart,
    currentPeriodEnd: period.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
  await resetPlanMonthlyCredits({
    userId,
    plan,
    referenceId: invoice.id,
    source: 'stripe_subscription_renewal',
    description: 'Stripe subscription renewal credits',
  })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const metadata = subscription.metadata ?? {}
  const userId = metadata.userId
  const plan = metadata.plan as BillingPlan | undefined

  if (!userId || !plan) {
    log.warn('Skip customer.subscription.updated without plan metadata', {
      eventId: event.id,
      subscriptionId: subscription.id,
    })
    return
  }

  const period = getSubscriptionItemPeriod(subscription)

  await syncUserPlanEntitlement({
    userId,
    stripeCustomerId:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    plan,
    purchaseMode: toPlanPurchaseMode(metadata.purchaseMode),
    status: toSubscriptionStatus(subscription.status),
    currentPeriodStart: period.currentPeriodStart,
    currentPeriodEnd: period.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const metadata = subscription.metadata ?? {}
  const userId = metadata.userId

  if (!userId) {
    log.warn('Skip customer.subscription.deleted without user metadata', {
      eventId: event.id,
      subscriptionId: subscription.id,
    })
    return
  }

  await applyFreePlanDowngrade({
    userId,
    stripeCustomerId:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    status: 'canceled',
    referenceId: event.id,
  })
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<{
  received: true
  processed: boolean
  ignored?: boolean
}> {
  if (!isSupportedWebhookEvent(event.type)) {
    return { received: true, processed: false, ignored: true }
  }

  const isFirstProcess = await ensureEventNotProcessed(event)
  if (!isFirstProcess) {
    return { received: true, processed: false, ignored: true }
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event)
      break
    case 'invoice.paid':
      await handleInvoicePaid(event)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event)
      break
    default:
      return { received: true, processed: false, ignored: true }
  }

  return { received: true, processed: true }
}

export async function verifyStripeWebhookSignature(payload: string, signature: string | null): Promise<Stripe.Event> {
  if (!signature) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Missing Stripe-Signature header',
      {},
    )
  }

  const stripe = await getStripe()
  const config = await getStripeBillingConfig()
  return stripe.webhooks.constructEvent(payload, signature, config.webhookSecret)
}
