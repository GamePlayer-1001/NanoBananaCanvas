/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 checkRateLimit / rateLimitResponse / withRateLimit
 * [POS]: lib/api 的内存滑动窗口限流器，被 AI/Billing/Tasks 等高成本路由消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Types ──────────────────────────────────────────── */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

/* ─── Store ──────────────────────────────────────────── */

const store = new Map<string, RateLimitEntry>()

// 定期清理过期条目，防止内存泄漏
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key)
  }
}

/* ─── Core ───────────────────────────────────────────── */

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(identifier)

  // 窗口过期或首次请求 → 重置
  if (!entry || now >= entry.resetAt) {
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  // 窗口内递增
  entry.count++

  if (entry.count > limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/* ─── Response ───────────────────────────────────────── */

/**
 * 便捷限流守卫 — 返回 null 表示放行，返回 Response 表示拦截
 * 用法: const blocked = withRateLimit(req, 'ai-execute', 20, 60_000); if (blocked) return blocked;
 */
export function withRateLimit(
  req: Request,
  action: string,
  limit: number,
  windowMs: number,
): Response | null {
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const rl = checkRateLimit(`${action}:${ip}`, limit, windowMs)
  return rl.ok ? null : rateLimitResponse(rl.resetAt)
}

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