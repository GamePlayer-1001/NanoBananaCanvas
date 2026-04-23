/**
 * [INPUT]: 依赖 @/lib/db、@/lib/errors，依赖 ./metering、./plans 的 Free 套餐快照
 * [OUTPUT]: 对外提供积分余额、交易流水与 usage 摘要读取器
 * [POS]: lib/billing 的积分读取层，被 credits API 与后续 /billing 页面消费，负责从账本真相源汇总可展示资产与消耗数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

import { FREE_PLAN_SNAPSHOT } from './plans'
import { getBillingSchemaInfo } from './schema'

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

type CreditTransactionRow = {
  id: string
  type: 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'refund'
  pool: 'monthly' | 'permanent'
  amount: number
  balance_after: number
  source: string
  reference_id: string | null
  description: string
  created_at: string
}

export interface CreditTransactionItem {
  id: string
  type: 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'refund'
  pool: 'monthly' | 'permanent'
  amount: number
  balanceAfter: number
  source: string
  referenceId: string | null
  description: string
  createdAt: string
}

export interface CreditTransactionsResult {
  items: CreditTransactionItem[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

type CreditUsageSummaryRow = {
  total_requests: number | null
  success_count: number | null
  failed_count: number | null
  total_input_tokens: number | null
  total_output_tokens: number | null
  estimated_credits_spent: number | null
}

type CreditUsageModelRow = {
  provider: string
  model_id: string
  request_count: number | null
  success_count: number | null
  failed_count: number | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_credits_spent: number | null
}

type CreditUsageDailyRow = {
  day: string
  request_count: number | null
  success_count: number | null
  failed_count: number | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_credits_spent: number | null
}

export interface CreditUsageSummary {
  totalRequests: number
  successCount: number
  failedCount: number
  totalInputTokens: number
  totalOutputTokens: number
  estimatedCreditsSpent: number
}

export interface CreditUsageByModelItem {
  provider: string
  modelId: string
  requestCount: number
  successCount: number
  failedCount: number
  inputTokens: number
  outputTokens: number
  estimatedCreditsSpent: number
}

export interface CreditUsageDailyItem {
  day: string
  requestCount: number
  successCount: number
  failedCount: number
  inputTokens: number
  outputTokens: number
  estimatedCreditsSpent: number
}

export interface CreditUsageResult {
  windowDays: number
  summary: CreditUsageSummary
  byModel: CreditUsageByModelItem[]
  daily: CreditUsageDailyItem[]
}

async function ensureCreditBalanceRow(userId: string) {
  const schema = await getBillingSchemaInfo()
  if (!schema.hasCreditBalances) {
    return
  }

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

function normalizePositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (!value || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(Math.max(Math.trunc(value), 1), max)
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

function hasUserColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.usersColumns.has(column)
}

function buildBalanceSummaryQuery(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
): string {
  const planExpr = hasUserColumn(schema, 'plan') ? 'u.plan AS plan' : "'free' AS plan"
  const membershipExpr = hasUserColumn(schema, 'membership_status')
    ? 'u.membership_status AS membership_status'
    : hasUserColumn(schema, 'plan')
      ? 'u.plan AS membership_status'
      : "'free' AS membership_status"
  const balanceSelect = schema.hasCreditBalances
    ? `cb.monthly_balance,
         cb.permanent_balance,
         cb.frozen_credits,
         cb.total_earned,
         cb.total_spent,
         cb.updated_at`
    : `0 AS monthly_balance,
         0 AS permanent_balance,
         0 AS frozen_credits,
         0 AS total_earned,
         0 AS total_spent,
         NULL AS updated_at`
  const subscriptionSelect = schema.hasSubscriptions
    ? `s.monthly_credits AS subscription_monthly_credits,
         s.storage_gb`
    : `NULL AS subscription_monthly_credits,
         NULL AS storage_gb`
  const balanceJoin = schema.hasCreditBalances
    ? 'LEFT JOIN credit_balances cb ON cb.user_id = u.id'
    : ''
  const subscriptionJoin = schema.hasSubscriptions
    ? 'LEFT JOIN subscriptions s ON s.user_id = u.id'
    : ''

  return `SELECT
         u.id AS user_id,
         ${planExpr},
         ${membershipExpr},
         ${balanceSelect},
         ${subscriptionSelect}
       FROM users u
       ${balanceJoin}
       ${subscriptionJoin}
       WHERE u.id = ?`
}

export async function getCreditBalanceSummary(userId: string): Promise<CreditBalanceSummary> {
  await ensureCreditBalanceRow(userId)

  const schema = await getBillingSchemaInfo()
  const db = await getDb()
  const row = await db
    .prepare(buildBalanceSummaryQuery(schema))
    .bind(userId)
    .first<CreditBalanceSummaryRow>()

  if (!row) {
    throw new NotFoundError('billing_user', userId)
  }

  return toCreditBalanceSummary(row)
}

function toCreditTransactionItem(row: CreditTransactionRow): CreditTransactionItem {
  return {
    id: row.id,
    type: row.type,
    pool: row.pool,
    amount: row.amount,
    balanceAfter: row.balance_after,
    source: row.source,
    referenceId: row.reference_id,
    description: row.description,
    createdAt: row.created_at,
  }
}

export async function getCreditTransactions(
  userId: string,
  options?: { page?: number; pageSize?: number },
): Promise<CreditTransactionsResult> {
  await ensureCreditBalanceRow(userId)

  const page = normalizePositiveInt(options?.page, 1, 500)
  const pageSize = normalizePositiveInt(options?.pageSize, 20, 100)
  const offset = (page - 1) * pageSize
  const schema = await getBillingSchemaInfo()

  if (!schema.hasCreditTransactions) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    }
  }

  const db = await getDb()

  const countRow = await db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM credit_transactions
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<{ total: number | null }>()

  const listResult = await db
    .prepare(
      `SELECT
         id,
         type,
         pool,
         amount,
         balance_after,
         source,
         reference_id,
         description,
         created_at
       FROM credit_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
    )
    .bind(userId, pageSize, offset)
    .all<CreditTransactionRow>()

  const total = countRow?.total ?? 0
  const items = (listResult.results ?? []).map(toCreditTransactionItem)

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  }
}

function toUsageSummary(row: CreditUsageSummaryRow | null | undefined): CreditUsageSummary {
  return {
    totalRequests: row?.total_requests ?? 0,
    successCount: row?.success_count ?? 0,
    failedCount: row?.failed_count ?? 0,
    totalInputTokens: row?.total_input_tokens ?? 0,
    totalOutputTokens: row?.total_output_tokens ?? 0,
    estimatedCreditsSpent: row?.estimated_credits_spent ?? 0,
  }
}

function toUsageByModelItem(row: CreditUsageModelRow): CreditUsageByModelItem {
  return {
    provider: row.provider,
    modelId: row.model_id,
    requestCount: row.request_count ?? 0,
    successCount: row.success_count ?? 0,
    failedCount: row.failed_count ?? 0,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    estimatedCreditsSpent: row.estimated_credits_spent ?? 0,
  }
}

function toUsageDailyItem(row: CreditUsageDailyRow): CreditUsageDailyItem {
  return {
    day: row.day,
    requestCount: row.request_count ?? 0,
    successCount: row.success_count ?? 0,
    failedCount: row.failed_count ?? 0,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    estimatedCreditsSpent: row.estimated_credits_spent ?? 0,
  }
}

export async function getCreditUsage(
  userId: string,
  options?: { windowDays?: number },
): Promise<CreditUsageResult> {
  const windowDays = normalizePositiveInt(options?.windowDays, 30, 365)
  const schema = await getBillingSchemaInfo()

  if (!schema.hasAiUsageLogs) {
    return {
      windowDays,
      summary: toUsageSummary(null),
      byModel: [],
      daily: [],
    }
  }

  const pricingJoin = schema.hasModelPricing
    ? `LEFT JOIN model_pricing mp
         ON mp.provider = u.provider
        AND mp.model_id = u.model_id`
    : ''
  const estimatedCreditsSql = schema.hasModelPricing
    ? `SUM(
           COALESCE(
             u.estimated_credits,
             CAST(ROUND(((COALESCE(u.input_tokens, 0) + COALESCE(u.output_tokens, 0)) / 1000.0) * COALESCE(mp.credits_per_1k_units, 0)) AS INTEGER)
           )
         )`
    : 'SUM(COALESCE(u.estimated_credits, 0))'
  const db = await getDb()

  const summaryRow = await db
    .prepare(
      `SELECT
         COUNT(*) AS total_requests,
         SUM(CASE WHEN u.status = 'success' THEN 1 ELSE 0 END) AS success_count,
         SUM(CASE WHEN u.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         SUM(COALESCE(u.input_tokens, 0)) AS total_input_tokens,
         SUM(COALESCE(u.output_tokens, 0)) AS total_output_tokens,
         ${estimatedCreditsSql} AS estimated_credits_spent
       FROM ai_usage_logs u
       ${pricingJoin}
       WHERE u.user_id = ?
         AND u.created_at >= datetime('now', ?)` ,
    )
    .bind(userId, `-${windowDays} days`)
    .first<CreditUsageSummaryRow>()

  const byModelResult = await db
    .prepare(
      `SELECT
         u.provider,
         u.model_id,
         COUNT(*) AS request_count,
         SUM(CASE WHEN u.status = 'success' THEN 1 ELSE 0 END) AS success_count,
         SUM(CASE WHEN u.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         SUM(COALESCE(u.input_tokens, 0)) AS input_tokens,
         SUM(COALESCE(u.output_tokens, 0)) AS output_tokens,
         ${estimatedCreditsSql} AS estimated_credits_spent
       FROM ai_usage_logs u
       ${pricingJoin}
       WHERE u.user_id = ?
         AND u.created_at >= datetime('now', ?)
       GROUP BY u.provider, u.model_id
       ORDER BY estimated_credits_spent DESC, request_count DESC, u.model_id ASC`,
    )
    .bind(userId, `-${windowDays} days`)
    .all<CreditUsageModelRow>()

  const dailyResult = await db
    .prepare(
      `SELECT
         date(u.created_at) AS day,
         COUNT(*) AS request_count,
         SUM(CASE WHEN u.status = 'success' THEN 1 ELSE 0 END) AS success_count,
         SUM(CASE WHEN u.status = 'failed' THEN 1 ELSE 0 END) AS failed_count,
         SUM(COALESCE(u.input_tokens, 0)) AS input_tokens,
         SUM(COALESCE(u.output_tokens, 0)) AS output_tokens,
         ${estimatedCreditsSql} AS estimated_credits_spent
       FROM ai_usage_logs u
       ${pricingJoin}
       WHERE u.user_id = ?
         AND u.created_at >= datetime('now', ?)
       GROUP BY date(u.created_at)
       ORDER BY day DESC`,
    )
    .bind(userId, `-${windowDays} days`)
    .all<CreditUsageDailyRow>()

  return {
    windowDays,
    summary: toUsageSummary(summaryRow),
    byModel: (byModelResult.results ?? []).map(toUsageByModelItem),
    daily: (dailyResult.results ?? []).map(toUsageDailyItem),
  }
}
