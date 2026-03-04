/**
 * [INPUT]: 无外部依赖 (P1 阶段接入 LandingNav)
 * [OUTPUT]: 对外提供 Landing Page 专用布局（深色科技风）
 * [POS]: (landing) 路由组布局，包裹 Landing/Pricing/Terms/Privacy
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="landing-dark min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]">
      {/* TODO: P1 LandingNav 导航栏 */}
      {children}
    </div>
  )
}
