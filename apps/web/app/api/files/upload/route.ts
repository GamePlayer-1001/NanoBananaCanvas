/**
 * [INPUT]: 依赖 @/lib/api/auth 的 requireAuth，依赖 @/lib/r2 的 getR2，
 *          依赖 @/lib/nanoid，依赖 @/lib/validations/upload
 * [OUTPUT]: 对外提供 POST /api/files/upload (multipart → R2)
 * [POS]: api/files 的上传端点，被前端 useUpload hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { nanoid } from '@/lib/nanoid'
import { getR2 } from '@/lib/r2'
import { UPLOAD_LIMITS } from '@/lib/validations/upload'

/* ─── POST /api/files/upload ────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const { userId } = await requireAuth()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('VALIDATION_FAILED', 'No file provided', 400)
    }

    /* ── Validate ───────────────────────────────────── */
    if (file.size > UPLOAD_LIMITS.maxSizeBytes) {
      const maxMB = UPLOAD_LIMITS.maxSizeBytes / 1024 / 1024
      return apiError('VALIDATION_FAILED', `File exceeds ${maxMB}MB limit`, 400)
    }

    if (!UPLOAD_LIMITS.allowedTypes.has(file.type)) {
      return apiError('VALIDATION_FAILED', `Unsupported file type: ${file.type}`, 400)
    }

    /* ── Upload to R2 ───────────────────────────────── */
    const ext = file.name.split('.').pop() ?? 'bin'
    const key = `${userId}/${nanoid()}.${ext}`

    const r2 = await getR2()
    await r2.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: { userId, originalName: file.name },
    })

    return apiOk({
      key,
      url: `/api/files/${key}`,
      size: file.size,
      type: file.type,
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
