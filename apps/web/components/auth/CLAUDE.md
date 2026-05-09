# apps/web/components/auth/

> L2 | 父级: apps/web/components/CLAUDE.md

成员清单

auth-shell.tsx: 认证双栏壳组件，负责品牌视觉区、可选说明标题区、表单卡片区与登录/注册变体布局
clerk-shell.tsx: Clerk 运行时认证壳，按 locale 注入 ClerkProvider，并支持按路由组切换 `prefetchUI`，仅给 auth/app/editor 受保护路由组复用
sign-out-action.tsx: 自定义登出动作组件，负责清空客户端 query 缓存并强制整页回跳到安全公开页

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
