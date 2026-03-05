/**
 * [INPUT]: 依赖 stripe SDK, @/lib/db, @/lib/credits, @/lib/stripe, @/lib/logger
 * [OUTPUT]: 对外提供 POST /api/webhooks/stripe (Stripe Webhook 事件处理)
 * [POS]: api/webhooks 的 Stripe 端点，处理 checkout/invoice/subscription 事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { addCredits, resetMonthlyCredits } from '@/lib/credits'
import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { getStripe, PLAN_CREDITS } from '@/lib/stripe'

const log = createLogger('webhook:stripe')

/* ─── POST /api/webhooks/stripe ──────────────────────── */

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    log.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch {
    log.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 400 })
  }

  const db = await getDb()

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(db, event.data.object as Stripe.Checkout.Session)
      break

    case 'invoice.paid':
      await handleInvoicePaid(db, event.data.object as Stripe.Invoice)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription)
      break

    default:
      log.info('Unhandled webhook event', { type: event.type })
  }

  return new Response('ok', { status: 200 })
}

/* ─── Event Handlers ─────────────────────────────────── */

async function handleCheckoutCompleted(db: D1Database, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  const type = session.metadata?.type
  if (!userId) return

  if (type === 'subscription') {
    const plan = session.metadata?.plan ?? 'standard'
    const billingPeriod = session.metadata?.billingPeriod ?? 'monthly'
    const credits = PLAN_CREDITS[plan] ?? 200

    // 更新订阅记录
    await db
      .prepare(
        `UPDATE subscriptions
         SET stripe_subscription_id = ?,
             plan = ?, billing_period = ?, status = 'active',
             monthly_credits = ?,
             current_period_start = datetime('now'),
             cancel_at_period_end = 0,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(
        session.subscription as string,
        plan,
        billingPeriod,
        credits,
        userId,
      )
      .run()

    // 更新 users.plan
    await db
      .prepare("UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(plan, userId)
      .run()

    // 充值首月积分
    await resetMonthlyCredits(db, userId, credits)

    log.info('Subscription created', { userId, plan, credits })
  } else if (type === 'topup') {
    const credits = parseInt(session.metadata?.credits ?? '0', 10)
    const packageId = session.metadata?.packageId

    if (credits > 0) {
      await addCredits(db, userId, credits, 'permanent', 'topup_purchase', packageId)
      log.info('Topup completed', { userId, credits, packageId })
    }
  }
}

async function handleInvoicePaid(db: D1Database, invoice: Stripe.Invoice) {
  // 跳过首次发票 (checkout.session.completed 已处理)
  if (invoice.billing_reason === 'subscription_create') return

  const customerId = invoice.customer as string
  const sub = await db
    .prepare('SELECT user_id, plan, monthly_credits FROM subscriptions WHERE stripe_customer_id = ?')
    .bind(customerId)
    .first<{ user_id: string; plan: string; monthly_credits: number }>()

  if (!sub) return

  // 月度积分重置 (不累加，是重置)
  await resetMonthlyCredits(db, sub.user_id, sub.monthly_credits)

  // 更新订阅周期
  const stripeSubId = invoice.subscription as string
  if (stripeSubId) {
    await db
      .prepare(
        `UPDATE subscriptions
         SET current_period_start = datetime('now'),
             status = 'active',
             updated_at = datetime('now')
         WHERE stripe_customer_id = ?`,
      )
      .bind(customerId)
      .run()
  }

  log.info('Invoice paid — monthly credits reset', { userId: sub.user_id, credits: sub.monthly_credits })
}

async function handleSubscriptionDeleted(db: D1Database, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const sub = await db
    .prepare('SELECT user_id FROM subscriptions WHERE stripe_customer_id = ?')
    .bind(customerId)
    .first<{ user_id: string }>()

  if (!sub) return

  // 降级为 Free
  await db.batch([
    db
      .prepare(
        `UPDATE subscriptions
         SET plan = 'free', status = 'canceled', monthly_credits = 200,
             stripe_subscription_id = NULL, cancel_at_period_end = 0,
             updated_at = datetime('now')
         WHERE stripe_customer_id = ?`,
      )
      .bind(customerId),
    db
      .prepare("UPDATE users SET plan = 'free', updated_at = datetime('now') WHERE id = ?")
      .bind(sub.user_id),
  ])

  // 重置为 Free 积分
  await resetMonthlyCredits(db, sub.user_id, 200)

  log.info('Subscription deleted — downgraded to free', { userId: sub.user_id })
}

async function handleSubscriptionUpdated(db: D1Database, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // 同步状态
  const status = subscription.status === 'active' ? 'active'
    : subscription.status === 'past_due' ? 'past_due'
    : subscription.status === 'canceled' ? 'canceled'
    : 'active'

  await db
    .prepare(
      `UPDATE subscriptions
       SET status = ?, cancel_at_period_end = ?,
           updated_at = datetime('now')
       WHERE stripe_customer_id = ?`,
    )
    .bind(status, subscription.cancel_at_period_end ? 1 : 0, customerId)
    .run()

  log.info('Subscription updated', { customerId, status })
}
