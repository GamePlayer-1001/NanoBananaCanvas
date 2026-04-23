/**
 * [INPUT]: 依赖 stripe SDK 类型，依赖 @/lib/db、@/lib/errors，依赖 ./plans、./stripe-client
 * [OUTPUT]: 对外提供 getBillingSubscription() / cancelBillingSubscription() 与订阅摘要类型
 * [POS]: lib/billing 的订阅镜像层，负责读取本地 subscriptions 摘要并执行自动月付取消
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type Stripe from 'stripe'

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode, NotFoundError } from '@/lib/errors'

import { FREE_PLAN_SNAPSHOT } from './plans'
import { getBillingSchemaInfo } from './schema'
import { withStripeErrorMapping } from './stripe-error'
import { getStripe } from './stripe-client'

type SubscriptionRow = {
  id: string | null
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  plan: string | null
  purchase_mode: 'auto_monthly' | 'one_time' | null
  billing_period: 'monthly' | 'one_time' | null
  status: string | null
  current_period_start: string | null
  current_period_end: string | null
  monthly_credits: number | null
  storage_gb: number | null
  cancel_at_period_end: number | null
  created_at: string | null
  updated_at: string | null
  user_plan: string
  membership_status: string
}

export interface BillingSubscriptionSummary {
  userId: string
  plan: string
  membershipStatus: string
  purchaseMode: 'free' | 'plan_auto_monthly' | 'plan_one_time'
  billingPeriod: 'monthly' | 'one_time'
  status: string
  monthlyCredits: number
  storageGB: number
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  portalEligible: boolean
  cancelEligible: boolean
}

function mapPurchaseMode(
  plan: string,
  purchaseMode: SubscriptionRow['purchase_mode'],
): BillingSubscriptionSummary['purchaseMode'] {
  if (plan === 'free') {
    return 'free'
  }

  return purchaseMode === 'one_time' ? 'plan_one_time' : 'plan_auto_monthly'
}

function toIsoOrNull(value: number | null | undefined): string | null {
  if (!value) {
    return null
  }

  return new Date(value * 1000).toISOString()
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

function canCancelSubscription(row: SubscriptionRow): boolean {
  if (!row.stripe_subscription_id) {
    return false
  }

  if (row.purchase_mode !== 'auto_monthly') {
    return false
  }

  if (row.plan === 'free') {
    return false
  }

  return row.status === 'active' || row.status === 'trialing' || row.status === 'past_due'
}

function toSubscriptionSummary(row: SubscriptionRow): BillingSubscriptionSummary {
  const plan = row.plan ?? row.user_plan ?? 'free'
  const monthlyCredits = row.monthly_credits ?? FREE_PLAN_SNAPSHOT.monthlyCredits
  const storageGB = row.storage_gb ?? FREE_PLAN_SNAPSHOT.storageGB

  return {
    userId: row.user_id,
    plan,
    membershipStatus: row.membership_status || plan,
    purchaseMode: mapPurchaseMode(plan, row.purchase_mode),
    billingPeriod: row.billing_period === 'one_time' ? 'one_time' : 'monthly',
    status: row.status ?? 'active',
    monthlyCredits,
    storageGB,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    portalEligible: Boolean(row.stripe_customer_id),
    cancelEligible: canCancelSubscription(row) && !Boolean(row.cancel_at_period_end),
  }
}

function hasUserColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.usersColumns.has(column)
}

function buildSubscriptionQuery(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
): string {
  const userPlanExpr = hasUserColumn(schema, 'plan') ? 'u.plan AS user_plan' : "'free' AS user_plan"
  const membershipExpr = hasUserColumn(schema, 'membership_status')
    ? 'u.membership_status AS membership_status'
    : hasUserColumn(schema, 'plan')
      ? 'u.plan AS membership_status'
      : "'free' AS membership_status"
  const subscriptionSelect = schema.hasSubscriptions
    ? `s.id,
         s.stripe_subscription_id,
         s.stripe_customer_id,
         s.plan,
         s.purchase_mode,
         s.billing_period,
         s.status,
         s.current_period_start,
         s.current_period_end,
         s.monthly_credits,
         s.storage_gb,
         s.cancel_at_period_end,
         s.created_at,
         s.updated_at`
    : `NULL AS id,
         NULL AS stripe_subscription_id,
         NULL AS stripe_customer_id,
         NULL AS plan,
         NULL AS purchase_mode,
         NULL AS billing_period,
         NULL AS status,
         NULL AS current_period_start,
         NULL AS current_period_end,
         NULL AS monthly_credits,
         NULL AS storage_gb,
         NULL AS cancel_at_period_end,
         NULL AS created_at,
         NULL AS updated_at`
  const subscriptionJoin = schema.hasSubscriptions
    ? 'LEFT JOIN subscriptions s ON s.user_id = u.id'
    : ''

  return `SELECT
         u.id AS user_id,
         ${userPlanExpr},
         ${membershipExpr},
         ${subscriptionSelect}
       FROM users u
       ${subscriptionJoin}
       WHERE u.id = ?`
}

async function getSubscriptionRow(userId: string): Promise<SubscriptionRow> {
  const schema = await getBillingSchemaInfo()
  const db = await getDb()
  const row = await db
    .prepare(buildSubscriptionQuery(schema))
    .bind(userId)
    .first<SubscriptionRow>()

  if (!row) {
    throw new NotFoundError('billing_user', userId)
  }

  return row
}

export async function getBillingSubscription(userId: string): Promise<BillingSubscriptionSummary> {
  const row = await getSubscriptionRow(userId)
  return toSubscriptionSummary(row)
}

export async function cancelBillingSubscription(userId: string): Promise<BillingSubscriptionSummary> {
  const row = await getSubscriptionRow(userId)

  if (!row.id || !row.stripe_subscription_id) {
    throw new BillingError(
      ErrorCode.BILLING_SUBSCRIPTION_NOT_FOUND,
      'No Stripe subscription found for the current user',
      { userId },
    )
  }

  if (!canCancelSubscription(row)) {
    throw new BillingError(
      ErrorCode.BILLING_SUBSCRIPTION_NOT_CANCELABLE,
      'Current subscription cannot be canceled from this endpoint',
      {
        userId,
        purchaseMode: row.purchase_mode,
        plan: row.plan,
        status: row.status,
      },
    )
  }

  if (row.cancel_at_period_end) {
    return toSubscriptionSummary(row)
  }

  const stripe = await getStripe()
  const stripeSubscriptionId = row.stripe_subscription_id
  const subscription = (await withStripeErrorMapping('canceling subscription', () =>
    stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    }),
  )) as Stripe.Subscription
  const nextPeriod = getSubscriptionItemPeriod(subscription)

  const db = await getDb()
  await db
    .prepare(
      `UPDATE subscriptions
       SET status = ?,
           current_period_start = ?,
           current_period_end = ?,
           cancel_at_period_end = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      subscription.status,
      nextPeriod.currentPeriodStart,
      nextPeriod.currentPeriodEnd,
      subscription.cancel_at_period_end ? 1 : 0,
      row.id,
    )
    .run()

  return getBillingSubscription(userId)
}
