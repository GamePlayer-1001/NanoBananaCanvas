/**
 * [INPUT]: 依赖 @/lib/db, @/lib/errors, @/lib/nanoid, @/lib/logger, billing schema/capabilities
 * [OUTPUT]: 对外提供 ledger 内部类型、常量与纯辅助函数
 * [POS]: lib/billing 的积分账本辅助层，从 ledger.ts 拆出
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'
import {
  assertCreditBalanceWritable,
  getBillingCapabilities,
  type BillingCapabilities,
} from './capabilities'
import { getBillingSchemaInfo } from './schema'
import { DEFAULT_SIGNIN_TIMEZONE, normalizeTimeZone } from '@/lib/timezones'

export const log = createLogger('billing:ledger')

/* ─── Types ──────────────────────────────────────────── */

export type CreditBalanceRow = {
  trial_balance: number | null
  trial_expires_at: string | null
  monthly_balance: number | null
  permanent_balance: number | null
  frozen_credits: number | null
  total_earned: number | null
  total_spent: number | null
}

export type CreditBalanceSnapshot = {
  trial_balance: number
  trial_expires_at: string | null
  monthly_balance: number
  permanent_balance: number
  frozen_credits: number
  total_earned: number
  total_spent: number
}

export type ReferenceCreditSummaryRow = {
  pool: 'trial' | 'monthly' | 'permanent'
  frozen_amount: number | null
  settled_amount: number | null
}

export interface CreditPoolBreakdown {
  trial: number
  monthly: number
  permanent: number
  total: number
}

export interface CreditLedgerSummary {
  referenceId: string
  frozen: CreditPoolBreakdown
  settled: CreditPoolBreakdown
  remaining: CreditPoolBreakdown
}

export interface CreditFreezeResult {
  referenceId: string
  frozen: CreditPoolBreakdown
  availableCreditsAfter: number
  frozenCreditsAfter: number
}

export interface CreditFinalizeResult {
  referenceId: string
  finalized: CreditPoolBreakdown
  availableCreditsAfter: number
  frozenCreditsAfter: number
  totalSpentAfter: number
}

export type LedgerOperationType = 'spend' | 'refund'

export interface LedgerRuntimeOptions {
  db?: D1Database
  capabilities?: BillingCapabilities
  reportedTimezone?: string | null
}

export interface CreditTransactionStatement {
  type: 'freeze' | 'spend' | 'refund'
  pool: 'trial' | 'monthly' | 'permanent'
  amount: number
  balanceAfter: number
  source: string
  referenceId: string
  description: string
}

/* ─── Constants ──────────────────────────────────────── */

export const EMPTY_CREDIT_BALANCE_SNAPSHOT: CreditBalanceSnapshot = {
  trial_balance: 0,
  trial_expires_at: null,
  monthly_balance: 0,
  permanent_balance: 0,
  frozen_credits: 0,
  total_earned: 0,
  total_spent: 0,
}

/* ─── Runtime Resolution ─────────────────────────────── */

export async function resolveLedgerDb(options?: LedgerRuntimeOptions): Promise<D1Database> {
  return options?.db ?? getDb()
}

export async function resolveLedgerCapabilities(
  db: D1Database,
  options?: LedgerRuntimeOptions,
): Promise<BillingCapabilities> {
  return options?.capabilities ?? getBillingCapabilities({ db })
}

/* ─── Credit Helpers ─────────────────────────────────── */

export function clampCredits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.round(value)
}

export function createBreakdown(
  trial: number,
  monthly: number,
  permanent: number,
): CreditPoolBreakdown {
  return {
    trial,
    monthly,
    permanent,
    total: trial + monthly + permanent,
  }
}

/* ─── Timezone Helpers ───────────────────────────────── */

type TimeZoneDateParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function getTimeZoneDateParts(date: Date, timeZone: string): TimeZoneDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function toComparableUtc(parts: TimeZoneDateParts) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
}

function resolveUtcFromTimeZoneParts(parts: TimeZoneDateParts, timeZone: string) {
  let utcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )

  for (let index = 0; index < 3; index += 1) {
    const actual = getTimeZoneDateParts(new Date(utcMillis), timeZone)
    const delta = toComparableUtc(parts) - toComparableUtc(actual)
    if (delta === 0) {
      break
    }
    utcMillis += delta
  }

  return utcMillis
}

function getNextDayParts(parts: Pick<TimeZoneDateParts, 'year' | 'month' | 'day'>) {
  const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1))

  return {
    year: nextDay.getUTCFullYear(),
    month: nextDay.getUTCMonth() + 1,
    day: nextDay.getUTCDate(),
  }
}

export function getTodayBounds(timeZone: string) {
  const now = new Date()
  const todayParts = getTimeZoneDateParts(now, timeZone)
  const nextDayParts = getNextDayParts(todayParts)
  const expiresAt = new Date(
    resolveUtcFromTimeZoneParts(
      {
        ...nextDayParts,
        hour: 0,
        minute: 0,
        second: 0,
      },
      timeZone,
    ),
  ).toISOString()

  return {
    today: `${todayParts.year.toString().padStart(4, '0')}-${todayParts.month
      .toString()
      .padStart(2, '0')}-${todayParts.day.toString().padStart(2, '0')}`,
    expiresAt,
  }
}

export function isTrialExpired(expiresAt: string | null | undefined): boolean {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now()
}

/* ─── DB Operations ──────────────────────────────────── */

