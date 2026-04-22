/**
 * [INPUT]: 依赖 @/lib/db、@/lib/errors，依赖 ./plans 的 Free 套餐快照
 * [OUTPUT]: 对外提供 getCreditBalanceSummary()，返回当前用户的双池积分余额摘要
 * [POS]: lib/billing 的积分读取层，被 credits API 与后续 /billing 页面消费，负责从账本真相源汇总可展示余额
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

import { FREE_PLAN_SNAPSHOT } from './plans'

type CreditBalanceSummaryRow = {
  user_id: string
  plan: string
  membership_status: string
  monthly_balance: number | null
  permanent_balance: number | null
  frozen_credits: number | null
  total_earned: number | null
  total_spent: number | null
  updated_at: string | null
  subscription_monthly_credits: number | null
  storage_gb: number | null
}

export interface CreditBalanceSummary {
  userId: string
  plan: string
  membershipStatus: string
  monthlyBalance: number
  permanentBalance: number
  frozenCredits: number
  availableCredits: number
  totalCredits: number
  totalEarned: number
  totalSpent: number
  currentPlanMonthlyCredits: number
  storageGB: number
  updatedAt: string | null
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

function toCreditBalanceSummary(row: CreditBalanceSummaryRow): CreditBalanceSummary {
  const monthlyBalance = row.monthly_balance ?? 0
  const permanentBalance = row.permanent_balance ?? 0
  const frozenCredits = row.frozen_credits ?? 0

  return {
    userId: row.user_id,
    plan: row.plan,
    membershipStatus: row.membership_status,
    monthlyBalance,
    permanentBalance,
    frozenCredits,
    availableCredits: monthlyBalance + permanentBalance,
    totalCredits: monthlyBalance + permanentBalance + frozenCredits,
    totalEarned: row.total_earned ?? 0,
    totalSpent: row.total_spent ?? 0,
    currentPlanMonthlyCredits: row.subscription_monthly_credits ?? FREE_PLAN_SNAPSHOT.monthlyCredits,
    storageGB: row.storage_gb ?? FREE_PLAN_SNAPSHOT.storageGB,
    updatedAt: row.updated_at,
  }
}

export async function getCreditBalanceSummary(userId: string): Promise<CreditBalanceSummary> {
  await ensureCreditBalanceRow(userId)

  const db = await getDb()
  const row = await db
    .prepare(
      `SELECT
         u.id AS user_id,
         u.plan,
         u.membership_status,
         cb.monthly_balance,
         cb.permanent_balance,
         cb.frozen_credits,
         cb.total_earned,
         cb.total_spent,
         cb.updated_at,
         s.monthly_credits AS subscription_monthly_credits,
         s.storage_gb
       FROM users u
       LEFT JOIN credit_balances cb ON cb.user_id = u.id
       LEFT JOIN subscriptions s ON s.user_id = u.id
       WHERE u.id = ?`,
    )
    .bind(userId)
    .first<CreditBalanceSummaryRow>()

  if (!row) {
    throw new NotFoundError('billing_user', userId)
  }

  return toCreditBalanceSummary(row)
}
