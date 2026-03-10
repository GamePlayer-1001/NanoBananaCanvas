/**
 * [INPUT]: 依赖 @/components/layout/app-sidebar 的 AppSidebar，依赖 react 的 Suspense
 * [OUTPUT]: 对外提供已登录用户布局（侧边栏 + 主内容区）
 * [POS]: (app) 路由组布局，包裹 workspace/explore/workflows/video-analysis/contact
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Suspense } from 'react'

import { AppSidebar } from '@/components/layout/app-sidebar'

/* ─── Layout ─────────────────────────────────────────── */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Suspense>
        <AppSidebar />
      </Suspense>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
