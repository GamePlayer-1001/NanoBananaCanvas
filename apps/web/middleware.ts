/**
 * [INPUT]: 依赖 next-intl/middleware 的 createMiddleware，
 *          依赖 @/i18n/routing 的 routing 配置
 * [OUTPUT]: 对外提供 Next.js Edge Middleware (裸域规范化 + 本地化语言检测 + URL 前缀重写)
 * [POS]: 项目根级 Edge 中间件，Cloudflare Workers 兼容
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

/* ─── Intl Middleware ────────────────────────────────── */

const intlMiddleware = createIntlMiddleware(routing)
const CANONICAL_HOST = 'nanobananacanvas.com'
const WWW_HOST = `www.${CANONICAL_HOST}`

/* ─── Combined Middleware ────────────────────────────── */

export default function middleware(req: NextRequest) {
  if (req.nextUrl.hostname === WWW_HOST) {
    const url = req.nextUrl.clone()
    url.hostname = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
    '/(api)(.*)',
  ],
}
