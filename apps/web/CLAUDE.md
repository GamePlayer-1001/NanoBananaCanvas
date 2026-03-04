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
next.config.ts      — Next.js 构建配置
tsconfig.json       — TypeScript 配置
eslint.config.mjs   — ESLint flat config + Prettier
postcss.config.mjs  — PostCSS (Tailwind v4)
vitest.config.ts    — Vitest 单元测试
components.json     — shadcn/ui 组件注册
open-next.config.ts — Cloudflare 适配
wrangler.jsonc      — Cloudflare Pages 部署
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
