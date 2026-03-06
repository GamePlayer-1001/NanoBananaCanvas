/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/validations/credits
 * [OUTPUT]: 对外提供 GET /api/credits/transactions (积分交易历史)
 * [POS]: api/credits 的交易记录端点，支持分页 + type 筛选
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { creditTransactionsQuerySchema } from '@/lib/validations/credits'

/* ─── GET /api/credits/transactions ──────────────────── */

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const url = new URL(req.url)
    const query = creditTransactionsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    )

    const { page, limit, type } = query
    const offset = (page - 1) * limit

    // 构建查询
    let where = 'WHERE user_id = ?'
    const binds: unknown[] = [userId]

    if (type) {
      where += ' AND type = ?'
      binds.push(type)
    }

    // 总数
    const countResult = await db
      .prepare(`SELECT COUNT(*) as total FROM credit_transactions ${where}`)
      .bind(...binds)
      .first<{ total: number }>()

    // 分页数据
    const rows = await db
      .prepare(
        `SELECT id, type, pool, amount, balance_after, source, reference_id, description, created_at
         FROM credit_transactions ${where}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(...binds, limit, offset)
      .all()

    return apiOk({
      items: rows.results,
      total: countResult?.total ?? 0,
      page,
      limit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
