/**
 * [INPUT]: 无外部依赖 (P1 阶段接入 AppSidebar/TopBar)
 * [OUTPUT]: 对外提供已登录用户布局（侧边栏 + 顶部栏）
 * [POS]: (app) 路由组布局，包裹 workspace/explore/profile/billing
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* TODO: P1 AppSidebar */}
      <div className="flex flex-1 flex-col">
        {/* TODO: P1 TopBar */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
