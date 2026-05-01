/**
 * [INPUT]: 依赖 @/lib/db、@/lib/nanoid，依赖 ./config、./plans
 * [OUTPUT]: 对外提供套餐/积分包权益同步器，负责 subscriptions 镜像、用户 membership、双池积分变更与 Free 降级
 * [POS]: lib/billing 的权益兑现层，被 webhook 等账单入口复用，是 Stripe 支付后本地权益落地的真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'

import type { BillingPlan, CreditPackId } from './config'
import {
  FREE_PLAN_SNAPSHOT,
  getBillingPlanSnapshot,
  getCreditPackSnapshot,
} from './plans'

export interface BillingSubscriptionEntitlementInput {
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  plan: BillingPlan | 'free'
  purchaseMode: 'auto_monthly' | 'one_time'
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

type CreditBalanceRow = {
  trial_balance: number
  monthly_balance: number
  permanent_balance: number
  total_earned: number
}

function toBillingPeriod(value: BillingSubscriptionEntitlementInput['purchaseMode']): 'monthly' | 'one_time' {
  return value === 'one_time' ? 'one_time' : 'monthly'
}

async function ensureCreditBalanceRow(userId: string) {
  const db = await getDb()
  await db
    .prepare(
      `INSERT OR IGNORE INTO credit_balances (
         user_id,
         trial_balance,
         trial_expires_at,
         monthly_balance,
         permanent_balance,
         frozen_credits,
         total_earned,
         total_spent
       ) VALUES (?, 0, NULL, 0, 0, 0, 0, 0)`,
    )
    .bind(userId)
    .run()
}

async function readCreditBalanceRow(userId: string): Promise<CreditBalanceRow> {
  const db = await getDb()
  await ensureCreditBalanceRow(userId)

  const row = await db
    .prepare(
      `SELECT trial_balance, monthly_balance, permanent_balance, total_earned
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<CreditBalanceRow>()

  return {
    trial_balance: row?.trial_balance ?? 0,
    monthly_balance: row?.monthly_balance ?? 0,
    permanent_balance: row?.permanent_balance ?? 0,
    total_earned: row?.total_earned ?? 0,
  }
}

async function writeCreditTransaction(input: {
  userId: string
  pool: 'monthly' | 'permanent'
  amount: number
  balanceAfter: number
  source: string
  referenceId: string
  description: string
}) {
  const db = await getDb()
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
       ) VALUES (?, ?, 'earn', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      nanoid(),
      input.userId,
      input.pool,
      input.amount,
      input.balanceAfter,
      input.source,
      input.referenceId,
      input.description,
    )
    .run()
}

export async function syncUserPlanEntitlement(input: BillingSubscriptionEntitlementInput) {
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
  } else {
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

  await db
    .prepare(
      `UPDATE users
       SET plan = ?, membership_status = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(input.plan, input.plan, input.userId)
    .run()
}

export async function resetPlanMonthlyCredits(input: {
  userId: string
  plan: BillingPlan | 'free'
  referenceId: string
  source: string
  description: string
}) {
  const db = await getDb()
  const balance = await readCreditBalanceRow(input.userId)
  const nextMonthlyBalance =
    input.plan === 'free'
      ? FREE_PLAN_SNAPSHOT.monthlyCredits
      : getBillingPlanSnapshot(input.plan).monthlyCredits
  const nextTotalEarned = balance.total_earned + nextMonthlyBalance

  await db
    .prepare(
      `UPDATE credit_balances
       SET monthly_balance = ?,
           total_earned = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`,
    )
    .bind(nextMonthlyBalance, nextTotalEarned, input.userId)
    .run()

  await writeCreditTransaction({
    userId: input.userId,
    pool: 'monthly',
    amount: nextMonthlyBalance,
    balanceAfter: nextMonthlyBalance + balance.permanent_balance,
    source: input.source,
    referenceId: input.referenceId,
    description: input.description,
  })
}

export async function awardOneTimePlanCredits(input: {
  userId: string
  plan: BillingPlan
  referenceId: string
}) {
  const snapshot = getBillingPlanSnapshot(input.plan)
  const balance = await readCreditBalanceRow(input.userId)
  const nextPermanentBalance = balance.permanent_balance + snapshot.monthlyCredits
  const nextTotalEarned = balance.total_earned + snapshot.monthlyCredits
  const db = await getDb()

  await db
    .prepare(
      `UPDATE credit_balances
       SET permanent_balance = ?,
           total_earned = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`,
    )
    .bind(nextPermanentBalance, nextTotalEarned, input.userId)
    .run()

  await writeCreditTransaction({
    userId: input.userId,
    pool: 'permanent',
    amount: snapshot.monthlyCredits,
    balanceAfter: balance.monthly_balance + nextPermanentBalance,
    source: 'stripe_plan_one_time',
    referenceId: input.referenceId,
    description: `Stripe one-time ${input.plan} plan credits`,
  })

  return snapshot.monthlyCredits
}

export async function awardCreditPackCredits(input: {
  userId: string
  packageId: CreditPackId
  referenceId: string
}) {
  const snapshot = getCreditPackSnapshot(input.packageId)
  const balance = await readCreditBalanceRow(input.userId)
  const nextPermanentBalance = balance.permanent_balance + snapshot.totalCredits
  const nextTotalEarned = balance.total_earned + snapshot.totalCredits
  const db = await getDb()

  await db
    .prepare(
      `UPDATE credit_balances
       SET permanent_balance = ?,
           total_earned = ?,
           updated_at = datetime('now')
       WHERE user_id = ?`,
    )
    .bind(nextPermanentBalance, nextTotalEarned, input.userId)
    .run()

  await writeCreditTransaction({
    userId: input.userId,
    pool: 'permanent',
    amount: snapshot.totalCredits,
    balanceAfter: balance.monthly_balance + nextPermanentBalance,
    source: 'stripe_credit_pack',
    referenceId: input.referenceId,
    description: `Stripe credit pack ${input.packageId}`,
  })

  return snapshot.totalCredits
}

export async function applyFreePlanDowngrade(input: {
  userId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  status: string
  referenceId: string
}) {
  await syncUserPlanEntitlement({
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    plan: 'free',
    purchaseMode: 'auto_monthly',
    status: input.status,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  })

  await resetPlanMonthlyCredits({
    userId: input.userId,
    plan: 'free',
    referenceId: input.referenceId,
    source: 'stripe_subscription_downgrade',
    description: 'Stripe subscription downgraded to free plan',
  })
}
