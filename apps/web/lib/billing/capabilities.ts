/**
 * [INPUT]: 依赖 @/lib/errors，依赖 ./schema 的 BillingSchemaInfo/getBillingSchemaInfo
 * [OUTPUT]: 对外提供 billing 能力快照、credit ledger / daily signin 可用性断言与缺口诊断
 * [POS]: lib/billing 的基础设施契约层，被 credits/ledger 等账本模块复用，负责把“生产库是否具备计费能力”从隐式前提提升为显式真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BillingError, ErrorCode } from '@/lib/errors'

import { getBillingSchemaInfo, type BillingSchemaInfo } from './schema'

type BillingCapabilityKey =
  | 'creditBalanceReadable'
  | 'creditBalanceWritable'
  | 'dailySigninReadable'
  | 'dailySigninWritable'

type BillingCapabilityReasonMap = Record<BillingCapabilityKey, string[]>

export interface BillingCapabilities {
  creditBalanceReadable: boolean
  creditBalanceWritable: boolean
  dailySigninReadable: boolean
  dailySigninWritable: boolean
  reasons: BillingCapabilityReasonMap
}

function missingTableReason(tableName: string) {
  return `missing table: ${tableName}`
}

function missingColumnsReason(tableName: string, columns: string[]) {
  return `missing columns in ${tableName}: ${columns.join(', ')}`
}

function collectMissingColumns(actual: Set<string>, required: string[]): string[] {
  return required.filter((column) => !actual.has(column))
}

function evaluateTableCapability(input: {
  tableName: string
  exists: boolean
  columns: Set<string>
  requiredColumns: string[]
}): string[] {
  if (!input.exists) {
    return [missingTableReason(input.tableName)]
  }

  const missingColumns = collectMissingColumns(input.columns, input.requiredColumns)
  if (missingColumns.length === 0) {
    return []
  }

  return [missingColumnsReason(input.tableName, missingColumns)]
}

export function getBillingCapabilitiesFromSchema(
  schema: BillingSchemaInfo,
): BillingCapabilities {
  const reasons: BillingCapabilityReasonMap = {
    creditBalanceReadable: evaluateTableCapability({
      tableName: 'credit_balances',
      exists: schema.hasCreditBalances,
      columns: schema.creditBalancesColumns,
      requiredColumns: [
        'user_id',
        'trial_balance',
        'trial_expires_at',
        'monthly_balance',
        'permanent_balance',
        'frozen_credits',
        'total_earned',
        'total_spent',
      ],
    }),
    creditBalanceWritable: evaluateTableCapability({
      tableName: 'credit_balances',
      exists: schema.hasCreditBalances,
      columns: schema.creditBalancesColumns,
      requiredColumns: [
        'user_id',
        'trial_balance',
        'trial_expires_at',
        'monthly_balance',
        'permanent_balance',
        'frozen_credits',
        'total_earned',
        'total_spent',
        'updated_at',
      ],
    }),
    dailySigninReadable: evaluateTableCapability({
      tableName: 'daily_signins',
      exists: schema.hasDailySignins,
      columns: schema.dailySigninsColumns,
      requiredColumns: ['user_id', 'signin_date'],
    }),
    dailySigninWritable: evaluateTableCapability({
      tableName: 'daily_signins',
      exists: schema.hasDailySignins,
      columns: schema.dailySigninsColumns,
      requiredColumns: ['id', 'user_id', 'signin_date', 'credits_awarded', 'expires_at'],
    }),
  }

  return {
    creditBalanceReadable: reasons.creditBalanceReadable.length === 0,
    creditBalanceWritable: reasons.creditBalanceWritable.length === 0,
    dailySigninReadable: reasons.dailySigninReadable.length === 0,
    dailySigninWritable: reasons.dailySigninWritable.length === 0,
    reasons,
  }
}

export async function getBillingCapabilities(): Promise<BillingCapabilities> {
  const schema = await getBillingSchemaInfo()
  return getBillingCapabilitiesFromSchema(schema)
}

function createBillingCapabilityError(
  code: Extract<ErrorCode, 'BILLING_CONFIG_INVALID'>,
  message: string,
  reasons: string[],
  meta: Record<string, unknown> = {},
) {
  return new BillingError(code, message, {
    ...meta,
    reasons,
  })
}

export function assertCreditBalanceWritable(
  capabilities: BillingCapabilities,
  meta: Record<string, unknown> = {},
) {
  if (capabilities.creditBalanceWritable) {
    return
  }

  throw createBillingCapabilityError(
    ErrorCode.BILLING_CONFIG_INVALID,
    'Credit ledger is unavailable because the billing schema is incomplete',
    capabilities.reasons.creditBalanceWritable,
    meta,
  )
}

export function assertDailySigninWritable(
  capabilities: BillingCapabilities,
  meta: Record<string, unknown> = {},
) {
  if (capabilities.dailySigninWritable) {
    return
  }

  throw createBillingCapabilityError(
    ErrorCode.BILLING_CONFIG_INVALID,
    'Daily sign-in is unavailable because the billing schema is incomplete',
    capabilities.reasons.dailySigninWritable,
    meta,
  )
}
