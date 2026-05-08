/**
 * [INPUT]: 依赖 @clerk/localizations 的 zhCN，依赖 @clerk/nextjs 的 ClerkProvider，
 *          依赖 @/i18n/config 的 locale 元数据，依赖 @/lib/seo 的 buildLocalizedPath
 * [OUTPUT]: 对外提供 ClerkShell 认证壳组件，按 locale 注入 ClerkProvider
 * [POS]: auth 模块的运行时认证壳，被 (auth)/(app)/(editor) 路由组复用，避免公开 landing 预载 Clerk
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { zhCN } from '@clerk/localizations'
import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

import { getLocaleDefinition } from '@/i18n/config'
import { buildLocalizedPath } from '@/lib/seo'

const CLERK_SIGN_IN_FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? '/workspace'
const CLERK_SIGN_UP_FALLBACK_REDIRECT_URL =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? '/workspace'
const CLERK_PROXY_URL = process.env.NEXT_PUBLIC_CLERK_PROXY_URL

interface ClerkShellProps {
  children: ReactNode
  locale: string
}

export function ClerkShell({ children, locale }: ClerkShellProps) {
  const localeDefinition = getLocaleDefinition(locale)
  const signInUrl = buildLocalizedPath(
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? '/sign-in',
    locale,
  )
  const signUpUrl = buildLocalizedPath(
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? '/sign-up',
    locale,
  )
  const signInFallbackRedirectUrl = buildLocalizedPath(
    CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
    locale,
  )
  const signUpFallbackRedirectUrl = buildLocalizedPath(
    CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
    locale,
  )

  return (
    <ClerkProvider
      localization={localeDefinition.clerkLocalizationKey === 'zhCN' ? zhCN : undefined}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      signInFallbackRedirectUrl={signInFallbackRedirectUrl}
      signUpFallbackRedirectUrl={signUpFallbackRedirectUrl}
      proxyUrl={CLERK_PROXY_URL}
      appearance={{ cssLayerName: 'clerk' }}
    >
      {children}
    </ClerkProvider>
  )
}
