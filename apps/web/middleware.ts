/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 clerkMiddleware / createRouteMatcher，
 *          依赖 next-intl/middleware 的 createMiddleware，
 *          依赖 @/i18n/routing 的 routing 配置
 * [OUTPUT]: 对外提供 Next.js Edge Middleware (认证 + 语言检测 + URL 前缀重写)
 * [POS]: 项目根级 Edge 中间件，Cloudflare Workers 兼容 (从 proxy.ts 迁移)
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

/* ─── Intl Middleware ────────────────────────────────── */

const intlMiddleware = createIntlMiddleware(routing)

/* ─── Route Matchers ─────────────────────────────────── */

const isProtectedRoute = createRouteMatcher([
  '/:locale/(app)(.*)',
  '/:locale/workspace(.*)',
])

/* ─── Combined Proxy ─────────────────────────────────── */

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
  return intlMiddleware(req)
})

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
