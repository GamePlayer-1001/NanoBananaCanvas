/**
 * [INPUT]: 依赖 @/lib/db，依赖 sqlite_master / PRAGMA table_info 元数据查询
 * [OUTPUT]: 对外提供 getBillingSchemaInfo()/resetBillingSchemaCache()，返回 billing 相关表存在性与列信息，并支持显式注入 D1 运行时
 * [POS]: lib/billing 的 schema 兼容探测层，被 credits/subscription/worker task 账本链路复用，用来吸收生产库历史漂移
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'

type TableInfoRow = {
  name?: string
}

type BillingTableName =
  | 'users'
  | 'subscriptions'
  | 'credit_balances'
  | 'credit_transactions'
  | 'daily_signins'
  | 'ai_usage_logs'
  | 'model_pricing'

export interface BillingSchemaInfo {
  usersColumns: Set<string>
  subscriptionsColumns: Set<string>
  creditBalancesColumns: Set<string>
  creditTransactionsColumns: Set<string>
  dailySigninsColumns: Set<string>
  aiUsageLogsColumns: Set<string>
  modelPricingColumns: Set<string>
  hasSubscriptions: boolean
  hasCreditBalances: boolean
  hasCreditTransactions: boolean
  hasDailySignins: boolean
  hasAiUsageLogs: boolean
  hasModelPricing: boolean
}

let billingSchemaPromise: Promise<BillingSchemaInfo> | null = null

interface BillingSchemaQueryOptions {
  db?: D1Database
}

async function resolveBillingSchemaDb(options?: BillingSchemaQueryOptions): Promise<D1Database> {
  return options?.db ?? getDb()
}

async function readTableExists(
  tableName: BillingTableName,
  options?: BillingSchemaQueryOptions,
): Promise<boolean> {
  const db = await resolveBillingSchemaDb(options)
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(tableName)
    .first<TableInfoRow>()

  return Boolean(row?.name)
}

async function readTableColumns(
  tableName: BillingTableName,
  options?: BillingSchemaQueryOptions,
): Promise<Set<string>> {
  if (!(await readTableExists(tableName, options))) {
    return new Set()
  }

  const db = await resolveBillingSchemaDb(options)
  const rows = await db.prepare(`PRAGMA table_info('${tableName}')`).all<TableInfoRow>()

  return new Set((rows.results ?? []).map((row) => row.name).filter(Boolean) as string[])
}

async function loadBillingSchemaInfo(
  options?: BillingSchemaQueryOptions,
): Promise<BillingSchemaInfo> {
  const schemaOptions = options?.db ? { db: options.db } : undefined
  const [
    usersColumns,
    subscriptionsColumns,
    creditBalancesColumns,
    creditTransactionsColumns,
    dailySigninsColumns,
    aiUsageLogsColumns,
    modelPricingColumns,
    hasSubscriptions,
    hasCreditBalances,
    hasCreditTransactions,
    hasDailySignins,
    hasAiUsageLogs,
    hasModelPricing,
  ] = await Promise.all([
    readTableColumns('users', schemaOptions),
    readTableColumns('subscriptions', schemaOptions),
    readTableColumns('credit_balances', schemaOptions),
    readTableColumns('credit_transactions', schemaOptions),
    readTableColumns('daily_signins', schemaOptions),
    readTableColumns('ai_usage_logs', schemaOptions),
    readTableColumns('model_pricing', schemaOptions),
    readTableExists('subscriptions', schemaOptions),
    readTableExists('credit_balances', schemaOptions),
    readTableExists('credit_transactions', schemaOptions),
    readTableExists('daily_signins', schemaOptions),
    readTableExists('ai_usage_logs', schemaOptions),
    readTableExists('model_pricing', schemaOptions),
  ])

  return {
    usersColumns,
    subscriptionsColumns,
    creditBalancesColumns,
    creditTransactionsColumns,
    dailySigninsColumns,
    aiUsageLogsColumns,
    modelPricingColumns,
    hasSubscriptions,
    hasCreditBalances,
    hasCreditTransactions,
    hasDailySignins,
    hasAiUsageLogs,
    hasModelPricing,
  }
}

export async function getBillingSchemaInfo(
  options?: BillingSchemaQueryOptions,
): Promise<BillingSchemaInfo> {
  if (options?.db) {
    return loadBillingSchemaInfo(options)
  }

  if (!billingSchemaPromise) {
    billingSchemaPromise = loadBillingSchemaInfo().catch((error) => {
      billingSchemaPromise = null
      throw error
    })
  }

  return billingSchemaPromise
}

export function resetBillingSchemaCache() {
  billingSchemaPromise = null
}
