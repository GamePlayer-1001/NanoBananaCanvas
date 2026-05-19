/**
 * [INPUT]: 依赖 next/server 的 NextResponse，依赖 @/lib/errors
 * [OUTPUT]: 对外提供 apiOk / apiError / handleApiError / withBodyLimit / withPublicCache
 * [POS]: lib/api 的统一响应工具，被所有 API route handlers 消费，并统一公开接口缓存响应头
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { NextResponse } from 'next/server'

import { ZodError } from 'zod'

import { isAppError } from '@/lib/errors'
import { createLogger } from '@/lib/logger'

const log = createLogger('api')

/* ─── Success ────────────────────────────────────────── */

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

/* ─── Public Cache ──────────────────────────────────── */

export interface PublicCacheOptions {
  sMaxAge: number
  staleWhileRevalidate?: number
}

export function withPublicCache(response: NextResponse, options: PublicCacheOptions): NextResponse {
  const staleWhileRevalidate = options.staleWhileRevalidate ?? options.sMaxAge
  response.headers.set(
    'Cache-Control',
    `public, s-maxage=${options.sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  )
  return response
}

/* ─── Error ──────────────────────────────────────────── */

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code, message } },
    { status },
  )
}

/* ─── Body Size Guard ───────────────────────────────── */

const DEFAULT_MAX_BODY = 1_048_576 // 1 MB

/**
 * Pre-parse body size guard — returns 413 if Content-Length exceeds limit.
 * Usage: const blocked = withBodyLimit(req); if (blocked) return blocked;
 */
export function withBodyLimit(req: Request, maxBytes = DEFAULT_MAX_BODY): Response | null {
  const cl = req.headers.get('content-length')
  if (cl && parseInt(cl, 10) > maxBytes) {
    return NextResponse.json(
      { ok: false, error: { code: 'PAYLOAD_TOO_LARGE', message: `Request body exceeds ${Math.round(maxBytes / 1024)}KB limit` } },
      { status: 413 },
    )
  }
  return null
}

/* ─── Catch-all Handler ──────────────────────────────── */

export function handleApiError(error: unknown) {
  if (isAppError(error)) {
    const status = errorCodeToStatus(error.code)

    // 认证失败是高频预期分支，不记录 error 级噪音。
    if (error.code.startsWith('AUTH_')) {
      return apiError(error.code, error.message, status)
    }

    log.error(error.message, error, error.meta)
    return apiError(error.code, error.message, status)
  }

  /* Zod 校验失败 → 400 (非 500) */
  if (error instanceof ZodError) {
    const msg = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    return apiError('VALIDATION_FAILED', msg, 400)
  }

  log.error('Unhandled API error', error instanceof Error ? error : undefined)
  return apiError('UNKNOWN', 'Internal server error', 500)
}

/* ─── Status Mapping ─────────────────────────────────── */

const EXACT_CODE_STATUS = new Map<string, number>([
  ['AUTH_FORBIDDEN', 403],
  ['AI_RATE_LIMITED', 429],
  ['AI_QUOTA_EXCEEDED', 402],
  ['AI_MODEL_UNAVAILABLE', 503],
  ['AI_PROVIDER_ERROR', 503],
  ['UPLOAD_TOO_LARGE', 413],
  ['TASK_CONCURRENCY_EXCEEDED', 429],
  ['TASK_NOT_FOUND', 404],
  ['BILLING_RATE_LIMITED', 429],
  ['BILLING_PAYMENT_DECLINED', 402],
  ['BILLING_CREDITS_INSUFFICIENT', 402],
  ['BILLING_TRIAL_ALREADY_USED', 409],
  ['BILLING_SUBSCRIPTION_ALREADY_ACTIVE', 409],
  ['BILLING_NETWORK_ERROR', 503],
  ['BILLING_PROVIDER_ERROR', 502],
  ['BILLING_PRICE_NOT_CONFIGURED', 503],
  ['NOT_FOUND', 404],
  ['CONFLICT', 409],
])

const PREFIX_STATUS: [string, number][] = [
  ['AUTH_', 401],
  ['VALIDATION_', 400],
  ['AI_', 502],
  ['UPLOAD_', 400],
  ['TASK_', 400],
  ['BILLING_', 400],
]

function errorCodeToStatus(code: string): number {
  const exact = EXACT_CODE_STATUS.get(code)
  if (exact !== undefined) return exact

  for (const [prefix, status] of PREFIX_STATUS) {
    if (code.startsWith(prefix)) return status
  }

  return 500
}
