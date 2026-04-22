/**
 * [INPUT]: 依赖 stripe SDK，依赖 @/lib/db，依赖 @/lib/env，依赖 @/lib/errors，依赖 ./plans
 * [OUTPUT]: 对外提供 getStripe()、requireAppBaseUrl()、getOrCreateStripeCustomer() 与 BillingCustomerContext
 * [POS]: lib/billing 的 Stripe 客户端门面，统一承接 SDK 初始化、customer 绑定与本地 subscriptions 镜像占位
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { BillingError, ErrorCode, NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

import { FREE_PLAN_SNAPSHOT } from './plans'
import { withStripeErrorMapping } from './stripe-error'

let stripeClient: Stripe | null = null

export interface BillingCustomerContext {
  customerId: string
  subscriptionRowId: string
  email: string
  name: string
}

function normalizeOptional(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

export async function getStripe(): Promise<Stripe> {
  if (stripeClient) {
    return stripeClient
  }

  const secretKey = await getEnv('STRIPE_SECRET_KEY')
  if (!secretKey?.trim()) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Stripe secret key is not configured',
      { envKey: 'STRIPE_SECRET_KEY' },
    )
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  })

  return stripeClient
}

export async function requireAppBaseUrl(): Promise<string> {
  const appUrl = normalizeOptional(await getEnv('NEXT_PUBLIC_APP_URL'))

  if (!appUrl) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Application base URL is not configured',
      { envKey: 'NEXT_PUBLIC_APP_URL' },
    )
  }

  return appUrl.replace(/\/+$/, '')
}

export async function getOrCreateStripeCustomer(userId: string): Promise<BillingCustomerContext> {
  const db = await getDb()
  const user = await db
    .prepare(
      `SELECT id, email, name
       FROM users
       WHERE id = ?`,
    )
    .bind(userId)
    .first<{ id: string; email: string; name: string | null }>()

  if (!user) {
    throw new NotFoundError('billing_user', userId)
  }

  const existing = await db
    .prepare(
      `SELECT id, stripe_customer_id
       FROM subscriptions
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ id: string; stripe_customer_id: string | null }>()

  if (existing?.stripe_customer_id) {
    return {
      customerId: existing.stripe_customer_id,
      subscriptionRowId: existing.id,
      email: user.email,
      name: user.name ?? '',
    }
  }

  const stripe = await getStripe()
  const customer = await withStripeErrorMapping('creating stripe customer', () =>
    stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId },
    }),
  )

  const subscriptionRowId = existing?.id ?? nanoid()

  if (existing) {
    await db
      .prepare(
        `UPDATE subscriptions
         SET stripe_customer_id = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(customer.id, subscriptionRowId)
      .run()
  } else {
    await db
      .prepare(
        `INSERT INTO subscriptions (
           id,
           user_id,
           stripe_customer_id,
           plan,
           purchase_mode,
           billing_period,
           status,
           monthly_credits,
           storage_gb
         ) VALUES (?, ?, ?, 'free', 'auto_monthly', 'monthly', 'active', ?, ?)`,
      )
      .bind(
        subscriptionRowId,
        userId,
        customer.id,
        FREE_PLAN_SNAPSHOT.monthlyCredits,
        FREE_PLAN_SNAPSHOT.storageGB,
      )
      .run()
  }

  return {
    customerId: customer.id,
    subscriptionRowId,
    email: user.email,
    name: user.name ?? '',
  }
}
