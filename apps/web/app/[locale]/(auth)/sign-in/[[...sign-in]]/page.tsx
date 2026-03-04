/**
 * [INPUT]: 无外部依赖 (P1 阶段接入 @clerk/nextjs)
 * [OUTPUT]: 对外提供登录页面占位
 * [POS]: (auth) 路由组的登录页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function SignInPage() {
  // TODO: P1 替换为 <SignIn /> Clerk 组件
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Sign In</h1>
      <p className="mt-2 text-muted-foreground">Coming soon</p>
    </div>
  )
}
