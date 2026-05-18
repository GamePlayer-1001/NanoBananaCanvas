# apps/web/

> L2 | 父级: /CLAUDE.md

Next.js 16 前端应用 · App Router + Turbopack + RSC

## 成员清单

```
app/                — App Router 路由树 (layout/page/api，含公开首页 + 法务页 + 应用路由与 API 端点)
components/         — React 组件 (ui/ 为 shadcn 自动管理)
db/                 — D1 数据库 Schema + 种子数据 (users/workflows 等核心表 + 账户资料扩展迁移 + categories i18n 迁移)
lib/                — 工具函数与配置 (utils/query/validations/api/db/nanoid)
stores/             — Zustand 客户端状态
hooks/              — 自定义 React Hooks
types/              — 前端类型定义 (workflow/node/user)
styles/             — 额外样式文件 (reactflow.css)
services/           — API 调用层 (ai/openrouter + storage/持久化)
i18n/               — next-intl 国际化配置与消息索引 (config/routing/request/navigation/message-index/message-usage/message-usage-manifest)
messages/           — i18n 翻译文件 (en.json + zh.json，配合脚本做全键对校验/死 key 清理)
public/             — 静态资源 (brand/logo-1024.png 品牌 logo + SVG 图标 + landing/hero 真实媒体素材 + explore/banners 轮播图)
scripts/            — 项目级脚本 (Cloudflare 部署包装 + D1 迁移编排 + i18n/L10N 索引/校验/修剪/脚手架 + Stripe 试用订阅生产认领修复)
```

## 配置文件

```
next.config.ts      — Next.js 构建配置 (OpenNext Cloudflare dev init + next-intl 插件)
middleware.ts       — Edge 路由中间件 (Clerk 会话注入 + 可开关 Frontend API 代理 + 裸域规范化 + next-intl locale 检测/重写，外部 URL 隐藏语言前缀)
package.json        — 前端脚本入口 (`dev:e2e` 现改走 `scripts/dev-e2e.mjs`，为 Playwright 统一分配独立 Wrangler persist path 并先重建本地 D1 schema；Wrangler 写入根目录与 OpenNext dev 读取的 `<version>` 子目录保持严格一致，避免默认 `.wrangler/state` 锁冲突与 schema 初始化落在错误目录；`db:migrate:local` / `db:migrate:remote` 统一编排 D1 运行时迁移；`build` 默认保留 Next/Turbo 增量缓存，`build:clean` 才显式冷构建；显式声明 `@swc/helpers` / `styled-jsx` 作为 OpenNext 打包期所需运行时依赖；所有 D1/Cloudflare 相关脚本统一走项目内 `pnpm exec wrangler`，确保 Playwright 与 CI 不依赖机器全局环境)
tsconfig.json       — TypeScript 配置
eslint.config.mjs   — ESLint 9 flat config + Prettier
postcss.config.mjs  — PostCSS (@tailwindcss/postcss)
vitest.config.ts    — Vitest 单元测试配置
vitest.setup.ts     — Vitest setup (@testing-library/jest-dom)
components.json     — shadcn/ui 组件注册 (New York 风格)
open-next.config.ts — @opennextjs/cloudflare 适配 (声明 middleware 与独立 edge 路由函数的运行边界)
scripts/cloudflare-deploy.mjs — Cloudflare 生产构建/部署包装器 (修复 Windows 下 OpenNext edge config 丢失)
wrangler.jsonc      — Cloudflare Pages 部署描述 (routes/bindings + Queue producer + 生产运行时 vars)
```

## 布局约束

- `app/layout.tsx` 必须输出唯一的 `html/body` 文档骨架，并挂全局字体变量与 `globals.css`
- `app/[locale]/layout.tsx` 只承接 locale 校验、Clerk / next-intl / Query Provider 与局部脚本副作用，不再重复输出 `html/body`
- 如继续把文档骨架下放到子布局，Next dev 在冷缓存下会直接报 `Missing <html> and <body> tags`，E2E 会退化成 404 + runtime overlay

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
