/**
 * [INPUT]: 无外部依赖 (P1 阶段接入 @clerk/nextjs)
 * [OUTPUT]: 对外提供注册页面占位
 * [POS]: (auth) 路由组的注册页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function SignUpPage() {
  // TODO: P1 替换为 <SignUp /> Clerk 组件
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Sign Up</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  )
}
