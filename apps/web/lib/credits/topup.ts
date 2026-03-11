/**
 * [INPUT]: 依赖 ./query 的 getBalance，依赖 ./types 的 Pool，依赖 @/lib/logger, @/lib/nanoid
 * [OUTPUT]: 对外提供 addCredits / resetMonthlyCredits
 * [POS]: lib/credits 的充值/重置操作，被 Stripe webhook + 管理后台消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { createLogger } from '@/lib/logger'
import { nanoid } from '@/lib/nanoid'

import { getBalance } from './query'
import type { Pool } from './types'

const log = createLogger('CreditTopup')

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
