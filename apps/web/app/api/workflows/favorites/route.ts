/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 GET /api/workflows/favorites (当前用户的收藏列表)
 * [POS]: api/workflows 的收藏列表端点，被 profile works-tab 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── GET /api/workflows/favorites ────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const rows = await db
      .prepare(
        `SELECT w.id, w.name, w.description, w.thumbnail, w.is_public,
                w.like_count, w.clone_count, w.updated_at,
                u.name as author_name, u.avatar_url as author_avatar
         FROM favorites f
         JOIN workflows w ON w.id = f.workflow_id
         JOIN users u ON u.id = w.user_id
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
      )
      .bind(userId)
      .all()

    return apiOk({ items: rows.results ?? [] })
  } catch (error) {
    return handleApiError(error)
  }
}
