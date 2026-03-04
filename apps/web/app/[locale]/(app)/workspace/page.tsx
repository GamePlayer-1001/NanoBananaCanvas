/**
 * [INPUT]: 无外部依赖 (P1 阶段接入认证 + 数据库查询)
 * [OUTPUT]: 对外提供工作空间列表页面占位
 * [POS]: (app) 路由组的创作空间首页，SSR 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function WorkspacePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">My Workflows</h1>
      <p className="text-muted-foreground mt-2">Your creative workspace — coming soon</p>
    </div>
  )
}
