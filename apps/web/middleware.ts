/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 clerkMiddleware / createRouteMatcher，
 *          依赖 next-intl/middleware 的 createMiddleware，
 *          依赖 @/i18n/routing 的 routing 配置
 * [OUTPUT]: 对外提供 Next.js Edge Middleware (Clerk 认证 + 本地化登录重定向 + 语言检测 + URL 前缀重写)
 * [POS]: 项目根级 Edge 中间件，Cloudflare Workers 兼容
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n/routing'

/* ─── Intl Middleware ────────────────────────────────── */

const intlMiddleware = createIntlMiddleware(routing)

/* ─── Route Matchers ─────────────────────────────────── */

const isProtectedRoute = createRouteMatcher([
  '/:locale/(app)(.*)',
  '/:locale/workspace(.*)',
  '/:locale/canvas(.*)',
])

/* ─── Clerk Local Auth URLs ──────────────────────────── */

function getAuthUrls(req: NextRequest) {
  const firstSegment = req.nextUrl.pathname.split('/')[1]
  const locale = routing.locales.includes(firstSegment as (typeof routing.locales)[number])
    ? firstSegment
    : routing.defaultLocale

  return {
    signInUrl: new URL(`/${locale}/sign-in`, req.url).toString(),
    signUpUrl: new URL(`/${locale}/sign-up`, req.url).toString(),
  }
}

/* ─── Combined Middleware ────────────────────────────── */

export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }

  if (isProtectedRoute(req)) {
    await auth.protect({ unauthenticatedUrl: getAuthUrls(req).signInUrl })
  }
  return intlMiddleware(req)
}, getAuthUrls)

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
}
