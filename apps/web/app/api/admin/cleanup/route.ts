/**
 * [INPUT]: 依赖 @/lib/storage 的 cleanupExpiredOutputs，依赖 @/lib/env 的 getEnv
 * [OUTPUT]: 对外提供 POST /api/admin/cleanup (手动触发过期文件清理)
 * [POS]: api/admin 的运维端点，配合 R2 Lifecycle Rules 兜底清理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextRequest } from 'next/server'

import { apiError, apiOk, handleApiError } from '@/lib/api/response'
import { getEnv } from '@/lib/env'
import { cleanupExpiredOutputs } from '@/lib/storage'

/* ─── POST /api/admin/cleanup ──────────────────────── */

export async function POST(req: NextRequest) {
  try {
    /* Bearer token 校验 — 只允许持有 ADMIN_SECRET 的调用方 */
    const adminSecret = await getEnv('ADMIN_SECRET')
    if (!adminSecret) {
      return apiError('FORBIDDEN', 'Admin endpoint not configured', 403)
    }

    const authorization = req.headers.get('authorization')
    if (authorization !== `Bearer ${adminSecret}`) {
      return apiError('FORBIDDEN', 'Invalid admin secret', 403)
    }

    const result = await cleanupExpiredOutputs()

    return apiOk({
      message: 'Cleanup completed',
      deleted: result.deleted,
      errors: result.errors,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
