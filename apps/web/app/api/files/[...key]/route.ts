/**
 * [INPUT]: 依赖 @/lib/api/auth 的 requireAuth，依赖 @/lib/api/response 的 apiError/handleApiError，
 *          依赖 @/lib/r2 的 getR2，依赖 next/server 的 NextRequest/NextResponse
 * [OUTPUT]: 对外提供 GET /api/files/[...key] (R2 文件读取：缩略图公开，其余按用户隔离)
 * [POS]: api/files 的通用文件读取端点，被工作流缩略图、上传素材与任务输出消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api/auth'
import { apiError, handleApiError } from '@/lib/api/response'
import { getR2 } from '@/lib/r2'

type Params = { params: Promise<{ key: string[] }> }

function isPublicKey(key: string): boolean {
  return key.startsWith('thumbnails/')
}

function isAllowedPrivateKey(key: string, userId: string): boolean {
  return key.startsWith(`uploads/${userId}/`) || key.startsWith(`outputs/${userId}/`)
}

function buildCacheControl(key: string): string {
  if (key.startsWith('thumbnails/')) {
    return 'public, max-age=86400, stale-while-revalidate=604800'
  }

  return 'private, max-age=3600'
}

function applyObjectMetadata(headers: Headers, object: R2ObjectBody): void {
  const metadata = object.httpMetadata
  if (!metadata) return

  if (metadata.contentType) headers.set('Content-Type', metadata.contentType)
  if (metadata.contentLanguage) headers.set('Content-Language', metadata.contentLanguage)
  if (metadata.contentDisposition) {
    headers.set('Content-Disposition', metadata.contentDisposition)
  }
  if (metadata.contentEncoding) headers.set('Content-Encoding', metadata.contentEncoding)
  if (metadata.cacheControl) headers.set('CDN-Cache-Control', metadata.cacheControl)
}

/* ─── GET /api/files/[...key] ───────────────────────── */

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { key: segments } = await params
    const key = segments.join('/')

    if (!key) {
      return apiError('VALIDATION_FAILED', 'Missing file key', 400)
    }

    const isPublic = isPublicKey(key)

    if (!isPublic) {
      const { userId } = await requireAuth()

      if (!isAllowedPrivateKey(key, userId)) {
        return apiError('AUTH_FORBIDDEN', 'Forbidden', 403)
      }
    }

    const r2 = await getR2()
    const object = await r2.get(key)

    if (!object || !object.body) {
      return apiError('NOT_FOUND', 'File not found', 404)
    }

    const headers = new Headers()
    applyObjectMetadata(headers, object)
    headers.set('Cache-Control', buildCacheControl(key))

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/octet-stream')
    }

    return new NextResponse(object.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
