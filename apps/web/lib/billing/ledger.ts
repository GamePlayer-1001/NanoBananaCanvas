/**
 * [INPUT]: 依赖 @/lib/db、@/lib/errors、@/lib/nanoid，消费 credit_balances / credit_transactions 真相源
 * [OUTPUT]: 对外提供 freezeCredits()、confirmFrozenCredits()、refundFrozenCredits()、getReferenceCreditSummary()
 * [POS]: lib/billing 的积分事务真相源，统一三阶段扣费与订阅池/永久池双池扣减顺序，被 AI 执行链与异步任务链复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getDb } from '@/lib/db'
import { BillingError, ErrorCode } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

type CreditBalanceRow = {
  monthly_balance: number | null
  permanent_balance: number | null
  frozen_credits: number | null
  total_earned: number | null
  total_spent: number | null
}

type CreditBalanceSnapshot = {
  monthly_balance: number
  permanent_balance: number
  frozen_credits: number
  total_earned: number
  total_spent: number
}

type ReferenceCreditSummaryRow = {
  pool: 'monthly' | 'permanent'
  frozen_amount: number | null
  settled_amount: number | null
}

export interface CreditPoolBreakdown {
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
  pool: 'monthly' | 'permanent'
  amount: number
  balanceAfter: number
  source: string
  referenceId: string
  description: string
}

function clampCredits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.round(value)
}

async function ensureCreditBalanceRow(db: D1Database, userId: string) {
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

async function readCreditBalanceRow(
  db: D1Database,
  userId: string,
): Promise<CreditBalanceSnapshot> {
  await ensureCreditBalanceRow(db, userId)

  const row = await db
    .prepare(
      `SELECT monthly_balance, permanent_balance, frozen_credits, total_earned, total_spent
       FROM credit_balances
       WHERE user_id = ?`,
    )
    .bind(userId)
    .first<CreditBalanceRow>()

  return {
    monthly_balance: row?.monthly_balance ?? 0,
    permanent_balance: row?.permanent_balance ?? 0,
    frozen_credits: row?.frozen_credits ?? 0,
    total_earned: row?.total_earned ?? 0,
    total_spent: row?.total_spent ?? 0,
  }
}

function createBreakdown(monthly: number, permanent: number): CreditPoolBreakdown {
  return {
    monthly,
    permanent,
    total: monthly + permanent,
  }
}

function allocateCredits(
  available: CreditBalanceSnapshot,
  requestedCredits: number,
): CreditPoolBreakdown {
  const monthly = Math.min(available.monthly_balance, requestedCredits)
  const permanent = requestedCredits - monthly
  return createBreakdown(monthly, permanent)
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

function createInsufficientCreditsError(input: {
  requestedCredits: number
  availableCredits: number
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

  let frozenMonthly = 0
  let frozenPermanent = 0
  let settledMonthly = 0
  let settledPermanent = 0

  for (const row of rows.results ?? []) {
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
    frozen: createBreakdown(frozenMonthly, frozenPermanent),
    settled: createBreakdown(settledMonthly, settledPermanent),
    remaining: createBreakdown(
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
  const requestedCredits = clampCredits(input.requestedCredits)
  const balance = await readCreditBalanceRow(db, input.userId)

  if (requestedCredits === 0) {
    return {
      referenceId: input.referenceId,
      frozen: createBreakdown(0, 0),
      availableCreditsAfter: balance.monthly_balance + balance.permanent_balance,
      frozenCreditsAfter: balance.frozen_credits,
    }
  }

  const availableCredits = balance.monthly_balance + balance.permanent_balance
  if (availableCredits < requestedCredits) {
    throw createInsufficientCreditsError({
      requestedCredits,
      availableCredits,
      monthlyBalance: balance.monthly_balance,
      permanentBalance: balance.permanent_balance,
    })
  }

  const allocation = allocateCredits(balance, requestedCredits)
  const nextMonthlyBalance = balance.monthly_balance - allocation.monthly
  const nextPermanentBalance = balance.permanent_balance - allocation.permanent
  const nextFrozenCredits = balance.frozen_credits + allocation.total
  const availableCreditsAfter = nextMonthlyBalance + nextPermanentBalance

  const creditStatements: CreditTransactionStatement[] = []
  let runningAvailable = availableCredits

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
         SET monthly_balance = ?,
             permanent_balance = ?,
             frozen_credits = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(nextMonthlyBalance, nextPermanentBalance, nextFrozenCredits, input.userId),
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
  },
  operation: LedgerOperationType,
): Promise<CreditFinalizeResult> {
  const db = await getDb()
  const balance = await readCreditBalanceRow(db, input.userId)
  const summary = await getReferenceCreditSummary(input.userId, input.referenceId)
  const remaining = summary.remaining

  if (remaining.total === 0) {
    return {
      referenceId: input.referenceId,
      finalized: remaining,
      availableCreditsAfter: balance.monthly_balance + balance.permanent_balance,
      frozenCreditsAfter: balance.frozen_credits,
      totalSpentAfter: balance.total_spent,
    }
  }

  const nextFrozenCredits = Math.max(0, balance.frozen_credits - remaining.total)
  const nextMonthlyBalance =
    operation === 'refund' ? balance.monthly_balance + remaining.monthly : balance.monthly_balance
  const nextPermanentBalance =
    operation === 'refund'
      ? balance.permanent_balance + remaining.permanent
      : balance.permanent_balance
  const nextTotalSpent =
    operation === 'spend' ? balance.total_spent + remaining.total : balance.total_spent
  const availableCreditsAfter = nextMonthlyBalance + nextPermanentBalance

  const transactionType = operation === 'spend' ? 'spend' : 'refund'
  const transactionAmountSign = operation === 'spend' ? -1 : 1
  const creditStatements: CreditTransactionStatement[] = []
  let runningAvailable = balance.monthly_balance + balance.permanent_balance

  if (operation === 'refund') {
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
         SET monthly_balance = ?,
             permanent_balance = ?,
             frozen_credits = ?,
             total_spent = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(
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
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'spend')
}

export async function refundFrozenCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'refund')
}
