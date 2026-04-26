/**
 * [INPUT]: 依赖 stripe SDK，依赖 @/lib/db，依赖 @/lib/env，依赖 @/lib/errors，依赖 ./plans、./schema
 * [OUTPUT]: 对外提供 createStripeClient()、getStripe()、requireAppBaseUrl()、getOrCreateStripeCustomer() 与 BillingCustomerContext
 * [POS]: lib/billing 的 Stripe 客户端门面，统一承接 Worker 友好的 SDK 初始化、customer 绑定与本地 subscriptions 镜像占位
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { getEnv } from '@/lib/env'
import { BillingError, ErrorCode, NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

import { FREE_PLAN_SNAPSHOT } from './plans'
import { getBillingSchemaInfo } from './schema'
import { withStripeErrorMapping } from './stripe-error'

let stripeClient: Stripe | null = null

export interface BillingCustomerContext {
  customerId: string
  subscriptionRowId: string
  email: string
  name: string
}

type SubscriptionColumn =
  | 'id'
  | 'user_id'
  | 'stripe_customer_id'
  | 'plan'
  | 'purchase_mode'
  | 'billing_period'
  | 'status'
  | 'monthly_credits'
  | 'storage_gb'
  | 'created_at'
  | 'updated_at'

function normalizeOptional(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function hasSubscriptionColumn(columns: Set<string>, column: SubscriptionColumn) {
  return columns.has(column)
}

function buildSubscriptionInsertStatement(input: {
  userId: string
  subscriptionRowId: string
  customerId: string
  columns: Set<string>
}) {
  const fieldNames: string[] = []
  const placeholders: string[] = []
  const values: unknown[] = []

  const pushValue = (field: SubscriptionColumn, value: unknown) => {
    if (!hasSubscriptionColumn(input.columns, field)) {
      return
    }

    fieldNames.push(field)
    placeholders.push('?')
    values.push(value)
  }

  pushValue('id', input.subscriptionRowId)
  pushValue('user_id', input.userId)
  pushValue('stripe_customer_id', input.customerId)
  pushValue('plan', 'free')
  pushValue('purchase_mode', 'auto_monthly')
  pushValue('billing_period', 'monthly')
  pushValue('status', 'active')
  pushValue('monthly_credits', FREE_PLAN_SNAPSHOT.monthlyCredits)
  pushValue('storage_gb', FREE_PLAN_SNAPSHOT.storageGB)

  if (!fieldNames.includes('id') || !fieldNames.includes('user_id')) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Billing subscriptions table is missing required identity columns',
      {
        requiredColumns: ['id', 'user_id'],
        availableColumns: [...input.columns],
      },
    )
  }

  return {
    sql: `INSERT INTO subscriptions (${fieldNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values,
  }
}

function buildSubscriptionCustomerUpdateStatement(input: {
  subscriptionRowId: string
  customerId: string
  columns: Set<string>
}) {
  const sets: string[] = []
  const values: unknown[] = []

  if (hasSubscriptionColumn(input.columns, 'stripe_customer_id')) {
    sets.push('stripe_customer_id = ?')
    values.push(input.customerId)
  }

  if (hasSubscriptionColumn(input.columns, 'updated_at')) {
    sets.push("updated_at = datetime('now')")
  }

  if (sets.length === 0) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Billing subscriptions table is missing writable customer columns',
      {
        requiredColumns: ['stripe_customer_id', 'updated_at'],
        availableColumns: [...input.columns],
      },
    )
  }

  values.push(input.subscriptionRowId)

  return {
    sql: `UPDATE subscriptions SET ${sets.join(', ')} WHERE id = ?`,
    values,
  }
}

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    httpClient: Stripe.createFetchHttpClient(),
  })
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

  stripeClient = createStripeClient(secretKey)

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

  const schema = await getBillingSchemaInfo()
  if (!schema.hasSubscriptions) {
    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Billing subscriptions table is not available',
      { userId, table: 'subscriptions' },
    )
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
    const statement = buildSubscriptionCustomerUpdateStatement({
      subscriptionRowId,
      customerId: customer.id,
      columns: schema.subscriptionsColumns,
    })

    await db
      .prepare(statement.sql)
      .bind(...statement.values)
      .run()
  } else {
    const statement = buildSubscriptionInsertStatement({
      userId,
      subscriptionRowId,
      customerId: customer.id,
      columns: schema.subscriptionsColumns,
    })

    await db
      .prepare(statement.sql)
      .bind(...statement.values)
      .run()
  }

  return {
    customerId: customer.id,
    subscriptionRowId,
    email: user.email,
    name: user.name ?? '',
  }
}
