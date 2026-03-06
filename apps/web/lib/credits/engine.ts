/**
 * [INPUT]: 依赖 @/lib/nanoid，依赖 @/lib/errors，依赖 @/lib/logger
 * [OUTPUT]: 对外提供 getBalance / freezeCredits / confirmSpend / refundCredits / addCredits / resetMonthlyCredits
 * [POS]: lib/credits 的核心引擎，实现冻结-扣费-退还三阶段事务
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AppError, ErrorCode } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

const log = createLogger('CreditEngine')

/* ─── Types ──────────────────────────────────────────── */

export interface CreditBalance {
  userId: string
  monthlyBalance: number
  permanentBalance: number
  frozen: number
  totalEarned: number
  totalSpent: number
}

type Pool = 'monthly' | 'permanent'

/* ─── Balance Query ──────────────────────────────────── */

export async function getBalance(db: D1Database, userId: string): Promise<CreditBalance> {
  const row = await db
    .prepare('SELECT * FROM credit_balances WHERE user_id = ?')
    .bind(userId)
    .first<{
      user_id: string
      monthly_balance: number
      permanent_balance: number
      frozen: number
      total_earned: number
      total_spent: number
    }>()

  if (!row) {
    // 首次查询，初始化余额行
    await db
      .prepare(
        `INSERT OR IGNORE INTO credit_balances (user_id) VALUES (?)`,
      )
      .bind(userId)
      .run()

    return {
      userId,
      monthlyBalance: 200,
      permanentBalance: 0,
      frozen: 0,
      totalEarned: 200,
      totalSpent: 0,
    }
  }

  return {
    userId: row.user_id,
    monthlyBalance: row.monthly_balance,
    permanentBalance: row.permanent_balance,
    frozen: row.frozen,
    totalEarned: row.total_earned,
    totalSpent: row.total_spent,
  }
}

/* ─── Freeze: 冻结积分 (调用前) ──────────────────────── */

