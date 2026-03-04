/**
 * [INPUT]: 依赖 next-intl/middleware 的 createMiddleware，依赖 @/i18n/routing
 * [OUTPUT]: 对外提供 Next.js 16 路由代理 (语言检测 + URL 前缀重写)
 * [POS]: 项目根级网络边界代理，Next.js 16 自动加载
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
