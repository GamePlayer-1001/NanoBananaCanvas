/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 @/lib/db、@/lib/errors、@/lib/logger、@/lib/nanoid，依赖 ./config、./plans、./stripe-client
 * [OUTPUT]: 对外提供 processStripeWebhookEvent()，处理 Stripe 事件验签后的幂等落账
 * [POS]: lib/billing 的 Webhook 处理层，负责把 Stripe 事件同步到 subscriptions / billing_orders / credit_balances
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

import { type BillingPlan, type CreditPackId, getStripeBillingConfig } from './config'
import { FREE_PLAN_SNAPSHOT, getBillingPlanSnapshot } from './plans'
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

function toBillingPeriod(value: 'auto_monthly' | 'one_time'): 'monthly' | 'one_time' {
  return value === 'one_time' ? 'one_time' : 'monthly'
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

async function ensureCreditBalanceRow(userId: string) {
  const db = await getDb()
  await db
    .prepare(
      `INSERT OR IGNORE INTO credit_balances (
         user_id,
         monthly_balance,
         permanent_balance,
         frozen_credits,
         total_earned,
         total_spent
       ) VALUES (?, 0, 0, 0, 0, 0)`,
    )
    .bind(userId)
    .run()
}

async function updateUserMembership(userId: string, plan: BillingPlan | 'free') {
  const db = await getDb()
  await db
    .prepare(
      `UPDATE users
       SET plan = ?, membership_status = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(plan, plan, userId)
    .run()
}

async function upsertSubscriptionRow(input: {
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  plan: BillingPlan | 'free'
  purchaseMode: 'auto_monthly' | 'one_time'
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}) {
  const db = await getDb()
  const snapshot =
    input.plan === 'free' ? FREE_PLAN_SNAPSHOT : getBillingPlanSnapshot(input.plan)
  const existing = await db
    .prepare('SELECT id FROM subscriptions WHERE user_id = ?')
    .bind(input.userId)
    .first<{ id: string }>()

  if (existing?.id) {
    await db
      .prepare(
        `UPDATE subscriptions
         SET stripe_customer_id = ?,
             stripe_subscription_id = ?,
             plan = ?,
             purchase_mode = ?,
             billing_period = ?,
             status = ?,
             current_period_start = ?,
             current_period_end = ?,
             monthly_credits = ?,
             storage_gb = ?,
             cancel_at_period_end = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(
        input.stripeCustomerId,
        input.stripeSubscriptionId,
        input.plan,
        input.purchaseMode,
        toBillingPeriod(input.purchaseMode),
        input.status,
        input.currentPeriodStart,
        input.currentPeriodEnd,
        snapshot.monthlyCredits,
        snapshot.storageGB,
        input.cancelAtPeriodEnd ? 1 : 0,
        existing.id,
      )
      .run()
    return
  }

  await db
    .prepare(
      `INSERT INTO subscriptions (
         id,
         user_id,
         stripe_customer_id,
         stripe_subscription_id,
         plan,
         purchase_mode,
         billing_period,
         status,
         current_period_start,
         current_period_end,
         monthly_credits,
         storage_gb,
         cancel_at_period_end
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      nanoid(),
      input.userId,
      input.stripeCustomerId,
      input.stripeSubscriptionId,
      input.plan,
      input.purchaseMode,
      toBillingPeriod(input.purchaseMode),
      input.status,
      input.currentPeriodStart,
      input.currentPeriodEnd,
      snapshot.monthlyCredits,
      snapshot.storageGB,
      input.cancelAtPeriodEnd ? 1 : 0,
    )
    .run()
}

async function resetMonthlyCredits(userId: string, amount: number, referenceId: string) {
  const db = await getDb()
  await ensureCreditBalanceRow(userId)

  const current = await db
    .prepare(
      `SELECT monthly_balance, permanent_balance, total_earned, total_spent
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ monthly_balance: number; permanent_balance: number; total_earned: number; total_spent: number }>()

  const monthlyBalance = amount
  const permanentBalance = current?.permanent_balance ?? 0
  const nextTotalEarned = (current?.total_earned ?? 0) + amount

  await db
    .prepare(
      `UPDATE credit_balances
       SET monthly_balance = ?,
           total_earned = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`,
    )
    .bind(monthlyBalance, nextTotalEarned, userId)
    .run()

  await db
    .prepare(
      `INSERT INTO credit_transactions (
         id,
         user_id,
         type,
         pool,
         amount,
         balance_after,
         source,
         reference_id,
         description
       ) VALUES (?, ?, 'earn', 'monthly', ?, ?, 'stripe_subscription_renewal', ?, ?)`,
    )
    .bind(
      nanoid(),
      userId,
      amount,
      monthlyBalance + permanentBalance,
      referenceId,
      'Stripe subscription renewal credits',
    )
    .run()
}

async function awardPermanentCredits(userId: string, amount: number, referenceId: string, description: string) {
  const db = await getDb()
  await ensureCreditBalanceRow(userId)

  const current = await db
    .prepare(
      `SELECT monthly_balance, permanent_balance, total_earned
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ monthly_balance: number; permanent_balance: number; total_earned: number }>()

  const monthlyBalance = current?.monthly_balance ?? 0
  const permanentBalance = (current?.permanent_balance ?? 0) + amount
  const nextTotalEarned = (current?.total_earned ?? 0) + amount

  await db
    .prepare(
      `UPDATE credit_balances
       SET permanent_balance = ?,
           total_earned = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`,
    )
    .bind(permanentBalance, nextTotalEarned, userId)
    .run()

  await db
    .prepare(
      `INSERT INTO credit_transactions (
         id,
         user_id,
         type,
         pool,
         amount,
         balance_after,
         source,
         reference_id,
         description
       ) VALUES (?, ?, 'earn', 'permanent', ?, ?, 'stripe_credit_pack', ?, ?)`,
    )
    .bind(
      nanoid(),
      userId,
      amount,
      monthlyBalance + permanentBalance,
      referenceId,
      description,
    )
    .run()
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

    await upsertSubscriptionRow({
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
    await updateUserMembership(userId, plan)
    return
  }

  const snapshot = getBillingPlanSnapshot(plan)

  await upsertSubscriptionRow({
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
  await updateUserMembership(userId, plan)
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
}

async function handleCreditPackCheckoutCompleted(
  session: Stripe.Checkout.Session,
  packageId: CreditPackId,
  userId: string,
) {
  const creditPackMap: Record<CreditPackId, number> = {
    '500': 500,
    '1200': 1200,
    '3500': 3500,
    '8000': 8000,
  }
  const creditsAwarded = creditPackMap[packageId]

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
    creditsAwarded,
    metadata: session.metadata ?? {},
  })
  await awardPermanentCredits(
    userId,
    creditsAwarded,
    session.id,
    `Stripe credit pack ${packageId}`,
  )
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
  const snapshot = getBillingPlanSnapshot(plan)

  await upsertSubscriptionRow({
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
  await updateUserMembership(userId, plan)
  await resetMonthlyCredits(userId, snapshot.monthlyCredits, invoice.id)
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

  await upsertSubscriptionRow({
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
  await updateUserMembership(userId, plan)
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

  await upsertSubscriptionRow({
    userId,
    stripeCustomerId:
      typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripeSubscriptionId: subscription.id,
    plan: 'free',
    purchaseMode: 'auto_monthly',
    status: 'canceled',
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  })
  await updateUserMembership(userId, 'free')
  await resetMonthlyCredits(userId, FREE_PLAN_SNAPSHOT.monthlyCredits, event.id)
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
