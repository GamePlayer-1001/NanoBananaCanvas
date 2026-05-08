/**
 * [INPUT]: 依赖 @/components/auth/clerk-shell 的 ClerkShell
 * [OUTPUT]: 对外提供全屏动态编辑器布局 (无侧边栏)，并为画布注入 Clerk 认证上下文
 * [POS]: (editor) 路由组布局，包裹画布编辑器，与 (app) 平级
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { ClerkShell } from '@/components/auth/clerk-shell'

export const dynamic = 'force-dynamic'

/* ─── Layout ─────────────────────────────────────────── */

export default async function EditorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <ClerkShell locale={locale}>
      <div className="h-screen w-screen overflow-hidden">{children}</div>
    </ClerkShell>
  )
}
