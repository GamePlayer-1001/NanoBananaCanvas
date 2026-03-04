# Nano Banana Canvas — 可视化 AI 工作流编排平台

对标 martini.art · Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + ReactFlow + Zustand + Hono + Cloudflare

## 目录结构

```
apps/web/        — Next.js 16 前端 (App Router, i18n, SSR/SSG)
apps/worker/     — Hono API Worker (Cloudflare Workers, D1/R2/Queue)
packages/shared/ — 共享类型、常量、工具函数
e2e/             — Playwright E2E 测试
.md/             — 项目规划文档 (非代码)
```

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16.1.6 (App Router + Turbopack) |
| UI | React 19 + shadcn/ui (Lux 主题) + Tailwind CSS v4 |
| 画布 | @xyflow/react v12 (ReactFlow) |
| 状态 | Zustand v5 (客户端) + TanStack Query v5 (服务端) |
| 表单 | React Hook Form + Zod v4 |
| API | Hono (Cloudflare Workers) |
| 数据库 | Cloudflare D1 (SQLite) |
| 存储 | Cloudflare R2 |
| 认证 | Clerk (P1 接入) |
| 支付 | Stripe (P1 接入) |
| i18n | next-intl (P1 接入) |
| 部署 | @opennextjs/cloudflare → Cloudflare Pages |
| 测试 | Vitest (单元) + Playwright (E2E) |

## 开发命令

```bash
pnpm dev              # 启动所有开发服务器 (Turborepo 并行)
pnpm build            # 构建所有包
pnpm lint             # ESLint 检查 (eslint .)
pnpm test             # Vitest 单元测试
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 检查 (CI 用)
```

## 架构约定

- **Monorepo**: pnpm workspace + Turborepo
- **路由**: `[locale]/(landing|auth|app)` 三路由组
- **品牌色**: Indigo-500 (#6366F1)
- **文档**: GEB 分形文档系统 (L1/L2/L3 三层)
- **文件头部**: 所有业务文件必须有 L3 `[INPUT]/[OUTPUT]/[POS]/[PROTOCOL]` 注释

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
