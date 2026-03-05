/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/validations/report
 * [OUTPUT]: 对外提供 POST /api/workflows/:id/report
 * [POS]: api/workflows/[id]/report 的举报端点，提交举报记录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import { reportSchema } from '@/lib/validations/report'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── POST /api/workflows/:id/report ─────────────────── */

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()

    // 验证
    const parsed = reportSchema.safeParse(body)
    if (!parsed.success) {
      throw new ValidationError('Invalid report data', {
        issues: parsed.error.issues,
      })
    }

    const { reason, description } = parsed.data
    const db = await getDb()

    // 防重复举报
    const existing = await db
      .prepare(
        `SELECT 1 FROM reports WHERE reporter_id = ? AND workflow_id = ? AND status = 'pending'`,
      )
      .bind(userId, id)
      .first()

    if (existing) {
      return apiOk({ message: 'Report already submitted' })
    }

    // 创建举报
    const reportId = nanoid()
    await db
      .prepare(
        `INSERT INTO reports (id, reporter_id, workflow_id, reason, description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(reportId, userId, id, reason, description ?? '')
      .run()

    return apiOk({ id: reportId }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
