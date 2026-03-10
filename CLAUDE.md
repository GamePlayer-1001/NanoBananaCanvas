# Nano Banana Canvas — 可视化 AI 工作流编排平台

对标 martini.art · Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + ReactFlow + Zustand + Hono + Cloudflare

## 目录结构

```
apps/web/            — Next.js 16 前端 (App Router, i18n, SSR/SSG)
apps/worker/         — Hono Worker (P2 骨架, 当前仅 /health, Queues 消费端预留)
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
| API    | Next.js Route Handlers (31 端点, 全部在 apps/web) |
| 数据库 | Cloudflare D1 (SQLite, 15 张表)                   |
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
[locale]/(landing)/           — Landing Page (交互式 Hero Canvas + Footer)
[locale]/(landing)/pricing    — 定价页 (Free/Pro 双档 + 周/月/年切换)
[locale]/(landing)/privacy    — 隐私政策
[locale]/(landing)/terms      — 服务条款
[locale]/(auth)/sign-in       — 分屏登录页 (左玫瑰图 + 右 Clerk 卡片)
[locale]/(auth)/sign-up       — 分屏注册页
[locale]/(app)/explore        — 社区广场 (视频卡片网格 + 标签筛选)
[locale]/(app)/explore/[id]   — 作品详情 (预览 + 作者 + 互动)
[locale]/(app)/workflows      — 工作流分享 (分类 + 搜索 + 工作流卡片)
[locale]/(app)/video-analysis — 视频分析 (上传 + AI 模型 + 历史)
[locale]/(app)/workspace      — 工作区 (项目卡片网格 + 文件夹分组 + 新建弹窗)
[locale]/(app)/workspace/[id] — 重定向到 /canvas/[id] (兼容旧链接)
[locale]/(app)/contact        — 联系我们 (Telegram/Discord/X/Instagram)
[locale]/(editor)/canvas/[id] — 全屏画布编辑器 (ReactFlow, 无侧边栏)
```

## 架构约定

- **Monorepo**: pnpm workspace + Turborepo
- **路由**: `[locale]/(landing|auth|app|editor)` 四路由组
- **Landing**: Hero 交互式画板 (可拖动节点 + SVG 连线) + Footer
- **Sidebar**: 200px 固定宽度，导航/工作区/底部链接/用户 Footer
- **品牌色**: Indigo-500 (#6366F1)
- **文档**: GEB 分形文档系统 (L1/L2/L3 三层)
- **文件头部**: 所有业务文件必须有 L3 `[INPUT]/[OUTPUT]/[POS]/[PROTOCOL]` 注释
- **CI/CD**: push main → GitHub Actions 自动构建 + 部署 (Web + Worker)
- **域名**: nanobananacanvas.com → Cloudflare Workers (wrangler routes)
- **监控**: Cloudflare Analytics (零成本, Workers 内置)

## 环境模式

> **当前状态: 混合模式 (基础设施生产级 + 认证/支付测试级)**
>
> - **基础设施**: D1 数据库、R2 存储、域名路由均已指向生产环境 (nanobananacanvas.com)
> - **认证**: Clerk 使用测试密钥 (pk_test_/sk_test_)，功能完整但数据不迁移
> - **支付**: Stripe 使用测试密钥，可完整模拟支付流程
> - **环境变量**: 统一通过 `lib/env.ts` (getEnv/requireEnv) 获取，底层走 getCloudflareContext()
> - **迁移**: 有真实用户时切换 Clerk/Stripe 生产密钥，详见 `.md/生产环境迁移清单.md`

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
