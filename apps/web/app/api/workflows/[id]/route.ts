/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/validations/workflow
 * [OUTPUT]: 对外提供 GET/PUT/DELETE /api/workflows/:id
 * [POS]: api/workflows/[id] 的单个工作流 CRUD
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { updateWorkflowSchema } from '@/lib/validations/workflow'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── GET /api/workflows/:id ─────────────────────────── */

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const workflow = await db
      .prepare('SELECT * FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!workflow) {
      throw new NotFoundError('Workflow', id)
    }

    return apiOk(workflow)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PUT /api/workflows/:id ─────────────────────────── */

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()

    const parsed = updateWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError('Invalid update data', {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const db = await getDb()

    // 验证所有权
    const existing = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!existing) {
      throw new NotFoundError('Workflow', id)
    }

    // 动态构建 UPDATE
    const sets: string[] = []
    const values: unknown[] = []

    if (parsed.data.name !== undefined) {
      sets.push('name = ?')
      values.push(parsed.data.name)
    }
    if (parsed.data.description !== undefined) {
      sets.push('description = ?')
      values.push(parsed.data.description)
    }
    if (parsed.data.data !== undefined) {
      sets.push('data = ?')
      values.push(parsed.data.data)
    }

    if (sets.length === 0) {
      return apiOk({ id })
    }

    sets.push("updated_at = datetime('now')")
    values.push(id, userId)

    await db
      .prepare(
        `UPDATE workflows SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
      )
      .bind(...values)
      .run()

    return apiOk({ id })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── DELETE /api/workflows/:id ──────────────────────── */

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    const result = await db
      .prepare('DELETE FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run()

    if (!result.meta.changes) {
      throw new NotFoundError('Workflow', id)
    }

    return apiOk({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
