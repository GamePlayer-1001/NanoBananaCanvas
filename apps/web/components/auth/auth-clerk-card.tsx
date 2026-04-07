/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignIn/SignUp，依赖 @/lib/clerk-appearance 的 authAppearance
 * [OUTPUT]: 对外提供 AuthClerkCard 组件，渲染 Clerk 官方登录/注册 UI
 * [POS]: auth 的 Clerk UI 适配器，被 sign-in/sign-up 页面消费，统一登录/注册外观入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { SignIn, SignUp } from '@clerk/nextjs'

import { authAppearance } from '@/lib/clerk-appearance'

/* ─── Component ──────────────────────────────────────── */

export function AuthClerkCard({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  if (mode === 'sign-in') {
    return <SignIn appearance={authAppearance} />
  }

  return <SignUp appearance={authAppearance} />
}
