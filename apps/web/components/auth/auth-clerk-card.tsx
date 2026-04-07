/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignIn/SignUp，依赖 next-intl 的 useLocale，
 *          依赖 @/lib/clerk-appearance 的 authAppearance
 * [OUTPUT]: 对外提供 AuthClerkCard 组件，渲染 Clerk 官方登录/注册 UI，并显式绑定本地化认证路径
 * [POS]: auth 的 Clerk UI 适配器，被 sign-in/sign-up 页面消费，统一登录/注册与 OAuth 回跳入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { SignIn, SignUp } from '@clerk/nextjs'
import { useLocale } from 'next-intl'

import { authAppearance } from '@/lib/clerk-appearance'

/* ─── Constants ──────────────────────────────────────── */

const AUTH_FALLBACK_SEGMENT = 'workspace'

/* ─── Component ──────────────────────────────────────── */

export function AuthClerkCard({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const locale = useLocale()
  const signInUrl = `/${locale}/sign-in`
  const signUpUrl = `/${locale}/sign-up`
  const fallbackRedirectUrl = `/${locale}/${AUTH_FALLBACK_SEGMENT}`

  if (mode === 'sign-in') {
    return (
      <SignIn
        appearance={authAppearance}
        fallbackRedirectUrl={fallbackRedirectUrl}
        path={signInUrl}
        routing="path"
        signUpUrl={signUpUrl}
      />
    )
  }

  return (
    <SignUp
      appearance={authAppearance}
      fallbackRedirectUrl={fallbackRedirectUrl}
      path={signUpUrl}
      routing="path"
      signInUrl={signInUrl}
    />
  )
}
