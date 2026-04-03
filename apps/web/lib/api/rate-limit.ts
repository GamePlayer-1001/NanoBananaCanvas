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

const KV_MIN_TTL_SECONDS = 60

function getKvExpirationTtl(ms: number): number {
  return Math.max(Math.ceil(ms / 1000), KV_MIN_TTL_SECONDS)
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
      expirationTtl: getKvExpirationTtl(windowMs + 1000),
    })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  // 窗口内递增
  // NOTE: KV get+put 非原子操作，极端并发下可能多放行 1-2 个请求
  //       这是 KV 限流的固有局限，对当前业务场景可接受
  const count = raw.count + 1
  const remainingMs = raw.resetAt - now
  const ttlSeconds = getKvExpirationTtl(remainingMs)
  await kv.put(key, JSON.stringify({ count, resetAt: raw.resetAt }), {
    expirationTtl: ttlSeconds,
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
