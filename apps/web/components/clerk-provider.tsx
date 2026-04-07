/**
 * [INPUT]: 依赖 @clerk/nextjs 的 ClerkProvider，依赖 @clerk/localizations 的 zhCN
 * [OUTPUT]: 对外提供 AppClerkProvider 路由级认证 Provider 包装器，固定本地化 sign-in/sign-up 地址与 Clerk 前端代理
 * [POS]: components 根级基础 Provider，供 pricing/auth/app/editor 路由按需引入，统一 Clerk 客户端跳转边界
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { zhCN } from '@clerk/localizations'

/* ─── Component ──────────────────────────────────────── */

export function AppClerkProvider({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      proxyUrl="/__clerk"
      {...(locale === 'zh' ? { localization: zhCN } : {})}
      telemetry={{ disabled: true }}
    >
      {children}
    </ClerkProvider>
  )
}
