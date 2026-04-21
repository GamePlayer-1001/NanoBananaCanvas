/**
 * [INPUT]: 依赖 @/i18n/routing 的 routing 配置
 * [OUTPUT]: 对外提供 resolveSafeAuthRedirect() / getDefaultWorkspaceRedirect() / getDefaultSignOutRedirect()
 * [POS]: lib/auth 的安全回跳策略层，统一约束登录成功后的站内白名单跳转与登出后的安全落点
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { routing } from '@/i18n/routing'

const REDIRECT_ALLOWLIST = [
  /^\/account$/,
  /^\/workspace$/,
  /^\/workflows$/,
  /^\/video-analysis$/,
  /^\/explore$/,
  /^\/canvas\/[^/]+$/,
] as const

function stripLocalePrefix(pathname: string) {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) {
      return '/'
    }

    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1)
    }
  }

  return pathname
}

function localizePath(locale: string, path: string) {
  return `/${locale}${path === '/' ? '' : path}`
}

function parseRelativeUrl(candidate: string) {
  const url = new URL(candidate, 'https://nanobananacanvas.local')
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  }
}

function isAllowedPath(pathname: string) {
  return REDIRECT_ALLOWLIST.some((pattern) => pattern.test(pathname))
}

export function getDefaultWorkspaceRedirect(locale: string) {
  return localizePath(locale, '/workspace')
}

export function getDefaultSignOutRedirect(locale: string) {
  return localizePath(locale, '/')
}

export function resolveSafeAuthRedirect(locale: string, candidate?: string | null) {
  if (!candidate) {
    return getDefaultWorkspaceRedirect(locale)
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return getDefaultWorkspaceRedirect(locale)
  }

  try {
    const { pathname, search, hash } = parseRelativeUrl(candidate)
    const normalizedPath = stripLocalePrefix(pathname)

    if (!isAllowedPath(normalizedPath)) {
      return getDefaultWorkspaceRedirect(locale)
    }

    return `${localizePath(locale, normalizedPath)}${search}${hash}`
  } catch {
    return getDefaultWorkspaceRedirect(locale)
  }
}
