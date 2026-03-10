# (editor)/
> L2 | 父级: app/[locale]/CLAUDE.md

## 职责

全屏编辑器路由组，无侧边栏。与 (app) 平级，共享 [locale]/layout.tsx 的 Provider 链。

## 成员清单

layout.tsx: 极简全屏容器 `h-screen w-screen`，不包含 AppSidebar
canvas/[id]/page.tsx: 画布编辑器页面，CSR，从 D1 加载工作流数据注入 FlowStore + ReactFlow

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
