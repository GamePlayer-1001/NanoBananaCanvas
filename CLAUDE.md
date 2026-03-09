# Nano Banana Canvas — 可视化 AI 工作流编排平台

对标 martini.art · Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + ReactFlow + Zustand + Hono + Cloudflare

## 目录结构

```
apps/web/            — Next.js 16 前端 (App Router, i18n, SSR/SSG)
apps/worker/         — Hono API Worker (Cloudflare Workers, D1/R2/Queue)
packages/shared/     — 共享类型、常量、工具函数
e2e/                 — Playwright E2E 测试
.md/                 — 项目规划文档 (非代码)
.github/workflows/   — CI/CD 管道 (GitHub Actions → Cloudflare)
```

## 技术栈

| 层     | 技术                                              |
| ------ | ------------------------------------------------- |
| 框架   | Next.js 16.1.6 (App Router + Turbopack)           |
| UI     | React 19 + shadcn/ui (Lux 主题) + Tailwind CSS v4 |
| 画布   | @xyflow/react v12 (ReactFlow)                     |
| 状态   | Zustand v5 (客户端) + TanStack Query v5 (服务端)  |
| 表单   | React Hook Form + Zod v4                          |
| API    | Hono (Cloudflare Workers)                         |
| 数据库 | Cloudflare D1 (SQLite)                            |
| 存储   | Cloudflare R2                                     |
| 认证   | Clerk (P1 接入)                                   |
| 支付   | Stripe (P1 接入)                                  |
| i18n   | next-intl (P1 接入)                               |
| 部署   | @opennextjs/cloudflare → Cloudflare Workers        |
| CI/CD  | GitHub Actions → wrangler deploy                   |
| 测试   | Vitest (单元) + Playwright (E2E)                  |

## 开发命令

```bash
pnpm dev              # 启动所有开发服务器 (Turborepo 并行)
pnpm build            # 构建所有包
pnpm lint             # ESLint 检查 (eslint .)
pnpm test             # Vitest 单元测试
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 检查 (CI 用)
```

## 前端页面路由

```
[locale]/(landing)/           — Landing Page (Hero + CTA + Footer)
[locale]/(auth)/sign-in       — 分屏登录页 (左玫瑰图 + 右 Clerk 卡片)
[locale]/(auth)/sign-up       — 分屏注册页
[locale]/(app)/explore        — 社区广场 (视频卡片网格 + 标签筛选)
[locale]/(app)/workflows      — 工作流分享 (分类 + 搜索 + 工作流卡片)
[locale]/(app)/video-analysis — 视频分析 (上传 + AI 模型 + 历史)
[locale]/(app)/workspace      — 工作区 (项目卡片网格 + 新建弹窗)
[locale]/(app)/workspace/[id] — 画布编辑器 (ReactFlow)
[locale]/(app)/elements       — 元素库 (占位)
```

## 架构约定

- **Monorepo**: pnpm workspace + Turborepo
- **路由**: `[locale]/(landing|auth|app)` 三路由组
- **Sidebar**: 200px 固定宽度，导航/工作区/底部链接/用户 Footer
- **品牌色**: Indigo-500 (#6366F1)
- **文档**: GEB 分形文档系统 (L1/L2/L3 三层)
- **文件头部**: 所有业务文件必须有 L3 `[INPUT]/[OUTPUT]/[POS]/[PROTOCOL]` 注释
- **CI/CD**: push main → GitHub Actions 自动构建 + 部署 (Web + Worker)
- **域名**: nanobananacanvas.com → Cloudflare Workers (wrangler routes)

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
