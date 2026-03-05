/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/validations/workflow
 * [OUTPUT]: 对外提供 POST/DELETE /api/workflows/:id/publish
 * [POS]: api/workflows/[id]/publish 的发布/取消发布端点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { publishWorkflowSchema } from '@/lib/validations/workflow'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── POST /api/workflows/:id/publish ────────────────── */

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()

    const parsed = publishWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError('Invalid publish data', {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const db = await getDb()

    const existing = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!existing) {
      throw new NotFoundError('Workflow', id)
    }

    await db
      .prepare(
        `UPDATE workflows
         SET is_public = 1, category_id = ?, published_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(parsed.data.categoryId, id, userId)
      .run()

    return apiOk({ id, published: true })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── DELETE /api/workflows/:id/publish ──────────────── */

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const result = await db
      .prepare(
        `UPDATE workflows
         SET is_public = 0, published_at = NULL, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(id, userId)
      .run()

    if (!result.meta.changes) {
      throw new NotFoundError('Workflow', id)
    }

    return apiOk({ id, published: false })
  } catch (error) {
    return handleApiError(error)
  }
}
