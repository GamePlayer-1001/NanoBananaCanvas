/**
 * [INPUT]: 依赖 @/components/layout/app-sidebar 的 AppSidebar，
 *          依赖 @/components/layout/mobile-header 的 MobileHeader，
 *          依赖 react 的 Suspense
 * [OUTPUT]: 对外提供应用动态布局（桌面侧边栏 + 移动端抽屉菜单 + 主内容区）
 * [POS]: (app) 路由组布局，包裹 workspace/explore/workflows/video-analysis/contact
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Suspense } from 'react'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileHeader } from '@/components/layout/mobile-header'

export const dynamic = 'force-dynamic'

/* ─── Layout ─────────────────────────────────────────── */

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  await params

  return (
    <div className="flex h-screen">
      {/* 桌面侧边栏 (lg+) */}
      <Suspense>
        <div className="hidden lg:flex">
          <AppSidebar />
        </div>
      </Suspense>

      {/* 主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 移动端顶栏 (< lg) */}
        <Suspense>
          <MobileHeader />
        </Suspense>

        <main data-scrollbar-host="app-main" className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
