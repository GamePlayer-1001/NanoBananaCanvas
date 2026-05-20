/**
 * [INPUT]: 依赖 ./ledger-helpers 的内部类型与辅助函数，依赖 ./capabilities, ./workflow-pricing
 * [OUTPUT]: 对外提供 freezeCredits()、confirmFrozenCredits()、refundFrozenCredits()、getReferenceCreditSummary()、getDailySigninStatus()、awardDailySigninCredits()
 * [POS]: lib/billing 的积分事务真相源，统一三阶段扣费与签到试用/订阅/永久三池扣减顺序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { BillingError, ErrorCode } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import {
  assertCreditBalanceWritable,
  assertDailySigninWritable,
} from './capabilities'
import { SIGNIN_TRIAL_CREDITS } from './workflow-pricing'
import {
  allocateCredits,
  allocateCreditsFromBreakdown,
  buildCreditTransactionStatements,
  clampCredits,
  createBreakdown,
  createInsufficientCreditsError,
  getTodayBounds,
  isLegacyTrialPoolConstraintError,
  isTrialExpired,
  log,
  readCreditBalanceRow,
  resolveLedgerCapabilities,
  resolveLedgerDb,
  resolveSigninTimeZone,
} from './ledger-helpers'
import type {
  CreditFinalizeResult,
  CreditFreezeResult,
  CreditLedgerSummary,
  CreditPoolBreakdown,
  CreditTransactionStatement,
  LedgerOperationType,
  LedgerRuntimeOptions,
  ReferenceCreditSummaryRow,
} from './ledger-helpers'

export type {
  CreditPoolBreakdown,
  CreditLedgerSummary,
  CreditFreezeResult,
  CreditFinalizeResult,
} from './ledger-helpers'

export async function getReferenceCreditSummary(
  userId: string,
  referenceId: string,
  options?: LedgerRuntimeOptions,
): Promise<CreditLedgerSummary> {
  const db = await resolveLedgerDb(options)
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
  db?: D1Database
}): Promise<CreditFreezeResult> {
  const db = await resolveLedgerDb(input)
  const capabilities = await resolveLedgerCapabilities(db, input)
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
    db?: D1Database
  },
  operation: LedgerOperationType,
): Promise<CreditFinalizeResult> {
  const db = await resolveLedgerDb(input)
  const capabilities = await resolveLedgerCapabilities(db, input)
  assertCreditBalanceWritable(capabilities, { userId: input.userId })
  const balance = await readCreditBalanceRow(db, input.userId, capabilities, {
    requireWritable: true,
  })
  const summary = await getReferenceCreditSummary(input.userId, input.referenceId, {
    db,
    capabilities,
  })
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
  db?: D1Database
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'spend')
}

export async function refundFrozenCredits(input: {
  userId: string
  referenceId: string
  source: string
  description: string
  requestedCredits?: number
  db?: D1Database
}): Promise<CreditFinalizeResult> {
  return finalizeFrozenCredits(input, 'refund')
}

export async function getDailySigninStatus(
  userId: string,
  options?: LedgerRuntimeOptions,
): Promise<{
  status: 'available' | 'claimed' | 'unavailable'
  available: boolean
  checkedInToday: boolean
  trialBalance: number
  trialExpiresAt: string | null
}> {
  const db = await resolveLedgerDb(options)
  const capabilities = await resolveLedgerCapabilities(db, options)
  const balance = await readCreditBalanceRow(db, userId, capabilities, {
    allowFallback: true,
  })
  const timeZone = await resolveSigninTimeZone(db, userId, options?.reportedTimezone)

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

  const { today } = getTodayBounds(timeZone)
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

export async function awardDailySigninCredits(
  userId: string,
  options?: LedgerRuntimeOptions,
): Promise<{
  creditsAwarded: number
  expiresAt: string
  trialBalance: number
}> {
  const db = await resolveLedgerDb(options)
  const capabilities = await resolveLedgerCapabilities(db, options)
  assertCreditBalanceWritable(capabilities, { userId })
  assertDailySigninWritable(capabilities, { userId })

  const balance = await readCreditBalanceRow(db, userId, capabilities, {
    requireWritable: true,
  })
  const timeZone = await resolveSigninTimeZone(db, userId, options?.reportedTimezone)
  const { today, expiresAt } = getTodayBounds(timeZone)
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
    if (isLegacyTrialPoolConstraintError(error)) {
      log.warn('Daily sign-in transaction log skipped due to legacy pool constraint', {
        userId,
        today,
        error: error instanceof Error ? error.message : String(error),
      })
    } else {
      log.error('Daily sign-in transaction log failed after balance update', error, {
        userId,
        today,
        creditsAwarded: SIGNIN_TRIAL_CREDITS,
      })
    }
  }

  return {
    creditsAwarded: SIGNIN_TRIAL_CREDITS,
    expiresAt,
    trialBalance: nextTrialBalance,
  }
}
