/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 POST /api/explore/outputs/:id/like
 * [POS]: 公开生成作品点赞切换端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const existing = await db
      .prepare('SELECT 1 FROM published_output_likes WHERE user_id = ? AND published_output_id = ?')
      .bind(userId, id)
      .first()

    if (existing) {
      await db.prepare('DELETE FROM published_output_likes WHERE user_id = ? AND published_output_id = ?')
        .bind(userId, id).run()
      await db.prepare('UPDATE published_outputs SET like_count = MAX(like_count - 1, 0) WHERE id = ?')
        .bind(id).run()
      return apiOk({ liked: false })
    }

    await db.prepare('INSERT INTO published_output_likes (user_id, published_output_id) VALUES (?, ?)')
      .bind(userId, id).run()
    await db.prepare('UPDATE published_outputs SET like_count = like_count + 1 WHERE id = ?')
      .bind(id).run()
    return apiOk({ liked: true })
  } catch (error) {
    return handleApiError(error)
  }
}
