/**
 * [INPUT]: 依赖 stripe SDK，依赖 @opennextjs/cloudflare，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 getStripe / getOrCreateCustomer / getPrices / PLAN_CREDITS / STRIPE_PRODUCT_ID
 * [POS]: lib 的 Stripe 客户端初始化 + 套餐配置，被 billing API 路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Stripe from 'stripe'
import { getCloudflareContext } from '@opennextjs/cloudflare'

import { PLANS } from '@nano-banana/shared/constants'
import type { PlanType } from '@nano-banana/shared/types'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

const log = createLogger('Stripe')

/* ─── Env Helper ──────────────────────────────────────── */

async function getEnv(key: string): Promise<string | undefined> {
  const { env } = await getCloudflareContext()
  return (env as unknown as Record<string, string>)[key]
}

/* ─── Stripe Client ──────────────────────────────────── */

let _stripe: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (!_stripe) {
    const key = await getEnv('STRIPE_SECRET_KEY')
    if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
    _stripe = new Stripe(key, {
      apiVersion: '2026-02-25.clover',
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return _stripe
}

/* ─── Plan Config (derived from SSoT) ────────────────── */

export const PLAN_CREDITS: Record<string, number> = Object.fromEntries(
  (Object.keys(PLANS) as PlanType[]).map((k) => [k, PLANS[k].monthlyCredits]),
)

export const PLAN_ORDER = Object.keys(PLANS) as PlanType[]

/* ─── Product Config ──────────────────────────────────── */

/** 当前唯一订阅产品 ID */
export const STRIPE_PRODUCT_ID = 'prod_U7CZXZOYuOngZb'

/** 获取产品的所有 active Price (weekly/monthly/yearly) */
export async function getPrices(productId: string): Promise<Stripe.Price[]> {
  const stripe = await getStripe()
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 20 })
  return prices.data
}

/** 获取 Webhook Secret */
export async function getWebhookSecret(): Promise<string> {
  const secret = await getEnv('STRIPE_WEBHOOK_SECRET')
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  return secret
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
