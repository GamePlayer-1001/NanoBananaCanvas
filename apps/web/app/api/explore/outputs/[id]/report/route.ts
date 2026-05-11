/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/nanoid, @/lib/validations/report
 * [OUTPUT]: 对外提供 POST /api/explore/outputs/:id/report
 * [POS]: 公开生成作品举报端点，写入 D1 published_output_reports
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError, withBodyLimit } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import { nanoid } from '@/lib/nanoid'
import { reportSchema } from '@/lib/validations/report'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const tooLarge = withBodyLimit(req)
  if (tooLarge) return tooLarge

  try {
    const { userId } = await requireAuth()
    const { id } = await params
    const body = await req.json()
    const parsed = reportSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid report data', {
        issues: parsed.error.issues,
      })
    }

    const db = await getDb()
    const existing = await db
      .prepare(
        `SELECT 1 FROM published_output_reports
         WHERE reporter_id = ? AND published_output_id = ? AND status = 'pending'`,
      )
      .bind(userId, id)
      .first()

    if (existing) {
      return apiOk({ message: 'Report already submitted' })
    }

    const reportId = nanoid()
    await db
      .prepare(
        `INSERT INTO published_output_reports (id, reporter_id, published_output_id, reason, description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(reportId, userId, id, parsed.data.reason, parsed.data.description ?? '')
      .run()

    return apiOk({ id: reportId }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
