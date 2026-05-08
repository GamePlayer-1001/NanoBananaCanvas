/**
 * [INPUT]: 依赖 react 的 ReactNode，依赖 @/components/auth/clerk-shell 的 ClerkShell
 * [OUTPUT]: 对外提供认证路由组布局，统一暗色背景与最小容器，并为 Clerk 页面注入认证上下文
 * [POS]: [locale]/(auth) 路由组的结构壳层，被 sign-in/sign-up 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ClerkShell } from '@/components/auth/clerk-shell'

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <ClerkShell locale={locale}>
      <div className="min-h-screen bg-[#09090d] text-white">{children}</div>
    </ClerkShell>
  )
}
