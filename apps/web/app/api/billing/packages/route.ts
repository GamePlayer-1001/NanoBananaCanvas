/**
 * [INPUT]: 依赖 @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/billing/packages (积分包列表)
 * [POS]: api/billing 的积分包查询端点，无需认证
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── GET /api/billing/packages ──────────────────────── */

export async function GET() {
  try {
    const db = await getDb()

    const packages = await db
      .prepare(
        `SELECT id, name, credits, price_cents, bonus_credits, sort_order
         FROM credit_packages
         WHERE is_active = 1
         ORDER BY sort_order ASC`,
      )
      .all()

    return apiOk({ packages: packages.results })
  } catch (error) {
    return handleApiError(error)
  }
}
