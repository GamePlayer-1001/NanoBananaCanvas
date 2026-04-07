/**
 * [INPUT]: 依赖 @clerk/nextjs 的 ClerkProvider，依赖 @clerk/localizations 的 zhCN
 * [OUTPUT]: 对外提供 AppClerkProvider 路由级认证 Provider 包装器，固定本地化 sign-in/sign-up/fallback 地址与 Clerk 前端 API 代理
 * [POS]: components 根级基础 Provider，供 pricing/auth/app/editor 路由按需引入，统一 Clerk 客户端跳转、OAuth 回跳与注册验证边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from '@clerk/localizations'

/* ─── Constants ──────────────────────────────────────── */

const CLERK_PROXY_URL = 'https://nanobananacanvas.com/__clerk'

/* ─── Component ──────────────────────────────────────── */

export function AppClerkProvider({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  const signInUrl = `/${locale}/sign-in`
  const signUpUrl = `/${locale}/sign-up`
  const fallbackRedirectUrl = `/${locale}/workspace`

  return (
    <ClerkProvider
      proxyUrl={CLERK_PROXY_URL}
      signInFallbackRedirectUrl={fallbackRedirectUrl}
      signInUrl={signInUrl}
      signUpFallbackRedirectUrl={fallbackRedirectUrl}
      signUpUrl={signUpUrl}
      {...(locale === 'zh' ? { localization: zhCN } : {})}
      telemetry={{ disabled: true }}
    >
      {children}
    </ClerkProvider>
  )
}
