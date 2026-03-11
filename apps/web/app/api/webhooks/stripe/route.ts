/**
 * [INPUT]: 依赖 stripe SDK, @/lib/db, @/lib/credits, @/lib/stripe, @/lib/logger
 * [OUTPUT]: 对外提供 POST /api/webhooks/stripe (Stripe Webhook 事件处理)
 * [POS]: api/webhooks 的 Stripe 端点，处理 checkout/invoice/subscription 事件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { resetMonthlyCredits } from '@/lib/credits'
import { getDb } from '@/lib/db'
import { createLogger } from '@/lib/logger'
import { getStripe, getWebhookSecret, PLAN_CREDITS } from '@/lib/stripe'

const log = createLogger('webhook:stripe')

/* ─── POST /api/webhooks/stripe ──────────────────────── */

export async function POST(req: Request) {
  const WEBHOOK_SECRET = await getWebhookSecret().catch(() => null)
  if (!WEBHOOK_SECRET) {
    log.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = await getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch {
    log.error('Invalid webhook signature')
    return new Response('Invalid signature', { status: 400 })
  }

  const db = await getDb()

  // 幂等性: 原子 INSERT 抢占事件 (PK 约束保证唯一，消除 SELECT→INSERT 竞态窗口)
  const claimed = await db
    .prepare('INSERT OR IGNORE INTO processed_stripe_events (event_id, event_type) VALUES (?, ?)')
    .bind(event.id, event.type)
    .run()

  if (!claimed.meta.changes) {
    log.info('Duplicate webhook event, skipping', { eventId: event.id })
    return new Response('ok', { status: 200 })
  }

  try {
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
  } catch (err) {
    // 处理失败 → 移除抢占标记，允许 Stripe 重试
    await db.prepare('DELETE FROM processed_stripe_events WHERE event_id = ?').bind(event.id).run()
    log.error('Webhook processing failed, allowing retry', err, { eventId: event.id, type: event.type })
    return new Response('Processing failed', { status: 500 })
  }
}

/* ─── Event Handlers ─────────────────────────────────── */

async function handleCheckoutCompleted(db: D1Database, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) {
    log.error('checkout.session.completed missing userId in metadata', undefined, {
      sessionId: session.id,
      metadata: session.metadata as Record<string, unknown>,
    })
    return
  }

  const plan = session.metadata?.plan ?? 'pro'
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

  // 更新订阅周期 — 已通过 customer_id 定位，无需依赖 invoice.subscription 字段
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

  // 同步状态 — 覆盖 Stripe 全部合法状态
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    trialing: 'trialing',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'paused',
  }
  const status = statusMap[subscription.status] ?? 'active'

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
