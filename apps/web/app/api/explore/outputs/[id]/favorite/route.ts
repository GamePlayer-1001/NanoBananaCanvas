/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db
 * [OUTPUT]: 对外提供 POST /api/explore/outputs/:id/favorite
 * [POS]: 公开生成作品收藏切换端点
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
      .prepare('SELECT 1 FROM published_output_favorites WHERE user_id = ? AND published_output_id = ?')
      .bind(userId, id)
      .first()

    if (existing) {
      await db.prepare('DELETE FROM published_output_favorites WHERE user_id = ? AND published_output_id = ?')
        .bind(userId, id).run()
      return apiOk({ favorited: false })
    }

    await db.prepare('INSERT INTO published_output_favorites (user_id, published_output_id) VALUES (?, ?)')
      .bind(userId, id).run()
    return apiOk({ favorited: true })
  } catch (error) {
    return handleApiError(error)
  }
}
