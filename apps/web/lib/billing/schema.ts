/**
 * [INPUT]: 依赖 @/lib/db，依赖 sqlite_master / PRAGMA table_info 元数据查询
 * [OUTPUT]: 对外提供 getBillingSchemaInfo()/resetBillingSchemaCache()，返回 billing 相关表存在性与列信息
 * [POS]: lib/billing 的 schema 兼容探测层，被 credits/subscription 等读取器复用，用来吸收生产库历史漂移
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
  | 'ai_usage_logs'
  | 'model_pricing'

export interface BillingSchemaInfo {
  usersColumns: Set<string>
  subscriptionsColumns: Set<string>
  creditBalancesColumns: Set<string>
  creditTransactionsColumns: Set<string>
  aiUsageLogsColumns: Set<string>
  modelPricingColumns: Set<string>
  hasSubscriptions: boolean
  hasCreditBalances: boolean
  hasCreditTransactions: boolean
  hasAiUsageLogs: boolean
  hasModelPricing: boolean
}

let billingSchemaPromise: Promise<BillingSchemaInfo> | null = null

async function readTableExists(tableName: BillingTableName): Promise<boolean> {
  const db = await getDb()
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(tableName)
    .first<TableInfoRow>()

  return Boolean(row?.name)
}

async function readTableColumns(tableName: BillingTableName): Promise<Set<string>> {
  if (!(await readTableExists(tableName))) {
    return new Set()
  }

  const db = await getDb()
  const rows = await db.prepare(`PRAGMA table_info('${tableName}')`).all<TableInfoRow>()

  return new Set((rows.results ?? []).map((row) => row.name).filter(Boolean) as string[])
}

export async function getBillingSchemaInfo(): Promise<BillingSchemaInfo> {
  if (!billingSchemaPromise) {
    billingSchemaPromise = (async () => {
      const [
        usersColumns,
        subscriptionsColumns,
        creditBalancesColumns,
        creditTransactionsColumns,
        aiUsageLogsColumns,
        modelPricingColumns,
        hasSubscriptions,
        hasCreditBalances,
        hasCreditTransactions,
        hasAiUsageLogs,
        hasModelPricing,
      ] = await Promise.all([
        readTableColumns('users'),
        readTableColumns('subscriptions'),
        readTableColumns('credit_balances'),
        readTableColumns('credit_transactions'),
        readTableColumns('ai_usage_logs'),
        readTableColumns('model_pricing'),
        readTableExists('subscriptions'),
        readTableExists('credit_balances'),
        readTableExists('credit_transactions'),
        readTableExists('ai_usage_logs'),
        readTableExists('model_pricing'),
      ])

      return {
        usersColumns,
        subscriptionsColumns,
        creditBalancesColumns,
        creditTransactionsColumns,
        aiUsageLogsColumns,
        modelPricingColumns,
        hasSubscriptions,
        hasCreditBalances,
        hasCreditTransactions,
        hasAiUsageLogs,
        hasModelPricing,
      }
    })().catch((error) => {
      billingSchemaPromise = null
      throw error
    })
  }

  return billingSchemaPromise
}

export function resetBillingSchemaCache() {
  billingSchemaPromise = null
}
