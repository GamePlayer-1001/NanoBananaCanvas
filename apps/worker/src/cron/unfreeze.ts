/**
 * [INPUT]: 依赖 @nano-banana/shared 的 FREEZE_TTL_MINUTES/nanoid
 * [OUTPUT]: 对外提供 unfreezeStaleCredits — 批量解冻超时冻结积分
 * [POS]: cron 的积分解冻任务，每 10 分钟扫描一次
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { FREEZE_TTL_MINUTES, nanoid } from '@nano-banana/shared'

/** 扫描所有有冻结积分的用户，解冻超时的 freeze 交易 */
export async function unfreezeStaleCredits(db: D1Database): Promise<number> {
  /* 找出所有超时且未被 confirm/refund 的 freeze 交易 */
  const { results } = await db
    .prepare(
      `SELECT t.id, t.user_id, t.amount, t.pool
       FROM credit_transactions t
       WHERE t.type = 'freeze'
         AND t.created_at < datetime('now', ?)
         AND NOT EXISTS (
           SELECT 1 FROM credit_transactions r
           WHERE r.reference_id = t.id AND r.type IN ('spend', 'refund')
         )
       LIMIT 100`,
    )
    .bind(`-${FREEZE_TTL_MINUTES} minutes`)
    .all<{ id: string; user_id: string; amount: number; pool: string }>()

  if (!results || results.length === 0) return 0

  let total = 0
  for (const freeze of results) {
    const txId = nanoid()
    const balanceField = freeze.pool === 'monthly' ? 'monthly_balance' : 'permanent_balance'

    await db.batch([
      db
        .prepare(
          `UPDATE credit_balances
           SET ${balanceField} = ${balanceField} + ?,
               frozen = MAX(frozen - ?, 0),
               updated_at = datetime('now')
           WHERE user_id = ?`,
        )
        .bind(freeze.amount, freeze.amount, freeze.user_id),
      db
        .prepare(
          `INSERT INTO credit_transactions (id, user_id, type, pool, amount, balance_after, source, reference_id, description)
           VALUES (?, ?, 'unfreeze', ?, ?, 0, 'cron_cleanup', ?, ?)`,
        )
        .bind(txId, freeze.user_id, freeze.pool, freeze.amount, freeze.id,
          `Cron: auto-unfreeze stale ${freeze.amount} credits after ${FREEZE_TTL_MINUTES}min`),
    ])

    total += freeze.amount
  }

  return total
}
