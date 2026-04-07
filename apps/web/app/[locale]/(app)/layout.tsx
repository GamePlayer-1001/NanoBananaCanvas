/**
 * [INPUT]: 依赖 @/components/layout/app-sidebar 的 AppSidebar，
 *          依赖 @/components/layout/mobile-header 的 MobileHeader，
 *          依赖 react 的 Suspense，依赖 @/components/clerk-provider 的 AppClerkProvider
 * [OUTPUT]: 对外提供已登录用户动态布局（路由级 Clerk Provider + 桌面侧边栏 + 移动端抽屉菜单 + 主内容区）
 * [POS]: (app) 路由组布局，包裹 workspace/explore/workflows/video-analysis/contact 并提供认证上下文
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { Suspense } from 'react'

import { AppClerkProvider } from '@/components/clerk-provider'
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
  const { locale } = await params

  return (
    <AppClerkProvider locale={locale}>
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

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AppClerkProvider>
  )
}