export async function ensureCreditBalanceRow(db: D1Database, userId: string) {
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

export async function clearExpiredTrialBalance(
  db: D1Database,
  userId: string,
  balance: CreditBalanceSnapshot,
  options: {
    persistReset: boolean
  },
): Promise<CreditBalanceSnapshot> {
  if (balance.trial_balance <= 0 && !balance.trial_expires_at) {
    return balance
  }

  if (!isTrialExpired(balance.trial_expires_at)) {
    return balance
  }

  if (options.persistReset) {
    await db
      .prepare(
        `UPDATE credit_balances
         SET trial_balance = 0,
             trial_expires_at = NULL,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(userId)
      .run()
  }

  return {
    ...balance,
    trial_balance: 0,
    trial_expires_at: null,
  }
}

export async function resolveSigninTimeZone(
  db: D1Database,
  userId: string,
  reportedTimezone?: string | null,
) {
  const schema = await getBillingSchemaInfo({ db })
  const canPersistUserTimezone = schema.usersColumns.has('timezone')
  const normalizedReportedTimezone = normalizeTimeZone(reportedTimezone)

  if (!canPersistUserTimezone) {
    return normalizedReportedTimezone ?? DEFAULT_SIGNIN_TIMEZONE
  }

  const row = await db
    .prepare('SELECT timezone FROM users WHERE id = ?')
    .bind(userId)
    .first<{ timezone?: string | null }>()
  const storedTimezone = normalizeTimeZone(row?.timezone)

  if (storedTimezone) {
    return storedTimezone
  }

  if (normalizedReportedTimezone) {
    await db
      .prepare(
        `UPDATE users
         SET timezone = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .bind(normalizedReportedTimezone, userId)
      .run()

    return normalizedReportedTimezone
  }

  return DEFAULT_SIGNIN_TIMEZONE
}

export async function readCreditBalanceRow(
  db: D1Database,
  userId: string,
  capabilities: BillingCapabilities,
  options?: {
    allowFallback?: boolean
    requireWritable?: boolean
  },
): Promise<CreditBalanceSnapshot> {
  const allowFallback = options?.allowFallback ?? false
  const requireWritable = options?.requireWritable ?? false

  if (!capabilities.creditBalanceReadable) {
    if (allowFallback) {
      return EMPTY_CREDIT_BALANCE_SNAPSHOT
    }

    throw new BillingError(
      ErrorCode.BILLING_CONFIG_INVALID,
      'Credit ledger is unavailable because the billing schema is incomplete',
      {
        userId,
        reasons: capabilities.reasons.creditBalanceReadable,
      },
    )
  }

  if (requireWritable) {
    assertCreditBalanceWritable(capabilities, { userId })
  }

  await ensureCreditBalanceRow(db, userId)

  const row = await db
    .prepare(
      `SELECT trial_balance, trial_expires_at, monthly_balance, permanent_balance, frozen_credits, total_earned, total_spent
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<CreditBalanceRow>()

  return clearExpiredTrialBalance(
    db,
    userId,
    {
      trial_balance: row?.trial_balance ?? 0,
      trial_expires_at: row?.trial_expires_at ?? null,
      monthly_balance: row?.monthly_balance ?? 0,
      permanent_balance: row?.permanent_balance ?? 0,
      frozen_credits: row?.frozen_credits ?? 0,
      total_earned: row?.total_earned ?? 0,
      total_spent: row?.total_spent ?? 0,
    },
    {
      persistReset: capabilities.creditBalanceWritable,
    },
  )
}

/* ─── Allocation ─────────────────────────────────────── */

export function allocateCredits(
  available: CreditBalanceSnapshot,
  requestedCredits: number,
): CreditPoolBreakdown {
  const trial = Math.min(available.trial_balance, requestedCredits)
  const monthly = Math.min(
    available.monthly_balance,
    Math.max(0, requestedCredits - trial),
  )
  const permanent = Math.max(0, requestedCredits - trial - monthly)
  return createBreakdown(trial, monthly, permanent)
}

export function allocateCreditsFromBreakdown(
  available: CreditPoolBreakdown,
  requestedCredits: number,
): CreditPoolBreakdown {
  const trial = Math.min(available.trial, requestedCredits)
  const monthly = Math.min(available.monthly, Math.max(0, requestedCredits - trial))
  const permanent = Math.max(0, requestedCredits - trial - monthly)
  return createBreakdown(trial, monthly, permanent)
}

/* ─── Transaction Statements ─────────────────────────── */

export function buildCreditTransactionStatements(
  db: D1Database,
  userId: string,
  statements: CreditTransactionStatement[],
): D1PreparedStatement[] {
  return statements.map((statement) =>
    db
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
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        nanoid(),
        userId,
        statement.type,
        statement.pool,
        statement.amount,
        statement.balanceAfter,
        statement.source,
        statement.referenceId,
        statement.description,
      ),
  )
}

export function isLegacyTrialPoolConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('check constraint failed') &&
    message.includes('credit_transactions')
  ) || message.includes("pool in ('monthly', 'permanent')")
}

export function createInsufficientCreditsError(input: {
  requestedCredits: number
  availableCredits: number
  trialBalance: number
  monthlyBalance: number
  permanentBalance: number
}) {
  return new BillingError(
    ErrorCode.BILLING_CREDITS_INSUFFICIENT,
    `Insufficient credits: requested ${input.requestedCredits}, available ${input.availableCredits}`,
    input,
  )
}
