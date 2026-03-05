/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 POST /api/workflows/:id/like
 * [POS]: api/workflows/[id]/like 的点赞端点，toggle 点赞状态
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── POST /api/workflows/:id/like ───────────────────── */

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    // 检查是否已点赞
    const existing = await db
      .prepare('SELECT 1 FROM likes WHERE user_id = ? AND workflow_id = ?')
      .bind(userId, id)
      .first()

    if (existing) {
      // 取消点赞
      await db
        .prepare('DELETE FROM likes WHERE user_id = ? AND workflow_id = ?')
        .bind(userId, id)
        .run()
      await db
        .prepare('UPDATE workflows SET like_count = MAX(like_count - 1, 0) WHERE id = ?')
        .bind(id)
        .run()
      return apiOk({ liked: false })
    }

    // 点赞
    await db
      .prepare('INSERT INTO likes (user_id, workflow_id) VALUES (?, ?)')
      .bind(userId, id)
      .run()
    await db
      .prepare('UPDATE workflows SET like_count = like_count + 1 WHERE id = ?')
      .bind(id)
      .run()

    return apiOk({ liked: true })
  } catch (error) {
    return handleApiError(error)
  }
}
