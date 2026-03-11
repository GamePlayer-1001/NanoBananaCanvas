/**
 * [INPUT]: 依赖 ./types 的 CreditBalance/FREEZE_TTL_MINUTES，依赖 @/lib/logger, @/lib/nanoid
 * [OUTPUT]: 对外提供 getBalance / unfreezeStaleCredits
 * [POS]: lib/credits 的余额查询 + 超时冻结清理，被 freeze/topup 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

import { type CreditBalance, FREEZE_TTL_MINUTES } from './types'

const log = createLogger('CreditQuery')

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
      .prepare('INSERT OR IGNORE INTO credit_balances (user_id) VALUES (?)')
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

  // 被动清理超时冻结 (仅在有冻结积分时触发，避免无谓查询)
  if (row.frozen > 0) {
    const recovered = await unfreezeStaleCredits(db, userId)
    if (recovered > 0) return getBalance(db, userId)
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

/* ─── Unfreeze Stale: 清理超时冻结 (防积分永久卡死) ── */

export async function unfreezeStaleCredits(db: D1Database, userId: string): Promise<number> {
  const staleFreezes = await db
    .prepare(
      `SELECT t.id, t.amount, t.pool
       FROM credit_transactions t
       WHERE t.user_id = ? AND t.type = 'freeze'
         AND t.created_at < datetime('now', ?)
         AND NOT EXISTS (
           SELECT 1 FROM credit_transactions r
           WHERE r.reference_id = t.id AND r.type IN ('spend', 'refund')
         )`,
    )
    .bind(userId, `-${FREEZE_TTL_MINUTES} minutes`)
    .all<{ id: string; amount: number; pool: string }>()

  if (!staleFreezes.results || staleFreezes.results.length === 0) return 0

  const currentBalance = await db
    .prepare('SELECT monthly_balance, permanent_balance FROM credit_balances WHERE user_id = ?')
    .bind(userId)
    .first<{ monthly_balance: number; permanent_balance: number }>()

  let runningAvailable = (currentBalance?.monthly_balance ?? 0) + (currentBalance?.permanent_balance ?? 0)
  let totalUnfrozen = 0

  for (const freeze of staleFreezes.results) {
    const txId = nanoid()
    const balanceField = freeze.pool === 'monthly' ? 'monthly_balance' : 'permanent_balance'
    const balanceAfter = runningAvailable + freeze.amount

    await db.batch([
      db
        .prepare(
          `UPDATE credit_balances
           SET ${balanceField} = ${balanceField} + ?,
               frozen = MAX(frozen - ?, 0),
               updated_at = datetime('now')
           WHERE user_id = ?`,
        )
        .bind(freeze.amount, freeze.amount, userId),
      db
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, reference_id, description)
           VALUES (?, ?, 'unfreeze', ?, ?, ?, 'stale_cleanup', ?, ?)`,
        )
        .bind(txId, userId, freeze.pool, freeze.amount, balanceAfter, freeze.id,
          `Auto-unfreeze stale ${freeze.amount} credits after ${FREEZE_TTL_MINUTES}min timeout`),
    ])

    runningAvailable = balanceAfter
    totalUnfrozen += freeze.amount
  }

  if (totalUnfrozen > 0) {
    log.warn('Stale frozen credits recovered', { userId, totalUnfrozen, count: staleFreezes.results.length })
  }

  return totalUnfrozen
}
