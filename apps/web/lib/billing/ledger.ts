/**
 * [INPUT]: 依赖 @/lib/db、@/lib/errors、@/lib/nanoid，消费 credit_balances / credit_transactions 真相源
 * [OUTPUT]: 对外提供 freezeCredits()、confirmFrozenCredits()、refundFrozenCredits()、getReferenceCreditSummary()、getDailySigninStatus()、awardDailySigninCredits()
 * [POS]: lib/billing 的积分事务真相源，统一三阶段扣费与签到试用/订阅/永久三池扣减顺序，被 AI 执行链、异步任务链与签到入口复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import {
  assertCreditBalanceWritable,
  assertDailySigninWritable,
  getBillingCapabilities,
  type BillingCapabilities,
} from './capabilities'
import { SIGNIN_TRIAL_CREDITS } from './workflow-pricing'

type CreditBalanceRow = {
  trial_balance: number | null
  trial_expires_at: string | null
  monthly_balance: number | null
  permanent_balance: number | null
  frozen_credits: number | null
  total_earned: number | null
  total_spent: number | null
}

type CreditBalanceSnapshot = {
  trial_balance: number
  trial_expires_at: string | null
  monthly_balance: number
  permanent_balance: number
  frozen_credits: number
  total_earned: number
  total_spent: number
}

type ReferenceCreditSummaryRow = {
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

type LedgerOperationType = 'spend' | 'refund'

interface CreditTransactionStatement {
  type: 'freeze' | 'spend' | 'refund'
  pool: 'trial' | 'monthly' | 'permanent'
  amount: number
  balanceAfter: number
  source: string
  referenceId: string
  description: string
}

const EMPTY_CREDIT_BALANCE_SNAPSHOT: CreditBalanceSnapshot = {
  trial_balance: 0,
  trial_expires_at: null,
  monthly_balance: 0,
  permanent_balance: 0,
  frozen_credits: 0,
  total_earned: 0,
  total_spent: 0,
}

function clampCredits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.round(value)
}

function createBreakdown(
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

function getTodayBounds() {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    today: start.toISOString().slice(0, 10),
    expiresAt: end.toISOString(),
  }
}

function isTrialExpired(expiresAt: string | null | undefined): boolean {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now()
}

async function ensureCreditBalanceRow(db: D1Database, userId: string) {
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

async function clearExpiredTrialBalance(
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

async function readCreditBalanceRow(
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

function allocateCredits(
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

function allocateCreditsFromBreakdown(
  available: CreditPoolBreakdown,
  requestedCredits: number,
): CreditPoolBreakdown {
  const trial = Math.min(available.trial, requestedCredits)
  const monthly = Math.min(available.monthly, Math.max(0, requestedCredits - trial))
  const permanent = Math.max(0, requestedCredits - trial - monthly)
  return createBreakdown(trial, monthly, permanent)
}

function buildCreditTransactionStatements(
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

function isLegacyTrialPoolConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('check constraint failed') &&
    message.includes('credit_transactions')
  ) || message.includes("pool in ('monthly', 'permanent')")
}

function createInsufficientCreditsError(input: {
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

export async function getReferenceCreditSummary(
  userId: string,
  referenceId: string,
): Promise<CreditLedgerSummary> {
  const db = await getDb()
  const rows = await db
    .prepare(
      `SELECT
         pool,
         SUM(CASE WHEN type = 'freeze' THEN ABS(amount) ELSE 0 END) AS frozen_amount,
         SUM(CASE WHEN type IN ('spend', 'refund', 'unfreeze') THEN ABS(amount) ELSE 0 END) AS settled_amount
       FROM credit_transactions
       WHERE user_id = ?
         AND reference_id = ?
       GROUP BY pool`,
    )
    .bind(userId, referenceId)
    .all<ReferenceCreditSummaryRow>()

  let frozenTrial = 0
  let frozenMonthly = 0
  let frozenPermanent = 0
  let settledTrial = 0
  let settledMonthly = 0
  let settledPermanent = 0

  for (const row of rows.results ?? []) {
    if (row.pool === 'trial') {
      frozenTrial = row.frozen_amount ?? 0
      settledTrial = row.settled_amount ?? 0
      continue
    }

    if (row.pool === 'monthly') {
      frozenMonthly = row.frozen_amount ?? 0
      settledMonthly = row.settled_amount ?? 0
      continue
    }

    frozenPermanent = row.frozen_amount ?? 0
    settledPermanent = row.settled_amount ?? 0
  }

  return {
    referenceId,
    frozen: createBreakdown(frozenTrial, frozenMonthly, frozenPermanent),
    settled: createBreakdown(settledTrial, settledMonthly, settledPermanent),
    remaining: createBreakdown(
      Math.max(0, frozenTrial - settledTrial),
      Math.max(0, frozenMonthly - settledMonthly),
      Math.max(0, frozenPermanent - settledPermanent),
    ),
  }
}

export async function freezeCredits(input: {
  userId: string
  requestedCredits: number
  referenceId: string
  source: string
  description: string
}): Promise<CreditFreezeResult> {
  const db = await getDb()
  const capabilities = await getBillingCapabilities()
  assertCreditBalanceWritable(capabilities, { userId: input.userId })
  const requestedCredits = clampCredits(input.requestedCredits)
  const balance = await readCreditBalanceRow(db, input.userId, capabilities, {
    requireWritable: true,
  })

  if (requestedCredits === 0) {
    return {
      referenceId: input.referenceId,
      frozen: createBreakdown(0, 0, 0),
      availableCreditsAfter:
        balance.trial_balance + balance.monthly_balance + balance.permanent_balance,
      frozenCreditsAfter: balance.frozen_credits,
    }
  }

  const availableCredits =
    balance.trial_balance + balance.monthly_balance + balance.permanent_balance
  if (availableCredits < requestedCredits) {
    throw createInsufficientCreditsError({
      requestedCredits,
      availableCredits,
      trialBalance: balance.trial_balance,
      monthlyBalance: balance.monthly_balance,
      permanentBalance: balance.permanent_balance,
    })
  }

  const allocation = allocateCredits(balance, requestedCredits)
  const nextTrialBalance = balance.trial_balance - allocation.trial
  const nextMonthlyBalance = balance.monthly_balance - allocation.monthly
  const nextPermanentBalance = balance.permanent_balance - allocation.permanent
  const nextFrozenCredits = balance.frozen_credits + allocation.total
  const availableCreditsAfter =
    nextTrialBalance + nextMonthlyBalance + nextPermanentBalance

  const creditStatements: CreditTransactionStatement[] = []
  let runningAvailable = availableCredits

  if (allocation.trial > 0) {
    runningAvailable -= allocation.trial
    creditStatements.push({
      type: 'freeze',
      pool: 'trial',
      amount: -allocation.trial,
      balanceAfter: runningAvailable,
      source: input.source,
      referenceId: input.referenceId,
      description: input.description,
    })
  }

  if (allocation.monthly > 0) {
    runningAvailable -= allocation.monthly
    creditStatements.push({
      type: 'freeze',
      pool: 'monthly',
      amount: -allocation.monthly,
      balanceAfter: runningAvailable,
      source: input.source,
      referenceId: input.referenceId,
      description: input.description,
    })
  }

  if (allocation.permanent > 0) {
    runningAvailable -= allocation.permanent
    creditStatements.push({
      type: 'freeze',
      pool: 'permanent',
      amount: -allocation.permanent,
      balanceAfter: runningAvailable,
      source: input.source,
      referenceId: input.referenceId,
      description: input.description,
    })
  }

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET trial_balance = ?,
             monthly_balance = ?,
             permanent_balance = ?,
             frozen_credits = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(
        nextTrialBalance,
        nextMonthlyBalance,
        nextPermanentBalance,
        nextFrozenCredits,
        input.userId,
      ),
    ...buildCreditTransactionStatements(db, input.userId, creditStatements),
  ])

  return {
    referenceId: input.referenceId,
    frozen: allocation,
    availableCreditsAfter,
    frozenCreditsAfter: nextFrozenCredits,
  }
}

async function finalizeFrozenCredits(
  input: {
    userId: string
    referenceId: string
    source: string
    description: string
    requestedCredits?: number
  },
  operation: LedgerOperationType,
): Promise<CreditFinalizeResult> {
  const db = await getDb()
  const capabilities = await getBillingCapabilities()
  assertCreditBalanceWritable(capabilities, { userId: input.userId })
  const balance = await readCreditBalanceRow(db, input.userId, capabilities, {
    requireWritable: true,
  })
  const summary = await getReferenceCreditSummary(input.userId, input.referenceId)
  const requestedCredits = clampCredits(input.requestedCredits ?? summary.remaining.total)
  const remaining =
    requestedCredits > 0
      ? allocateCreditsFromBreakdown(summary.remaining, Math.min(requestedCredits, summary.remaining.total))
      : createBreakdown(0, 0, 0)

  if (remaining.total === 0) {
    return {
      referenceId: input.referenceId,
      finalized: remaining,
      availableCreditsAfter:
        balance.trial_balance + balance.monthly_balance + balance.permanent_balance,
      frozenCreditsAfter: balance.frozen_credits,
      totalSpentAfter: balance.total_spent,
    }
  }

  const nextFrozenCredits = Math.max(0, balance.frozen_credits - remaining.total)
  const nextTrialBalance =
    operation === 'refund' ? balance.trial_balance + remaining.trial : balance.trial_balance
  const nextMonthlyBalance =
    operation === 'refund' ? balance.monthly_balance + remaining.monthly : balance.monthly_balance
  const nextPermanentBalance =
    operation === 'refund'
      ? balance.permanent_balance + remaining.permanent
      : balance.permanent_balance
  const nextTotalSpent =
    operation === 'spend' ? balance.total_spent + remaining.total : balance.total_spent
  const availableCreditsAfter =
    nextTrialBalance + nextMonthlyBalance + nextPermanentBalance

  const transactionType = operation === 'spend' ? 'spend' : 'refund'
  const transactionAmountSign = operation === 'spend' ? -1 : 1
  const creditStatements: CreditTransactionStatement[] = []
  let runningAvailable =
    balance.trial_balance + balance.monthly_balance + balance.permanent_balance

  if (operation === 'refund') {
    runningAvailable += remaining.trial
    if (remaining.trial > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'trial',
        amount: transactionAmountSign * remaining.trial,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }

    runningAvailable += remaining.monthly
    if (remaining.monthly > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'monthly',
        amount: transactionAmountSign * remaining.monthly,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }

    runningAvailable += remaining.permanent
    if (remaining.permanent > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'permanent',
        amount: transactionAmountSign * remaining.permanent,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }
  } else {
    if (remaining.trial > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'trial',
        amount: transactionAmountSign * remaining.trial,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }

    if (remaining.monthly > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'monthly',
        amount: transactionAmountSign * remaining.monthly,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }

    if (remaining.permanent > 0) {
      creditStatements.push({
        type: transactionType,
        pool: 'permanent',
        amount: transactionAmountSign * remaining.permanent,
        balanceAfter: runningAvailable,
        source: input.source,
        referenceId: input.referenceId,
        description: input.description,
      })
    }
  }

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET trial_balance = ?,
             monthly_balance = ?,
             permanent_balance = ?,
             frozen_credits = ?,
             total_spent = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(
        nextTrialBalance,
        nextMonthlyBalance,
        nextPermanentBalance,
        nextFrozenCredits,
        nextTotalSpent,
        input.userId,
      ),
    ...buildCreditTransactionStatements(db, input.userId, creditStatements),
  ])

  return {
    referenceId: input.referenceId,
    finalized: remaining,
    availableCreditsAfter,
    frozenCreditsAfter: nextFrozenCredits,
    totalSpentAfter: nextTotalSpent,
  }
}

export async function confirmFrozenCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
  requestedCredits?: number
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'spend')
}

export async function refundFrozenCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
  requestedCredits?: number
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'refund')
}

export async function getDailySigninStatus(userId: string): Promise<{
  status: 'available' | 'claimed' | 'unavailable'
  available: boolean
  checkedInToday: boolean
  trialBalance: number
  trialExpiresAt: string | null
}> {
  const db = await getDb()
  const capabilities = await getBillingCapabilities()
  const balance = await readCreditBalanceRow(db, userId, capabilities, {
    allowFallback: true,
  })

  if (!capabilities.creditBalanceReadable || !capabilities.dailySigninReadable) {
    const checkedInToday =
      balance.trial_balance >= SIGNIN_TRIAL_CREDITS &&
      Boolean(balance.trial_expires_at) &&
      !isTrialExpired(balance.trial_expires_at)

    return {
      status: checkedInToday ? 'claimed' : 'unavailable',
      available: checkedInToday,
      checkedInToday,
      trialBalance: balance.trial_balance,
      trialExpiresAt: balance.trial_expires_at,
    }
  }

  const { today } = getTodayBounds()
  const row = await db
    .prepare(
      `SELECT id FROM daily_signins
       WHERE user_id = ? AND signin_date = ?
       LIMIT 1`,
    )
    .bind(userId, today)
    .first<{ id: string }>()

  return {
    status: row?.id ? 'claimed' : 'available',
    available: true,
    checkedInToday: Boolean(row?.id),
    trialBalance: balance.trial_balance,
    trialExpiresAt: balance.trial_expires_at,
  }
}

export async function awardDailySigninCredits(userId: string): Promise<{
  creditsAwarded: number
  expiresAt: string
  trialBalance: number
}> {
  const db = await getDb()
  const capabilities = await getBillingCapabilities()
  assertCreditBalanceWritable(capabilities, { userId })
  assertDailySigninWritable(capabilities, { userId })

  const balance = await readCreditBalanceRow(db, userId, capabilities, {
    requireWritable: true,
  })
  const { today, expiresAt } = getTodayBounds()
  const existing = await db
    .prepare(
      `SELECT id FROM daily_signins
       WHERE user_id = ? AND signin_date = ?
       LIMIT 1`,
    )
    .bind(userId, today)
    .first<{ id: string }>()

  if (existing?.id) {
    throw new BillingError(
      ErrorCode.BILLING_PROVIDER_ERROR,
      'Daily sign-in already claimed',
      { userId, today },
    )
  }

  const nextTrialBalance = balance.trial_balance + SIGNIN_TRIAL_CREDITS
  const nextTotalEarned = balance.total_earned + SIGNIN_TRIAL_CREDITS
  const nextAvailable =
    nextTrialBalance + balance.monthly_balance + balance.permanent_balance

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET trial_balance = ?,
             trial_expires_at = ?,
             total_earned = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(nextTrialBalance, expiresAt, nextTotalEarned, userId),
    db
      .prepare(
        `INSERT INTO daily_signins (id, user_id, signin_date, credits_awarded, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(nanoid(), userId, today, SIGNIN_TRIAL_CREDITS, expiresAt),
  ])

  try {
    await db.batch(
      buildCreditTransactionStatements(db, userId, [
        {
          type: 'refund',
          pool: 'trial',
          amount: SIGNIN_TRIAL_CREDITS,
          balanceAfter: nextAvailable,
          source: 'daily_signin_reward',
          referenceId: `signin_${today}`,
          description: `Daily sign-in reward for ${today}`,
        },
      ]),
    )
  } catch (error) {
    if (!isLegacyTrialPoolConstraintError(error)) {
      throw error
    }
  }

  return {
    creditsAwarded: SIGNIN_TRIAL_CREDITS,
    expiresAt,
    trialBalance: nextTrialBalance,
  }
}
