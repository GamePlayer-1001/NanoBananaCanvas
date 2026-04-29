# Nano Banana Canvas — 可视化 AI 工作流编排平台

对标 martini.art · Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + ReactFlow + Zustand + Hono + Cloudflare

## 目录结构

```
apps/web/            — Next.js 16 前端 (App Router, i18n, SSR/SSG)
apps/worker/         — Hono Worker + Cron 运维核心 (积分解冻/超时扫描/文件清理)
packages/shared/     — 共享类型、常量、工具函数 (nanoid/TASK_CONFIG/FREEZE_TTL)
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
| API    | Next.js Route Handlers (38 端点, 全部在 apps/web) |
| 异步任务 | D1 状态机 + Cloudflare Workflow/Queue 双轨编排 + Worker 分发桥 + 客户端轮询 |
| 定时任务 | Cloudflare Worker Cron (*/10 * * * *)            |
| 数据库 | Cloudflare D1 (SQLite, 17 张表)                   |
| 缓存   | Cloudflare KV (限流/存储配额)                     |
| 存储   | Cloudflare R2                                     |
| 认证   | Clerk 会话桥接已接回运行时，账户级资源绑定继续收口中 |
| 支付   | Stripe 商业化主链与真实执行扣费链均已接回运行时；生产接线、正式部署与手测仍待完成 |
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
[locale]/(landing)/           — Landing Page (Hero + Features + Pricing 四档 + Testimonials + 模型动态脑图 + FAQ + Footer，CTA 召回区已移除)
[locale]/(landing)/features   — 功能详情页 (可视化工作流 / 多模态生产 / 团队协作说明)
[locale]/(landing)/models     — AI 模型罗列页 (GPT Image 2 / OpenAI / Kling / Runway / Wan / Qwen 等)
[locale]/(landing)/docs       — 公开文档导航页 (快速开始 + 产品地图 + 导航承接)
[locale]/(landing)/community  — 社区说明页 (Explore / Workflows / 联系入口)
[locale]/(landing)/about      — 关于我们 (产品定位 / 设计原则 / 适用对象)
[locale]/(landing)/pricing    — 定价页 (Free 默认态 + Standard/Pro/Ultimate + 一次性套餐/积分包)
[locale]/(landing)/contact    — 联系我们 (Telegram/Discord/X/Instagram，公开站资源入口)
[locale]/(landing)/privacy    — 隐私政策
[locale]/(landing)/terms      — 服务条款
[locale]/(landing)/refund-policy  — 退款政策
[locale]/(landing)/acceptable-use — 合理使用政策
[locale]/(landing)/cookies    — Cookie 设置说明
[locale]/(auth)/sign-in       — 登录页 (文件树位于 [locale] 下，外部 URL 暴露为 /sign-in)
[locale]/(auth)/sign-up       — 注册页 (文件树位于 [locale] 下，外部 URL 暴露为 /sign-up)
[locale]/(app)/explore        — 社区广场 (视频卡片网格 + 标签筛选)
[locale]/(app)/explore/[id]   — 作品详情 (预览 + 作者 + 互动)
[locale]/(app)/workflows      — 工作流分享 (分类 + 搜索 + 工作流卡片)
[locale]/(app)/video-analysis — 视频分析 (上传 + AI 模型 + 历史)
[locale]/(app)/workspace      — 工作区 (项目卡片网格 + 文件夹分组 + 新建弹窗)
[locale]/(app)/workspace/[id] — 重定向到 /canvas/[id] (兼容旧链接)
[locale]/(editor)/canvas/[id] — 全屏画布编辑器 (ReactFlow, 无侧边栏)
```

## 架构约定

- **Monorepo**: pnpm workspace + Turborepo
- **Turborepo Env**: `turbo.json` 统一透传 `NEXT_PUBLIC_* / CLERK_* / STRIPE_*` 到 build/test 子任务，避免 CI 子进程环境漂移
- **路由**: `[locale]/(landing|auth|app|editor)` 四路由组
- **URL 语义**: 语言前缀在外部 URL 中隐藏，`[locale]` 仅作为内部文件树与消息加载边界
- **Landing**: 首页承接品牌叙事，公开子页面树承接功能/模型/资源/法务/公司信息，导航与 Footer 全部落到真实路由
- **Sidebar**: 300px 固定宽度，导航/工作区/底部链接/用户账户卡片
- **品牌色**: Indigo-500 (#6366F1)
- **文档**: GEB 分形文档系统 (L1/L2/L3 三层)
- **文件头部**: 所有业务文件必须有 L3 `[INPUT]/[OUTPUT]/[POS]/[PROTOCOL]` 注释
- **CI/CD**: push main → GitHub Actions 自动构建 + 部署 (CI 复用 pnpm/Turbo/Playwright 缓存并产出 OpenNext artifact；Deploy job 直接复用 artifact 发布 Web + Worker，Queue 消费者与生产者绑定随 wrangler 配置一并发布)
- **域名**: nanobananacanvas.com → Cloudflare Workers (wrangler routes)
- **监控**: Cloudflare Analytics (零成本, Workers 内置)

## 环境模式

> **当前状态: Clerk 会话桥接已接回运行时，账户级资源绑定已开始生效，Stripe 商业化主链与执行扣费链已接回运行时，生产接线与手测仍待完成**
>
> - **基础设施**: D1 数据库、R2 存储、域名路由均已指向生产环境 (nanobananacanvas.com)
> - **认证**: Landing 主 CTA 已进入 `/sign-in`；`/sign-in` 与 `/sign-up` 走隐藏 locale 前缀策略并接回真实 Clerk 卡片；`middleware.ts` 已注入 Clerk session，`lib/auth/session-actor.ts` 已把登录态映射到 `users` 表，工作流/文件夹/任务开始按真实 actor 归属
> - **支付**: `/pricing`、`/billing`、Checkout、Portal、Webhook、订阅镜像、账本读取、积分包目录与 `freeze / confirm / refund` 执行扣费链均已回到运行时；生产接线与正式手测按 `.md/Stripe 支付系统嵌入执行清单.md` 推进
> - **环境变量**: 统一通过 `lib/env.ts` (getEnv/requireEnv) 获取，底层走 getCloudflareContext()
> - **重建**: 未来如需重新接回身份系统，以 `.md/Clerk 登录系统回装方案与清单.md` 为入口

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
