/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 POST /api/workflows/:id/favorite
 * [POS]: api/workflows/[id]/favorite 的收藏端点，toggle 收藏状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── POST /api/workflows/:id/favorite ───────────────── */

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    // 检查是否已收藏
    const existing = await db
      .prepare('SELECT 1 FROM favorites WHERE user_id = ? AND workflow_id = ?')
      .bind(userId, id)
      .first()

    if (existing) {
      // 取消收藏
      await db
        .prepare('DELETE FROM favorites WHERE user_id = ? AND workflow_id = ?')
        .bind(userId, id)
        .run()
      return apiOk({ favorited: false })
    }

    // 收藏
    await db
      .prepare('INSERT INTO favorites (user_id, workflow_id) VALUES (?, ?)')
      .bind(userId, id)
      .run()

    return apiOk({ favorited: true })
  } catch (error) {
    return handleApiError(error)
  }
}
