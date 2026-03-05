/**
 * [INPUT]: 依赖 next/server 的 NextResponse，依赖 @/lib/errors
 * [OUTPUT]: 对外提供 apiOk / apiError / handleApiError
 * [POS]: lib/api 的统一响应工具，被所有 API route handlers 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextResponse } from 'next/server'

import { isAppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const log = createLogger('api')

/* ─── Success ────────────────────────────────────────── */

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

/* ─── Error ──────────────────────────────────────────── */

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  )
}

/* ─── Catch-all Handler ──────────────────────────────── */

export function handleApiError(error: unknown) {
  if (isAppError(error)) {
    const status = errorCodeToStatus(error.code)
    log.error(error.message, error, error.meta)
    return apiError(error.code, error.message, status)
  }

  log.error('Unhandled API error', error instanceof Error ? error : undefined)
  return apiError('UNKNOWN', 'Internal server error', 500)
}

/* ─── Status Mapping ─────────────────────────────────── */

function errorCodeToStatus(code: string): number {
  if (code === 'AUTH_FORBIDDEN') return 403
  if (code.startsWith('AUTH_')) return 401
  if (code.startsWith('VALIDATION_')) return 400
  if (code.startsWith('CREDITS_')) return 402
  if (code === 'NOT_FOUND') return 404
  if (code === 'CONFLICT') return 409
  return 500
}