export async function freezeCredits(
  db: D1Database,
  userId: string,
  amount: number,
): Promise<string> {
  if (amount <= 0) throw new AppError(ErrorCode.VALIDATION_FAILED, 'Amount must be positive')

  const balance = await getBalance(db, userId)
  const available = balance.monthlyBalance + balance.permanentBalance

  if (available < amount) {
    throw new AppError(ErrorCode.CREDITS_INSUFFICIENT, 'Insufficient credits', {
      required: amount,
      available,
    })
  }

  // 消耗优先级: monthly → permanent
  const fromMonthly = Math.min(balance.monthlyBalance, amount)
  const fromPermanent = amount - fromMonthly

  const txId = nanoid()
  const stmts: D1PreparedStatement[] = []

  // 扣 monthly
  if (fromMonthly > 0) {
    stmts.push(
      db
        .prepare(
          `UPDATE credit_balances
           SET monthly_balance = monthly_balance - ?,
               frozen = frozen + ?,
               updated_at = datetime('now')
           WHERE user_id = ? AND monthly_balance >= ?`,
        )
        .bind(fromMonthly, fromMonthly, userId, fromMonthly),
    )
  }

  // 扣 permanent
  if (fromPermanent > 0) {
    stmts.push(
      db
        .prepare(
          `UPDATE credit_balances
           SET permanent_balance = permanent_balance - ?,
               frozen = frozen + ?,
               updated_at = datetime('now')
           WHERE user_id = ? AND permanent_balance >= ?`,
        )
        .bind(fromPermanent, fromPermanent, userId, fromPermanent),
    )
  }

  // 记录冻结事务
  stmts.push(
    db
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, description)
         VALUES (?, ?, 'freeze', ?, ?, ?, 'ai_execution', ?)`,
      )
      .bind(
        txId,
        userId,
        fromMonthly > 0 ? 'monthly' : 'permanent',
        amount,
        available - amount,
        `Freeze ${amount} credits (monthly: ${fromMonthly}, permanent: ${fromPermanent})`,
      ),
  )

  const results = await db.batch(stmts)

  // 验证所有 UPDATE 是否成功 (并发防超扣)
  // stmts 结构: [monthly UPDATE?, permanent UPDATE?, INSERT]
  // UPDATE 语句带 WHERE balance >= ? 条件，并发竞争时 changes=0
  const updateCount = stmts.length - 1 // 最后一条是 INSERT
  for (let i = 0; i < updateCount; i++) {
    if (!results[i].meta.changes || results[i].meta.changes === 0) {
      throw new AppError(ErrorCode.CREDITS_FROZEN_FAILED, 'Failed to freeze credits — concurrent modification', {
        userId,
        amount,
        failedStmt: i,
      })
    }
  }

  log.info('Credits frozen', { userId, amount, txId, fromMonthly, fromPermanent })
  return txId
}

/* ─── Confirm Spend: 确认扣费 (调用成功后) ───────────── */

export async function confirmSpend(
  db: D1Database,
  userId: string,
  freezeTxId: string,
  actualAmount: number,
): Promise<void> {
  // 幂等校验: 防止重复扣费
  const existing = await db
    .prepare('SELECT id FROM credit_transactions WHERE reference_id = ? AND type = ?')
    .bind(freezeTxId, 'spend')
    .first()
  if (existing) {
    log.warn('Spend already confirmed, idempotent skip', { freezeTxId })
    return
  }

  // 查原始冻结事务 — 校验金额上限
  const freezeTx = await db
    .prepare('SELECT amount, pool FROM credit_transactions WHERE id = ? AND type = ?')
    .bind(freezeTxId, 'freeze')
    .first<{ amount: number; pool: string }>()

  if (!freezeTx) {
    log.error('Freeze transaction not found for confirm', { freezeTxId })
    throw new AppError(ErrorCode.VALIDATION_FAILED, 'Freeze transaction not found')
  }

  if (actualAmount > freezeTx.amount) {
    log.error('Actual spend exceeds frozen amount', {
      actualAmount, frozenAmount: freezeTx.amount, freezeTxId,
    })
    throw new AppError(ErrorCode.VALIDATION_FAILED, 'Actual spend exceeds frozen amount')
  }

  const refundAmount = freezeTx.amount - actualAmount
  const txId = nanoid()

  // 计算 balance_after: 当前可用余额 + 退还差额
  const balance = await getBalance(db, userId)
  const balanceAfter = balance.monthlyBalance + balance.permanentBalance + refundAmount

  const stmts: D1PreparedStatement[] = [
    // 释放冻结 (全部), 记录实际消耗
    db
      .prepare(
        `UPDATE credit_balances
         SET frozen = MAX(frozen - ?, 0),
             total_spent = total_spent + ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(freezeTx.amount, actualAmount, userId),
    // 事务日志
    db
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, reference_id, description)
         VALUES (?, ?, 'spend', ?, ?, ?, 'ai_execution', ?, ?)`,
      )
      .bind(txId, userId, freezeTx.pool, actualAmount, balanceAfter, freezeTxId,
        `Confirmed spend of ${actualAmount} credits`),
  ]

  // 部分退还: 实际消耗 < 冻结金额时，差额返还原始池
  if (refundAmount > 0) {
    const balanceField = freezeTx.pool === 'monthly' ? 'monthly_balance' : 'permanent_balance'
    stmts.push(
      db
        .prepare(
          `UPDATE credit_balances
           SET ${balanceField} = ${balanceField} + ?,
               updated_at = datetime('now')
           WHERE user_id = ?`,
        )
        .bind(refundAmount, userId),
    )
    log.info('Partial refund in confirmSpend', { userId, refundAmount, pool: freezeTx.pool })
  }

  await db.batch(stmts)

  log.info('Spend confirmed', { userId, actualAmount, frozenAmount: freezeTx.amount, freezeTxId })
}

/* ─── Refund: 退还冻结 (调用失败后) ──────────────────── */

export async function refundCredits(
  db: D1Database,
  userId: string,
  freezeTxId: string,
): Promise<void> {
  // 幂等校验: 防止重复退款
  const existing = await db
    .prepare('SELECT id FROM credit_transactions WHERE reference_id = ? AND type = ?')
    .bind(freezeTxId, 'refund')
    .first()
  if (existing) {
    log.warn('Refund already processed, idempotent skip', { freezeTxId })
    return
  }

  // 查原始冻结事务获取金额
  const freezeTx = await db
    .prepare('SELECT amount, pool FROM credit_transactions WHERE id = ? AND type = ?')
    .bind(freezeTxId, 'freeze')
    .first<{ amount: number; pool: string }>()

  if (!freezeTx) {
    log.warn('Freeze transaction not found for refund', { freezeTxId })
    return
  }

  const { amount, pool } = freezeTx
  const txId = nanoid()
  const balanceField = pool === 'monthly' ? 'monthly_balance' : 'permanent_balance'

  // 计算退还后的可用余额
  const balance = await getBalance(db, userId)
  const balanceAfter = balance.monthlyBalance + balance.permanentBalance + amount

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET ${balanceField} = ${balanceField} + ?,
             frozen = MAX(frozen - ?, 0),
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(amount, amount, userId),
    db
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, reference_id, description)
         VALUES (?, ?, 'refund', ?, ?, ?, 'ai_execution', ?, ?)`,
      )
      .bind(txId, userId, pool, amount, balanceAfter, freezeTxId, `Refund ${amount} credits`),
  ])

  log.info('Credits refunded', { userId, amount, freezeTxId })
}

