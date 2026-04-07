/**
 * [INPUT]: 依赖 @clerk/nextjs 的 useClerk，依赖 @/lib/clerk-appearance 的 authAppearance
 * [OUTPUT]: 对外提供 AuthClerkCard 组件，显式挂载 Clerk 登录/注册 UI
 * [POS]: auth 的 Clerk UI 挂载器，被 sign-in/sign-up 页面消费，隔离 Clerk React 包装层的挂载时序
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useRef } from 'react'
import { useClerk } from '@clerk/nextjs'

import { authAppearance } from '@/lib/clerk-appearance'

/* ─── Component ──────────────────────────────────────── */

export function AuthClerkCard({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const clerk = useClerk()
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = mountRef.current
    if (!target || !clerk.loaded) return

    if (mode === 'sign-in') {
      clerk.mountSignIn(target, { appearance: authAppearance })
      return () => clerk.unmountSignIn(target)
    }

    clerk.mountSignUp(target, { appearance: authAppearance })
    return () => clerk.unmountSignUp(target)
  }, [clerk, mode])

  return <div ref={mountRef} className="min-h-[360px] w-full" />
}
