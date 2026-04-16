/**
 * [INPUT]: 依赖 @/lib/api/auth，依赖 @/lib/db
 * [OUTPUT]: 对外提供 GET /api/users/me (匿名访客用户信息)
 * [POS]: api/users 的用户端点，返回当前匿名访客在 D1 中的用户镜像
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── GET /api/users/me ──────────────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()

    return apiOk(user)
  } catch (error) {
    return handleApiError(error)
  }
}
