/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 PUT /api/folders/:id (重命名) + DELETE /api/folders/:id (删除)
 * [POS]: api/folders/[id] 的单文件夹操作，删除时子项目 folder_id 由 DB ON DELETE SET NULL 自动置空
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── PUT /api/folders/:id ───────────────────────────── */

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()

    const name = (body.name as string)?.trim()
    if (!name) {
      throw new ValidationError('Folder name is required')
    }

    const db = await getDb()

    const result = await db
      .prepare(
        `UPDATE folders SET name = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(name, id, userId)
      .run()

    if (!result.meta.changes) {
      throw new NotFoundError('Folder', id)
    }

    return apiOk({ id, name })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── DELETE /api/folders/:id ────────────────────────── */

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const result = await db
      .prepare('DELETE FROM folders WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run()

    if (!result.meta.changes) {
      throw new NotFoundError('Folder', id)
    }

    // folder_id ON DELETE SET NULL — 子项目自动回到「全部」

    return apiOk({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
