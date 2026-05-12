/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 DELETE /api/explore/outputs/:id (撤回公开生成作品)
 * [POS]: api/explore/outputs/[id] 的单作品管理端点，允许拥有者撤回公开生成作品
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const result = await db
      .prepare(
        `UPDATE published_outputs
         SET is_public = 0, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(id, userId)
      .run()

    if (!result.meta.changes) {
      throw new NotFoundError('Published output', id)
    }

    return apiOk({ id, published: false })
  } catch (error) {
    return handleApiError(error)
  }
}
