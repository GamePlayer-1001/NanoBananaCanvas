/**
 * [INPUT]: 依赖 stripe SDK，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 getStripe / getOrCreateCustomer / PLAN_CREDITS
 * [POS]: lib 的 Stripe 客户端初始化 + 套餐配置，被 billing API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Stripe from 'stripe'

import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

const log = createLogger('Stripe')

/* ─── Singleton ──────────────────────────────────────── */

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
    _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' })
  }
  return _stripe
}

/* ─── Plan Config ────────────────────────────────────── */

export const PLAN_CREDITS: Record<string, number> = {
  free: 200,
  standard: 1600,
  pro: 5400,
  ultimate: 17000,
}

export const PLAN_ORDER = ['free', 'standard', 'pro', 'ultimate'] as const

/** 获取 Stripe Price ID (从 env var) */
export function getStripePriceId(plan: string, period: string): string {
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${period.toUpperCase()}`
  const priceId = process.env[key]
  if (!priceId) throw new Error(`Missing env var: ${key}`)
  return priceId
}

/* ─── Customer Management ────────────────────────────── */

/** 获取或创建 Stripe Customer，关联用户 */
export async function getOrCreateCustomer(
  stripe: Stripe,
  db: D1Database,
  userId: string,
  email: string,
): Promise<{ customerId: string; subscriptionId: string }> {
  // 查现有订阅记录
  const existing = await db
    .prepare('SELECT id, stripe_customer_id FROM subscriptions WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string; stripe_customer_id: string | null }>()

  if (existing?.stripe_customer_id) {
    return { customerId: existing.stripe_customer_id, subscriptionId: existing.id }
  }

  // 创建 Stripe Customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  log.info('Stripe customer created', { userId, customerId: customer.id })

  // 确保 subscription 行存在
  const subId = existing?.id ?? nanoid()
  if (!existing) {
    await db
      .prepare(
        `INSERT INTO subscriptions (id, user_id, stripe_customer_id)
         VALUES (?, ?, ?)`,
      )
      .bind(subId, userId, customer.id)
      .run()
  } else {
    await db
      .prepare(
        `UPDATE subscriptions SET stripe_customer_id = ?, updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(customer.id, userId)
      .run()
  }

  return { customerId: customer.id, subscriptionId: subId }
}
