/**
 * [INPUT]: 无外部依赖（ClerkProvider 已在上层 [locale]/layout.tsx 提供）
 * [OUTPUT]: 对外提供认证页面居中布局
 * [POS]: (auth) 路由组布局，包裹 sign-in/sign-up Clerk 组件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      {children}
    </div>
  )
}
