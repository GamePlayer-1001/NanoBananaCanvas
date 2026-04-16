/**
 * [INPUT]: 无额外依赖
 * [OUTPUT]: 对外提供全屏动态编辑器布局 (无侧边栏)
 * [POS]: (editor) 路由组布局，包裹画布编辑器，与 (app) 平级
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const dynamic = 'force-dynamic'

/* ─── Layout ─────────────────────────────────────────── */

export default async function EditorLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  await params

  return (
    <div className="h-screen w-screen overflow-hidden">{children}</div>
  )
}
