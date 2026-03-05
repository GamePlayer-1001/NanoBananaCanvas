/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/errors
 * [OUTPUT]: 对外提供 POST /api/workflows/:id/clone
 * [POS]: api/workflows/[id]/clone 的克隆端点，复制工作流到当前用户
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── POST /api/workflows/:id/clone ──────────────────── */

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const db = await getDb()

    // 只能克隆公开作品
    const source = await db
      .prepare('SELECT name, description, data FROM workflows WHERE id = ? AND is_public = 1')
      .bind(id)
      .first<{ name: string; description: string; data: string }>()

    if (!source) {
      throw new NotFoundError('Workflow', id)
    }

    // 创建克隆
    const newId = nanoid()
    await db
      .prepare(
        `INSERT INTO workflows (id, user_id, name, description, data)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(newId, userId, `${source.name} (Copy)`, source.description, source.data)
      .run()

    // 原作品 clone_count++
    await db
      .prepare('UPDATE workflows SET clone_count = clone_count + 1 WHERE id = ?')
      .bind(id)
      .run()

    return apiOk({ id: newId, clonedFrom: id }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
