/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/validations/workflow
 * [OUTPUT]: 对外提供 GET /api/workflows (列表) + POST /api/workflows (创建/导入本地草稿/模板起手，并继承当前文件夹归属)
 * [POS]: api/workflows 的用户工作流 CRUD 入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import { buildTemplateWorkflow } from '@/lib/agent/template-catalog'
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
    const folderId = url.searchParams.get('folder')

    // 构建文件夹筛选条件
    const folderClause = folderId ? 'AND folder_id = ?' : ''
    const baseBinds = folderId ? [userId, folderId] : [userId]

    const [workflows, countRow] = await Promise.all([
      db
        .prepare(
          `SELECT id, name, description, thumbnail, is_public, like_count,
                  clone_count, view_count, folder_id, created_at, updated_at
           FROM workflows WHERE user_id = ? ${folderClause}
           ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(...baseBinds, limit, offset)
        .all(),
      db
        .prepare(`SELECT COUNT(*) as total FROM workflows WHERE user_id = ? ${folderClause}`)
        .bind(...baseBinds)
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
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

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
    const { name, description, data, folderId, template, auditTrail } = parsed.data
    const serializedData =
      data ??
      (template ? JSON.stringify({
        ...(buildTemplateWorkflow(template.id) ?? { version: 1, name, nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 }, savedAt: new Date().toISOString() }),
        name,
        template,
        auditTrail,
      }) : '{}')

    await db
      .prepare(
        `INSERT INTO workflows (id, user_id, name, description, data, folder_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, userId, name, description ?? '', serializedData, folderId ?? null)
      .run()

    return apiOk({ id, name, description: description ?? '' }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
