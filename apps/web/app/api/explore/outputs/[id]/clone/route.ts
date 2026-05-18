/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/errors
 * [OUTPUT]: 对外提供 POST /api/explore/outputs/:id/clone
 * [POS]: 公开生成作品克隆端点，优先克隆来源工作流；若导入作品缺失 workflow_id，则回退读取 workflow_json_url 重建工作流并返回新工作流 id
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuthenticatedAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { requireEnv } from '@/lib/env'
import { NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

type Params = { params: Promise<{ id: string }> }

interface PublishedOutputSource {
  workflow_id: string | null
  workflow_json_url: string | null
  name: string
  description: string
  data: string | null
}

async function readWorkflowJson(url: string): Promise<string | null> {
  try {
    const resolvedUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : new URL(url, await requireEnv('NEXT_PUBLIC_APP_URL')).toString()
    const response = await fetch(resolvedUrl)
    if (!response.ok) return null
    const text = await response.text()
    JSON.parse(text)
    return text
  } catch {
    return null
  }
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuthenticatedAuth()
    const { id } = await params
    const db = await getDb()

    const source = await db
      .prepare(
        `SELECT po.workflow_id, po.workflow_json_url, COALESCE(w.name, po.title) AS name,
                COALESCE(w.description, po.description, '') AS description, w.data
         FROM published_outputs po
         LEFT JOIN workflows w ON w.id = po.workflow_id
         WHERE po.id = ? AND po.is_public = 1`,
      )
      .bind(id)
      .first<PublishedOutputSource>()

    if (!source) {
      throw new NotFoundError('Published output', id)
    }

    const workflowData =
      source.data ||
      (source.workflow_json_url?.trim()
        ? await readWorkflowJson(source.workflow_json_url.trim())
        : null) ||
      '{}'

    const newId = nanoid()
    await db
      .prepare(
        `INSERT INTO workflows (id, user_id, name, description, data, folder_id)
         VALUES (?, ?, ?, ?, ?, NULL)`,
      )
      .bind(newId, userId, `${source.name} (Copy)`, source.description, workflowData)
      .run()

    await db.prepare('UPDATE published_outputs SET clone_count = clone_count + 1 WHERE id = ?')
      .bind(id).run()

    return apiOk({ id: newId, clonedFrom: id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
