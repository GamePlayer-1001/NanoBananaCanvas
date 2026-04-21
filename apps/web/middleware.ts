/**
 * [INPUT]: 依赖 @clerk/nextjs/server 的 clerkMiddleware，
 *          依赖 next-intl/middleware 的 createMiddleware，
 *          依赖 @/i18n/routing 的 routing 配置
 * [OUTPUT]: 对外提供 Next.js Edge Middleware (Clerk 会话注入 + 可开关 Frontend API 代理 + 裸域规范化 + 本地化语言检测 + URL 前缀重写)
 * [POS]: 项目根级 Edge Middleware 入口，负责为服务端 auth() 提供 Clerk 会话上下文，同时保持现有 OpenNext Cloudflare 兼容边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { clerkMiddleware } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

/* ─── Intl Middleware ────────────────────────────────── */

const intlMiddleware = createIntlMiddleware(routing)
const CANONICAL_HOST = 'nanobananacanvas.com'
const WWW_HOST = `www.${CANONICAL_HOST}`
const CLERK_PROXY_PATH = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

function resolveClerkProxyPath() {
  if (!CLERK_PROXY_PATH) {
    return null
  }

  if (!CLERK_PROXY_PATH.startsWith('/')) {
    return null
  }

  return CLERK_PROXY_PATH
}

/* ─── Combined Middleware ────────────────────────────── */

export default clerkMiddleware(
  async (_auth, req: NextRequest) => {
    if (req.nextUrl.hostname === WWW_HOST) {
      const url = req.nextUrl.clone()
      url.hostname = CANONICAL_HOST
      return NextResponse.redirect(url, 308)
    }

    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    return intlMiddleware(req)
  },
  () => {
    const proxyPath = resolveClerkProxyPath()

    return {
      frontendApiProxy: proxyPath
        ? {
            enabled: true,
            path: proxyPath,
          }
        : undefined,
    }
  },
)

export const config = {
  matcher: [
    '/((?!_next|_vercel|.*\\..*).*)',
    '/(api)(.*)',
    '/(__clerk)(.*)',
  ],
}
