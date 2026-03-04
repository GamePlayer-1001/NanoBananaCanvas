# apps/web/
> L2 | 父级: /CLAUDE.md

Next.js 16 前端应用 · App Router + Turbopack + RSC

## 成员清单

```
app/                — App Router 路由树 (layout/page/api)
components/         — React 组件 (ui/ 为 shadcn 自动管理)
lib/                — 工具函数与配置 (utils/query/validations)
stores/             — Zustand 客户端状态
hooks/              — 自定义 React Hooks
types/              — 前端类型定义 (workflow/node/user)
styles/             — 额外样式文件 (reactflow.css)
services/           — API 调用层 (P1)
messages/           — i18n 翻译文件 (P1)
public/             — 静态资源
```

## 配置文件

```
next.config.ts      — Next.js 构建配置 (Clerk 图片白名单)
tsconfig.json       — TypeScript 配置
eslint.config.mjs   — ESLint 9 flat config + Prettier
postcss.config.mjs  — PostCSS (@tailwindcss/postcss)
vitest.config.ts    — Vitest 单元测试配置
vitest.setup.ts     — Vitest setup (@testing-library/jest-dom)
components.json     — shadcn/ui 组件注册 (New York 风格)
open-next.config.ts — @opennextjs/cloudflare 适配
wrangler.jsonc      — Cloudflare Pages 部署描述
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
