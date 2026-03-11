/**
 * [INPUT]: 依赖 @/lib/kv 的 getKV
 * [OUTPUT]: 对外提供 checkRateLimit / rateLimitResponse / withRateLimit
 * [POS]: lib/api 的 KV 滑动窗口限流器，被 AI/Billing/Tasks/Upload 等高成本路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { getKV } from '@/lib/kv'

/* ─── Types ──────────────────────────────────────────── */

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/* ─── Core (KV-backed sliding window) ────────────────── */

export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const kv = await getKV()
  const key = `rl:${identifier}`
  const now = Date.now()

  const raw = await kv.get<{ count: number; resetAt: number }>(key, 'json')

  // 窗口过期或首次请求 → 重置
  if (!raw || now >= raw.resetAt) {
    const resetAt = now + windowMs
    await kv.put(key, JSON.stringify({ count: 1, resetAt }), {
      expirationTtl: Math.ceil(windowMs / 1000) + 1,
    })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  // 窗口内递增
  const count = raw.count + 1
  const ttlSeconds = Math.ceil((raw.resetAt - now) / 1000) + 1
  await kv.put(key, JSON.stringify({ count, resetAt: raw.resetAt }), {
    expirationTtl: Math.max(ttlSeconds, 1),
  })

  if (count > limit) {
    return { ok: false, remaining: 0, resetAt: raw.resetAt }
  }

  return { ok: true, remaining: limit - count, resetAt: raw.resetAt }
}

/* ─── Response ───────────────────────────────────────── */

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)

  return new Response(
    JSON.stringify({
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.max(1, retryAfter)),
      },
    },
  )
}

/**
 * 便捷限流守卫 — 返回 null 表示放行，返回 Response 表示拦截
 * 用法: const blocked = await withRateLimit(req, 'ai-execute', 20, 60_000); if (blocked) return blocked;
 */
export async function withRateLimit(
  req: Request,
  action: string,
  limit: number,
  windowMs: number,
): Promise<Response | null> {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = await checkRateLimit(`${action}:${ip}`, limit, windowMs)
  return rl.ok ? null : rateLimitResponse(rl.resetAt)
}