/* ─── Add Credits: 充值 (订阅/购买/赠送) ────────────── */

export async function addCredits(
  db: D1Database,
  userId: string,
  amount: number,
  pool: Pool,
  source: string,
  referenceId?: string,
): Promise<void> {
  if (amount <= 0) return

  const balanceField = pool === 'monthly' ? 'monthly_balance' : 'permanent_balance'
  const txId = nanoid()

  // 确保余额行存在
  await db
    .prepare('INSERT OR IGNORE INTO credit_balances (user_id) VALUES (?)')
    .bind(userId)
    .run()

  // 计算充值后的可用余额
  const balance = await getBalance(db, userId)
  const balanceAfter = balance.monthlyBalance + balance.permanentBalance + amount

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET ${balanceField} = ${balanceField} + ?,
             total_earned = total_earned + ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(amount, amount, userId),
    db
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, reference_id, description)
         VALUES (?, ?, 'earn', ?, ?, ?, ?, ?, ?)`,
      )
      .bind(txId, userId, pool, amount, balanceAfter, source, referenceId ?? null, `Add ${amount} ${pool} credits`),
  ])

  log.info('Credits added', { userId, amount, pool, source })
}

/* ─── Reset Monthly: 月度重置 (订阅续费) ────────────── */

export async function resetMonthlyCredits(
  db: D1Database,
  userId: string,
  amount: number,
): Promise<void> {
  const txId = nanoid()

  // 计算重置后的可用余额 (monthly 被替换为 amount，permanent 不变)
  const balance = await getBalance(db, userId)
  const balanceAfter = amount + balance.permanentBalance

  await db.batch([
    db
      .prepare(
        `UPDATE credit_balances
         SET monthly_balance = ?,
             total_earned = total_earned + ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .bind(amount, amount, userId),
    db
      .prepare(
        `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, description)
         VALUES (?, ?, 'earn', 'monthly', ?, ?, 'subscription_renewal', ?)`,
      )
      .bind(txId, userId, amount, balanceAfter, `Monthly reset to ${amount} credits`),
  ])

  log.info('Monthly credits reset', { userId, amount })
}
