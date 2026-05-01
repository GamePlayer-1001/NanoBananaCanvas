/**
 * [INPUT]: 依赖 @/lib/db、@/lib/errors，依赖 ./plans 的 Free 套餐快照，依赖 ./schema 的 billing 表/列探测
 * [OUTPUT]: 对外提供积分余额、交易流水与 usage 摘要读取器
 * [POS]: lib/billing 的积分读取层，被 credits API 与后续 /billing 页面消费，负责从账本真相源汇总可展示资产与消耗数据
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { FREE_PLAN_SNAPSHOT } from './plans'
import { getBillingSchemaInfo } from './schema'

type CreditBalanceSummaryRow = {
  user_id: string
  plan: string
  membership_status: string
  trial_balance: number | null
  trial_expires_at: string | null
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
  trialBalance: number
  trialExpiresAt: string | null
  monthlyBalance: number
  permanentBalance: number
  frozenCredits: number
  availableCredits: number
  totalCredits: number
  totalEarned: number
  totalSpent: number
  checkedInToday: boolean
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
  pool: 'trial' | 'monthly' | 'permanent'
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

function hasUserColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.usersColumns.has(column)
}

function hasCreditBalanceColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.creditBalancesColumns.has(column)
}

function hasSubscriptionColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.subscriptionsColumns.has(column)
}

function hasCreditTransactionColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.creditTransactionsColumns.has(column)
}

function hasAiUsageLogColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.aiUsageLogsColumns.has(column)
}

function hasModelPricingColumn(
  schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>,
  column: string,
): boolean {
  return schema.modelPricingColumns.has(column)
}

function canReadCreditBalances(schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>): boolean {
  return (
    schema.hasCreditBalances &&
    hasCreditBalanceColumn(schema, 'user_id') &&
    hasCreditBalanceColumn(schema, 'trial_balance') &&
    hasCreditBalanceColumn(schema, 'monthly_balance') &&
    hasCreditBalanceColumn(schema, 'permanent_balance') &&
    hasCreditBalanceColumn(schema, 'frozen_credits')
  )
}

function canReadSubscriptions(schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>): boolean {
  return schema.hasSubscriptions && hasSubscriptionColumn(schema, 'user_id')
}

function canReadCreditTransactions(schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>): boolean {
  return (
    schema.hasCreditTransactions &&
    [
      'user_id',
      'id',
      'type',
      'pool',
      'amount',
      'balance_after',
      'source',
      'reference_id',
      'description',
      'created_at',
    ].every((column) => hasCreditTransactionColumn(schema, column))
  )
}

function canReadCreditUsage(schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>): boolean {
  return (
    schema.hasAiUsageLogs &&
    ['user_id', 'provider', 'model_id', 'created_at'].every((column) =>
      hasAiUsageLogColumn(schema, column),
    )
  )
}

function normalizePositiveInt(value: number | undefined, fallback: number, max: number): number {
  if (!value || Number.isNaN(value)) {
    return fallback
  }

  return Math.min(Math.max(Math.trunc(value), 1), max)
}

function toCreditBalanceSummary(row: CreditBalanceSummaryRow): CreditBalanceSummary {
  const trialBalance = row.trial_balance ?? 0
  const monthlyBalance = row.monthly_balance ?? 0
  const permanentBalance = row.permanent_balance ?? 0
  const frozenCredits = row.frozen_credits ?? 0

  return {
    userId: row.user_id,
    plan: row.plan,
    membershipStatus: row.membership_status,
    trialBalance,
    trialExpiresAt: row.trial_expires_at,
    monthlyBalance,
    permanentBalance,
    frozenCredits,
    availableCredits: trialBalance + monthlyBalance + permanentBalance,
    totalCredits: trialBalance + monthlyBalance + permanentBalance + frozenCredits,
    totalEarned: row.total_earned ?? 0,
    totalSpent: row.total_spent ?? 0,
    checkedInToday: trialBalance > 0 && Boolean(row.trial_expires_at),
    currentPlanMonthlyCredits: row.subscription_monthly_credits ?? FREE_PLAN_SNAPSHOT.monthlyCredits,
    storageGB: row.storage_gb ?? FREE_PLAN_SNAPSHOT.storageGB,
    updatedAt: row.updated_at,
  }
}

function canReadUsers(schema: Awaited<ReturnType<typeof getBillingSchemaInfo>>): boolean {
  return schema.usersColumns.has('id')
}

function createFreeCreditBalanceSummary(userId: string): CreditBalanceSummary {
  return {
    userId,
    plan: FREE_PLAN_SNAPSHOT.plan,
    membershipStatus: FREE_PLAN_SNAPSHOT.plan,
    trialBalance: 0,
    trialExpiresAt: null,
    monthlyBalance: 0,
    permanentBalance: 0,
    frozenCredits: 0,
    availableCredits: 0,
    totalCredits: 0,
    totalEarned: 0,
    totalSpent: 0,
    checkedInToday: false,
    currentPlanMonthlyCredits: FREE_PLAN_SNAPSHOT.monthlyCredits,
    storageGB: FREE_PLAN_SNAPSHOT.storageGB,
    updatedAt: null,
  }
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
  const readableBalances = canReadCreditBalances(schema)
  const readableSubscriptions = canReadSubscriptions(schema)
  const balanceSelect = readableBalances
    ? `cb.trial_balance,
         ${hasCreditBalanceColumn(schema, 'trial_expires_at') ? 'cb.trial_expires_at' : 'NULL AS trial_expires_at'},
         cb.monthly_balance,
         cb.permanent_balance,
         cb.frozen_credits,
         ${
           hasCreditBalanceColumn(schema, 'total_earned')
             ? 'cb.total_earned'
             : '0 AS total_earned'
         },
         ${hasCreditBalanceColumn(schema, 'total_spent') ? 'cb.total_spent' : '0 AS total_spent'},
         ${hasCreditBalanceColumn(schema, 'updated_at') ? 'cb.updated_at' : 'NULL AS updated_at'}`
    : `0 AS trial_balance,
         NULL AS trial_expires_at,
         0 AS monthly_balance,
         0 AS permanent_balance,
         0 AS frozen_credits,
         0 AS total_earned,
         0 AS total_spent,
         NULL AS updated_at`
  const subscriptionSelect = readableSubscriptions
    ? `${
        hasSubscriptionColumn(schema, 'monthly_credits')
          ? 's.monthly_credits'
          : 'NULL'
      } AS subscription_monthly_credits,
         ${hasSubscriptionColumn(schema, 'storage_gb') ? 's.storage_gb' : 'NULL AS storage_gb'}`
    : `NULL AS subscription_monthly_credits,
         NULL AS storage_gb`
  const balanceJoin = readableBalances
    ? 'LEFT JOIN credit_balances cb ON cb.user_id = u.id'
    : ''
  const subscriptionJoin = readableSubscriptions
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
  const schema = await getBillingSchemaInfo()
  if (!canReadUsers(schema)) {
    return createFreeCreditBalanceSummary(userId)
  }

  const db = await getDb()
  const row = await db
    .prepare(buildBalanceSummaryQuery(schema))
    .bind(userId)
    .first<CreditBalanceSummaryRow>()

  if (!row) {
    return createFreeCreditBalanceSummary(userId)
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
  options?: { page?: number; pageSize?: number; fetchAll?: boolean },
): Promise<CreditTransactionsResult> {
  const page = normalizePositiveInt(options?.page, 1, 500)
  const fetchAll = Boolean(options?.fetchAll)
  const pageSize = fetchAll ? 0 : normalizePositiveInt(options?.pageSize, 20, 100)
  const offset = fetchAll ? 0 : (page - 1) * pageSize
  const schema = await getBillingSchemaInfo()

  if (!canReadCreditTransactions(schema)) {
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

  const total = countRow?.total ?? 0
  const resolvedPageSize = fetchAll ? total : pageSize

  const listQuery = fetchAll
    ? db
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
           ORDER BY created_at DESC`,
        )
        .bind(userId)
    : db
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
        .bind(userId, resolvedPageSize, offset)

  const listResult = await listQuery.all<CreditTransactionRow>()
  const items = (listResult.results ?? []).map(toCreditTransactionItem)

  return {
    items,
    total,
    page,
    pageSize: resolvedPageSize,
    hasMore: fetchAll ? false : offset + items.length < total,
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

  if (!canReadCreditUsage(schema)) {
    return {
      windowDays,
      summary: toUsageSummary(null),
      byModel: [],
      daily: [],
    }
  }

  const hasStatus = hasAiUsageLogColumn(schema, 'status')
  const hasInputTokens = hasAiUsageLogColumn(schema, 'input_tokens')
  const hasOutputTokens = hasAiUsageLogColumn(schema, 'output_tokens')
  const hasEstimatedCredits = hasAiUsageLogColumn(schema, 'estimated_credits')
  const canJoinModelPricing =
    schema.hasModelPricing &&
    ['provider', 'model_id', 'credits_per_1k_units'].every((column) =>
      hasModelPricingColumn(schema, column),
    )

  const pricingJoin = canJoinModelPricing
    ? `LEFT JOIN model_pricing mp
         ON mp.provider = u.provider
        AND mp.model_id = u.model_id`
    : ''
  const successCountSql = hasStatus
    ? `SUM(CASE WHEN u.status = 'success' THEN 1 ELSE 0 END)`
    : '0'
  const failedCountSql = hasStatus
    ? `SUM(CASE WHEN u.status = 'failed' THEN 1 ELSE 0 END)`
    : '0'
  const totalInputTokensSql = hasInputTokens ? 'SUM(COALESCE(u.input_tokens, 0))' : '0'
  const totalOutputTokensSql = hasOutputTokens ? 'SUM(COALESCE(u.output_tokens, 0))' : '0'
  const tokenMeteringUnitsSql =
    hasInputTokens || hasOutputTokens
      ? `((COALESCE(${hasInputTokens ? 'u.input_tokens' : '0'}, 0) + COALESCE(${hasOutputTokens ? 'u.output_tokens' : '0'}, 0)) / 1000.0)`
      : '0'

  let estimatedCreditsSql = '0'
  if (canJoinModelPricing) {
    estimatedCreditsSql = hasEstimatedCredits
      ? `SUM(
           COALESCE(
             u.estimated_credits,
             CAST(ROUND(${tokenMeteringUnitsSql} * COALESCE(mp.credits_per_1k_units, 0)) AS INTEGER),
             0
           )
         )`
      : `SUM(CAST(ROUND(${tokenMeteringUnitsSql} * COALESCE(mp.credits_per_1k_units, 0)) AS INTEGER))`
  } else if (hasEstimatedCredits) {
    estimatedCreditsSql = 'SUM(COALESCE(u.estimated_credits, 0))'
  }

  const db = await getDb()

  const summaryRow = await db
    .prepare(
      `SELECT
         COUNT(*) AS total_requests,
         ${successCountSql} AS success_count,
         ${failedCountSql} AS failed_count,
         ${totalInputTokensSql} AS total_input_tokens,
         ${totalOutputTokensSql} AS total_output_tokens,
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
         ${successCountSql} AS success_count,
         ${failedCountSql} AS failed_count,
         ${totalInputTokensSql} AS input_tokens,
         ${totalOutputTokensSql} AS output_tokens,
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
         ${successCountSql} AS success_count,
         ${failedCountSql} AS failed_count,
         ${totalInputTokensSql} AS input_tokens,
         ${totalOutputTokensSql} AS output_tokens,
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
