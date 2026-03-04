/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供全局 404 页面
 * [POS]: App Router 的全局 not-found 处理
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
    </div>
  )
}
