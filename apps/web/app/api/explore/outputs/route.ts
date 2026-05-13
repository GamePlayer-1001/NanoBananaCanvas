/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors, @/lib/nanoid, @/lib/validations/published-output
 * [OUTPUT]: 对外提供 GET/POST /api/explore/outputs (当前用户已发布生成作品列表 + 发布生成作品；上传封面优先，缺省时由前端对视频回退首帧预览，并保留真实分类字段)
 * [POS]: api/explore/outputs 的生成作品入口，支持当前用户管理与 completed task 发布为公开社区作品
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import { publishOutputSchema } from '@/lib/validations/published-output'

interface TaskRow {
  id: string
  user_id: string
  workflow_id: string | null
  task_type: 'image_gen' | 'video_gen' | 'audio_gen'
  model_id: string
  input_data: string
  output_data: string | null
  status: string
}

interface WorkflowCategoryRow {
  category_id: string | null
}

async function hasColumn(
  db: Awaited<ReturnType<typeof getDb>>,
  tableName: string,
  columnName: string,
) {
  const result = await db.prepare(`PRAGMA table_info(${tableName})`).all<{ name: string }>()
  return (result.results ?? []).some((column) => column.name === columnName)
}

export async function GET() {
  try {
    const { userId } = await requireAuth()
    const db = await getDb()
    const hasCategoryId = await hasColumn(db, 'published_outputs', 'category_id')

    const rows = await db
      .prepare(
        `SELECT id, title, description, prompt, source_url, thumbnail, media_url, media_type, ${hasCategoryId ? 'category_id' : 'NULL AS category_id'},
                like_count, clone_count, view_count, published_at, created_at
         FROM published_outputs
         WHERE user_id = ? AND is_public = 1
         ORDER BY published_at DESC, created_at DESC`,
      )
      .bind(userId)
      .all()

    return apiOk({ items: rows.results ?? [] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: Request) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const body = await req.json()
    const parsed = publishOutputSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid published output payload', {
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const db = await getDb()
    const hasCategoryId = await hasColumn(db, 'published_outputs', 'category_id')
    const task = await db
      .prepare(
        `SELECT id, user_id, workflow_id, task_type, model_id, input_data, output_data, status
         FROM async_tasks
         WHERE id = ? AND user_id = ?`,
      )
      .bind(parsed.data.taskId, userId)
      .first<TaskRow>()

    if (!task || task.status !== 'completed' || !task.output_data) {
      throw new NotFoundError('Completed task', parsed.data.taskId)
    }

    const output = JSON.parse(task.output_data) as {
      url?: string
      contentType?: string
      fileName?: string
    }
    const input = JSON.parse(task.input_data || '{}') as Record<string, unknown>
    const mediaUrl = output.url?.trim()

    if (!mediaUrl) {
      throw new ValidationError('Task output has no media url')
    }

    const mediaType = task.task_type === 'video_gen' ? 'video' : 'image'
    const workflowCategory = task.workflow_id
      ? await db
          .prepare('SELECT category_id FROM workflows WHERE id = ?')
          .bind(task.workflow_id)
          .first<WorkflowCategoryRow>()
      : null
    const resolvedCategoryId = parsed.data.categoryId ?? workflowCategory?.category_id ?? null
    const existing = await db
      .prepare('SELECT id FROM published_outputs WHERE task_id = ?')
      .bind(task.id)
      .first<{ id: string }>()

    if (existing) {
      const updateSql = hasCategoryId
        ? `UPDATE published_outputs
           SET title = ?, description = ?, prompt = ?, source_url = ?, thumbnail = COALESCE(?, thumbnail),
               category_id = COALESCE(?, category_id),
               media_url = ?, media_type = ?, workflow_id = ?, updated_at = datetime('now')
           WHERE id = ? AND user_id = ?`
        : `UPDATE published_outputs
           SET title = ?, description = ?, prompt = ?, source_url = ?, thumbnail = COALESCE(?, thumbnail),
               media_url = ?, media_type = ?, workflow_id = ?, updated_at = datetime('now')
           WHERE id = ? AND user_id = ?`
      const updateArgs = hasCategoryId
        ? [
            parsed.data.title,
            parsed.data.description ?? '',
            parsed.data.prompt ?? String(input.prompt ?? ''),
            parsed.data.sourceUrl ?? '',
            parsed.data.thumbnail ?? null,
            resolvedCategoryId,
            mediaUrl,
            mediaType,
            task.workflow_id,
            existing.id,
            userId,
          ]
        : [
            parsed.data.title,
            parsed.data.description ?? '',
            parsed.data.prompt ?? String(input.prompt ?? ''),
            parsed.data.sourceUrl ?? '',
            parsed.data.thumbnail ?? null,
            mediaUrl,
            mediaType,
            task.workflow_id,
            existing.id,
            userId,
          ]

      await db.prepare(updateSql).bind(...updateArgs).run()

      return apiOk({ id: existing.id, published: true })
    }

    const id = nanoid()
    const insertSql = hasCategoryId
      ? `INSERT INTO published_outputs (
          id, user_id, task_id, workflow_id, title, description, prompt, source_url,
          thumbnail, media_url, media_type, category_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO published_outputs (
          id, user_id, task_id, workflow_id, title, description, prompt, source_url,
          thumbnail, media_url, media_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const insertArgs = hasCategoryId
      ? [
          id,
          userId,
          task.id,
          task.workflow_id,
          parsed.data.title,
          parsed.data.description ?? '',
          parsed.data.prompt ?? String(input.prompt ?? ''),
          parsed.data.sourceUrl ?? '',
          parsed.data.thumbnail ?? output.url ?? '',
          mediaUrl,
          mediaType,
          resolvedCategoryId,
        ]
      : [
          id,
          userId,
          task.id,
          task.workflow_id,
          parsed.data.title,
          parsed.data.description ?? '',
          parsed.data.prompt ?? String(input.prompt ?? ''),
          parsed.data.sourceUrl ?? '',
          parsed.data.thumbnail ?? output.url ?? '',
          mediaUrl,
          mediaType,
        ]

    await db.prepare(insertSql).bind(...insertArgs).run()

    return apiOk({ id, published: true }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
