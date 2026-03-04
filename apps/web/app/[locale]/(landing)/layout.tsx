/**
 * [INPUT]: 依赖 @/components/layout/landing-nav 的 LandingNav
 * [OUTPUT]: 对外提供 Landing Page 专用布局（深色科技风 + 导航栏）
 * [POS]: (landing) 路由组布局，包裹 Landing/Pricing/Terms/Privacy
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { LandingNav } from '@/components/layout/landing-nav'

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-dark min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]">
      <LandingNav />
      {children}
    </div>
  )
}
