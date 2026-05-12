/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 POST /api/explore/outputs/:id/clone
 * [POS]: 公开生成作品克隆端点，后台克隆来源工作流并返回新工作流 id
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const source = await db
      .prepare(
        `SELECT po.workflow_id, w.name, w.description, w.data
         FROM published_outputs po
         JOIN workflows w ON w.id = po.workflow_id
         WHERE po.id = ? AND po.is_public = 1`,
      )
      .bind(id)
      .first<{ workflow_id: string; name: string; description: string; data: string }>()

    if (!source) {
      throw new NotFoundError('Published output', id)
    }

    const newId = nanoid()
    await db
      .prepare(
        `INSERT INTO workflows (id, user_id, name, description, data, folder_id)
         VALUES (?, ?, ?, ?, ?, NULL)`,
      )
      .bind(newId, userId, `${source.name} (Copy)`, source.description, source.data)
      .run()

    await db.prepare('UPDATE published_outputs SET clone_count = clone_count + 1 WHERE id = ?')
      .bind(id).run()

    return apiOk({ id: newId, clonedFrom: id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
