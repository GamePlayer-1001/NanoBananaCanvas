/**
 * [INPUT]: 无外部依赖 (P1 阶段接入 Clerk)
 * [OUTPUT]: 对外提供认证页面布局（左右分栏）
 * [POS]: (auth) 路由组布局，包裹 sign-in/sign-up
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {children}
    </div>
  )
}
