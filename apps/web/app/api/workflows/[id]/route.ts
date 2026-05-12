/**
 * [INPUT]: 依赖 @/lib/api/auth (requireAuth + optionalAuth), @/lib/api/response, @/lib/db, @/lib/errors, @/lib/logger, @/lib/validations/workflow
 * [OUTPUT]: 对外提供 GET/PUT/DELETE /api/workflows/:id
 * [POS]: api/workflows/[id] 的单个工作流 CRUD，GET 支持公开访问 (explore 详情页)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { optionalAuth, requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'
import { updateWorkflowSchema } from '@/lib/validations/workflow'

const log = createLogger('api:workflows:[id]')

const AUTHOR_NAME_SQL = `COALESCE(
  NULLIF(TRIM(u.name), ''),
  NULLIF(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), ''),
  NULLIF(TRIM(u.username), ''),
  NULLIF(
    TRIM(
      CASE
        WHEN INSTR(COALESCE(u.email, ''), '@') > 1
          THEN SUBSTR(u.email, 1, INSTR(u.email, '@') - 1)
        ELSE COALESCE(u.email, '')
      END
    ),
    ''
  ),
  'Unknown Creator'
)`

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── GET /api/workflows/:id ─────────────────────────── */

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const authUser = await optionalAuth()
    const { id } = await params
    const db = await getDb()

    const readInteractionState = async (workflowId: string, userId?: string | null) => {
      if (!userId) {
        return { liked: false, favorited: false }
      }

      const [likeRow, favRow] = await Promise.all([
        db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND workflow_id = ?')
          .bind(userId, workflowId).first(),
        db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND workflow_id = ?')
          .bind(userId, workflowId).first(),
      ])

      return {
        liked: !!likeRow,
        favorited: !!favRow,
      }
    }

    const incrementPublicView = async (workflowId: string, currentCount: number | null | undefined) => {
      try {
        await db
          .prepare('UPDATE workflows SET view_count = view_count + 1 WHERE id = ? AND is_public = 1')
          .bind(workflowId)
          .run()
        return (currentCount ?? 0) + 1
      } catch (err) {
        log.warn('Failed to increment view_count', { workflowId, error: String(err) })
        return currentCount ?? 0
      }
    }

    /* 优先匹配 owner (私有+公开均可) */
    if (authUser) {
      const owned = await db
        .prepare(
          `SELECT w.*,
                  ${AUTHOR_NAME_SQL} AS author_name,
                  u.avatar_url AS author_avatar
           FROM workflows w
           JOIN users u ON u.id = w.user_id
           WHERE w.id = ? AND w.user_id = ?`,
        )
        .bind(id, authUser.userId)
        .first()

      if (owned) {
        const interaction = await readInteractionState(id, authUser.userId)
        const viewCount =
          Number((owned as { is_public?: number }).is_public) === 1
            ? await incrementPublicView(id, (owned as { view_count?: number | null }).view_count)
            : ((owned as { view_count?: number | null }).view_count ?? 0)

        return apiOk({
          ...owned,
          ...interaction,
          view_count: viewCount,
          canEdit: true,
        })
      }
    }

    /* 非 owner → 仅允许公开作品，附带作者信息 */
    const pub = await db
      .prepare(
        `SELECT w.*,
                ${AUTHOR_NAME_SQL} AS author_name,
                u.avatar_url AS author_avatar
         FROM workflows w JOIN users u ON u.id = w.user_id
         WHERE w.id = ? AND w.is_public = 1`,
      )
      .bind(id)
      .first()

    if (!pub) throw new NotFoundError('Workflow', id)

    const nextViewCount = await incrementPublicView(id, (pub as { view_count?: number | null }).view_count)

    /* 查询当前用户的互动状态 */
    const { liked, favorited } = await readInteractionState(id, authUser?.userId)

    return apiOk({
      ...pub,
      liked,
      favorited,
      view_count: nextViewCount,
      canEdit: false,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── PUT /api/workflows/:id ─────────────────────────── */

export async function PUT(req: NextRequest, { params }: Params) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

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
    if (parsed.data.folder_id !== undefined) {
      sets.push('folder_id = ?')
      values.push(parsed.data.folder_id)
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
      return apiOk({ id, deleted: false })
    }

    return apiOk({ id, deleted: true })
  } catch (error) {
    return handleApiError(error)
  }
}
