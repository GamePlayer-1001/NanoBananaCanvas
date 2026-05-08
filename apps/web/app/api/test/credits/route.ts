/**
 * [INPUT]: 依赖 @/lib/api/auth 的 requireAuth，依赖 @/lib/api/response，依赖 @/lib/db，依赖 @/lib/nanoid
 * [OUTPUT]: 对外提供 POST /api/test/credits，为当前会话 user 在 dev/e2e 环境补测试用永久积分
 * [POS]: api/test 的受限测试入口，只服务本地与 CI 的 Playwright 前置，不参与生产业务流
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'

const TEST_CREDIT_GRANT = 20

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return apiError('NOT_FOUND', 'Not found', 404)
  }

  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const balanceRow = await db
      .prepare(
        `SELECT permanent_balance, total_earned
         FROM credit_balances
         WHERE user_id = ?`,
      )
      .bind(userId)
      .first<{ permanent_balance: number | null; total_earned: number | null }>()

    const nextPermanentBalance = (balanceRow?.permanent_balance ?? 0) + TEST_CREDIT_GRANT
    const nextTotalEarned = (balanceRow?.total_earned ?? 0) + TEST_CREDIT_GRANT

    await db.batch([
      db
        .prepare(
          `INSERT INTO credit_balances (
             user_id,
             trial_balance,
             trial_expires_at,
             monthly_balance,
             permanent_balance,
             frozen_credits,
             total_earned,
             total_spent
           ) VALUES (?, 0, NULL, 0, ?, 0, ?, 0)
           ON CONFLICT(user_id) DO UPDATE SET
             permanent_balance = ?,
             total_earned = ?,
             updated_at = datetime('now')`,
        )
        .bind(
          userId,
          nextPermanentBalance,
          nextTotalEarned,
          nextPermanentBalance,
          nextTotalEarned,
        ),
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
           ) VALUES (?, ?, 'earn', 'permanent', ?, ?, 'e2e:test-credit', ?, ?)`,
        )
        .bind(
          nanoid(),
          userId,
          TEST_CREDIT_GRANT,
          nextPermanentBalance,
          `test-credit:${userId}`,
          `Grant ${TEST_CREDIT_GRANT} permanent credits for Playwright agent flows`,
        ),
    ])

    return apiOk({
      userId,
      grantedCredits: TEST_CREDIT_GRANT,
      permanentBalance: nextPermanentBalance,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
