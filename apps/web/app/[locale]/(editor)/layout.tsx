/**
 * [INPUT]: 依赖 @/components/clerk-provider 的 AppClerkProvider
 * [OUTPUT]: 对外提供全屏编辑器布局 (路由级 Clerk Provider + 无侧边栏)
 * [POS]: (editor) 路由组布局，包裹画布编辑器，与 (app) 平级并提供认证上下文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AppClerkProvider } from '@/components/clerk-provider'

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
    <AppClerkProvider locale={locale}>
      <div className="h-screen w-screen overflow-hidden">{children}</div>
    </AppClerkProvider>
  )
}
