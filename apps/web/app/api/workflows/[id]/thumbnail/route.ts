/**
 * [INPUT]: 依赖 @/lib/api/auth, @/lib/api/response, @/lib/db, @/lib/r2,
 *          依赖 @/lib/storage 的 generateThumbnailPath, 依赖 @/lib/errors
 * [OUTPUT]: 对外提供 PUT /api/workflows/:id/thumbnail (画布截图上传)
 * [POS]: api/workflows/[id]/thumbnail 的缩略图端点，由画布编辑器自动调用，并写入带版本戳的缩略图 URL
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiOk, handleApiError } from '@/lib/api/response'
import { getDb } from '@/lib/db'
import { NotFoundError } from '@/lib/errors'
import { getR2 } from '@/lib/r2'
import { generateThumbnailPath } from '@/lib/storage'

/* ─── Params ─────────────────────────────────────────── */

type Params = { params: Promise<{ id: string }> }

/* ─── PUT /api/workflows/:id/thumbnail ───────────────── */

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth()
    const { id } = await params

    const db = await getDb()

    /* 验证工作流归属 */
    const existing = await db
      .prepare('SELECT id FROM workflows WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .first()

    if (!existing) {
      throw new NotFoundError('Workflow', id)
    }

    /* 读取文件 */
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return new Response('No file provided', { status: 400 })
    }

    /* 上传到 R2 (覆盖旧缩略图) */
    const r2 = await getR2()
    const r2Key = generateThumbnailPath(id)
    const buffer = await file.arrayBuffer()

    await r2.put(r2Key, buffer, {
      httpMetadata: { contentType: file.type || 'image/webp' },
    })

    /* 更新 DB */
    const thumbnailUrl = `/api/files/${r2Key}?v=${Date.now()}`
    await db
      .prepare(
        `UPDATE workflows SET thumbnail = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
      )
      .bind(thumbnailUrl, id, userId)
      .run()

    return apiOk({ url: thumbnailUrl, key: r2Key })
  } catch (error) {
    return handleApiError(error)
  }
}
