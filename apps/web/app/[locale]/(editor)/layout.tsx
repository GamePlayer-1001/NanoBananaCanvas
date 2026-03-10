/**
 * [INPUT]: 无外部依赖 (最小化布局)
 * [OUTPUT]: 对外提供全屏编辑器布局 (无侧边栏)
 * [POS]: (editor) 路由组布局，包裹画布编辑器，与 (app) 平级
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Layout ─────────────────────────────────────────── */

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen w-screen overflow-hidden">{children}</div>
}
