/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/validations/folder
 * [OUTPUT]: 对外提供 GET /api/folders (列表) + POST /api/folders (创建)
 * [POS]: api/folders 的文件夹 CRUD 入口，用于工作区项目分组
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { nanoid } from '@/lib/nanoid'
import { createFolderSchema } from '@/lib/validations/folder'

/* ─── GET /api/folders ──────────────────────────────── */

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()

    const folders = await db
      .prepare(
        `SELECT id, name, sort_order, created_at, updated_at
         FROM folders WHERE user_id = ?
         ORDER BY sort_order ASC, created_at ASC`,
      )
      .bind(userId)
      .all()

    return apiOk(folders.results)
  } catch (error) {
    return handleApiError(error)
  }
}

/* ─── POST /api/folders ─────────────────────────────── */

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const { name } = createFolderSchema.parse(body)

    const db = await getDb()
    const id = nanoid()

    // sort_order = 当前最大值 + 1
    const maxOrder = await db
      .prepare('SELECT COALESCE(MAX(sort_order), 0) as max_order FROM folders WHERE user_id = ?')
      .bind(userId)
      .first<{ max_order: number }>()

    const sortOrder = (maxOrder?.max_order ?? 0) + 1

    await db
      .prepare(
        `INSERT INTO folders (id, user_id, name, sort_order)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(id, userId, name, sortOrder)
      .run()

    return apiOk({ id, name, sort_order: sortOrder }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
