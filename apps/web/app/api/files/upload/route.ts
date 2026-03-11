/**
 * [INPUT]: 依赖 @/lib/api/auth 的 requireAuth，依赖 @/lib/api/rate-limit 的 withRateLimit，
 *          依赖 @/lib/r2 的 getR2，依赖 @/lib/storage 的 generateUploadPath/getStorageUsage，
 *          依赖 @/lib/validations/upload
 * [OUTPUT]: 对外提供 POST /api/files/upload (multipart → R2, 含配额检查)
 * [POS]: api/files 的上传端点，被前端 useUpload hook 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { withRateLimit } from '@/lib/api/rate-limit'
import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getR2 } from '@/lib/r2'
import { generateUploadPath, getStorageUsage } from '@/lib/storage'
import { UPLOAD_LIMITS } from '@/lib/validations/upload'

/* ─── POST /api/files/upload ────────────────────────── */

export async function POST(req: NextRequest) {
  // 限流: 30 req/min per IP (文件上传)
  const blocked = withRateLimit(req, 'file-upload', 30, 60_000)
  if (blocked) return blocked

  try {
    const { userId } = await requireAuth()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return apiError('VALIDATION_FAILED', 'No file provided', 400)
    }

    /* ── Validate type & size ────────────────────────── */
    if (file.size > UPLOAD_LIMITS.maxSizeBytes) {
      const maxMB = UPLOAD_LIMITS.maxSizeBytes / 1024 / 1024
      return apiError('VALIDATION_FAILED', `File exceeds ${maxMB}MB limit`, 400)
    }

    if (!UPLOAD_LIMITS.allowedTypes.has(file.type)) {
      return apiError('VALIDATION_FAILED', `Unsupported file type: ${file.type}`, 400)
    }

    /* ── Check storage quota (R2-004) ────────────────── */
    const usage = await getStorageUsage(userId)
    if (usage.usedBytes + file.size > usage.limitBytes) {
      return apiError('QUOTA_EXCEEDED', `Storage quota exceeded (${usage.usedPercent}% used)`, 403)
    }

    /* ── Upload to R2 (R2-001 path convention) ───────── */
    const ext = file.name.split('.').pop() ?? 'bin'
    const key = generateUploadPath(userId, ext)

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