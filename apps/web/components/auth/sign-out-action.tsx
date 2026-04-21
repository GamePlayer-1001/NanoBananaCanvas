/**
 * [INPUT]: 依赖 react 的 useState，依赖 @clerk/nextjs 的 useClerk，
 *          依赖 @tanstack/react-query 的 useQueryClient，
 *          依赖 next-intl 的 useTranslations，依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 SignOutAction 自定义登出按钮组件
 * [POS]: auth 的登出动作封装层，被侧边栏与账户页复用，负责清空客户端 query 缓存并强制整页回跳
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface SignOutActionProps {
  redirectUrl: string
  className?: string
  children: React.ReactNode
}

export function SignOutAction({
  redirectUrl,
  className,
  children,
}: SignOutActionProps) {
  const { signOut } = useClerk()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    try {
      await queryClient.cancelQueries()

      // 登出前直接清空客户端缓存，避免旧 session 数据在软跳转期间残留一拍。
      queryClient.clear()

      await signOut()

      // 使用整页跳转而不是软导航，确保 Clerk cookie、RSC 树和浏览器内存态一起收口。
      window.location.assign(redirectUrl)
    } catch {
      setIsSigningOut(false)
      toast.error(t('unexpectedError'))
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={className}
    >
      {children}
    </button>
  )
}
