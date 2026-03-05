/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/validations/workflow
 * [OUTPUT]: 对外提供 GET /api/workflows (列表) + POST /api/workflows (创建)
 * [POS]: api/workflows 的用户工作流 CRUD 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import { createWorkflowSchema } from '@/lib/validations/workflow'

/* ─── GET /api/workflows ─────────────────────────────── */

export async function GET(req: Request) {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const url = new URL(req.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))
    const offset = (page - 1) * limit

    const [workflows, countRow] = await Promise.all([
      db
        .prepare(
          `SELECT id, name, description, thumbnail, is_public, like_count,
                  clone_count, view_count, created_at, updated_at
           FROM workflows WHERE user_id = ?
           ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(userId, limit, offset)
        .all(),
      db
        .prepare('SELECT COUNT(*) as total FROM workflows WHERE user_id = ?')
        .bind(userId)
        .first<{ total: number }>(),
    ])

    return apiOk({
      items: workflows.results,
      total: countRow?.total ?? 0,
      page,
      limit,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── POST /api/workflows ────────────────────────────── */

export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth()
    const body = await req.json()

    const parsed = createWorkflowSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError('Invalid workflow data', {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const db = await getDb()
    const id = nanoid()
    const { name, description } = parsed.data

    await db
      .prepare(
        `INSERT INTO workflows (id, user_id, name, description, data)
         VALUES (?, ?, ?, ?, '{}')`,
      )
      .bind(id, userId, name, description ?? '')
      .run()

    return apiOk({ id, name, description: description ?? '' }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
