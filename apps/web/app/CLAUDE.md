# apps/web/app/

> L2 | 父级: apps/web/CLAUDE.md

App Router 路由树 · SSR/SSG 渲染

## 成员清单

```
layout.tsx                  — 根布局 (Geist 字体/metadata/suppressHydrationWarning)
not-found.tsx               — 全局 404 页面
globals.css                 — Tailwind v4 + Lux 主题 + 品牌色 Indigo + landing-dark
api/health/route.ts         — GET /api/health 健康检查端点
api/users/me/route.ts       — GET /api/users/me 用户信息+首次登录自动同步
api/webhooks/clerk/route.ts — POST /api/webhooks/clerk Clerk Webhook (user CRUD)
api/workflows/route.ts      — GET+POST /api/workflows 工作流列表+创建
api/workflows/[id]/route.ts     — GET+PUT+DELETE 工作流详情+更新+删除
api/workflows/[id]/publish/     — POST+DELETE 发布/取消发布
api/workflows/[id]/clone/       — POST 克隆公开工作流
api/workflows/[id]/like/        — POST toggle 点赞
api/workflows/[id]/favorite/    — POST toggle 收藏
api/workflows/[id]/report/      — POST 提交举报
api/explore/route.ts        — GET /api/explore 广场公开列表 (分类/排序/互动标记)
api/explore/search/route.ts — GET /api/explore/search 模糊搜索
api/categories/route.ts     — GET /api/categories 分类列表 (i18n)
api/notifications/route.ts  — GET+PATCH /api/notifications 通知列表+标记已读
api/credits/balance/        — GET /api/credits/balance 积分余额 (三池 + 套餐)
api/credits/transactions/   — GET /api/credits/transactions 交易历史 (分页+筛选)
api/credits/usage/          — GET /api/credits/usage AI 使用统计 (摘要/模型/日趋势)
api/billing/subscription/   — GET /api/billing/subscription 当前订阅信息
api/billing/checkout/       — POST /api/billing/checkout Stripe Checkout 订阅
api/billing/portal/         — POST /api/billing/portal Stripe Customer Portal
api/billing/cancel/         — POST /api/billing/cancel 取消订阅 (period end)
api/billing/packages/       — GET /api/billing/packages 积分包列表
api/billing/topup/          — POST /api/billing/topup 积分包一次性购买
api/webhooks/stripe/        — POST /api/webhooks/stripe Stripe Webhook 事件
api/ai/execute/             — POST /api/ai/execute 双模式 AI 执行 (积分/Key)
api/ai/stream/              — POST /api/ai/stream SSE 流式 AI 执行
api/ai/models/              — GET /api/ai/models 模型目录 + 定价
api/settings/api-keys/      — GET+PUT API Key 管理 (加密存储)
api/settings/api-keys/[provider]/ — DELETE+POST Key 删除/测试

[locale]/layout.tsx                         — i18n 语言布局 (next-intl + ClerkProvider + QueryProvider)
[locale]/(landing)/layout.tsx               — Landing 深色布局 (landing-dark class)
[locale]/(landing)/page.tsx                 — Landing 首页 (HeroSection + CtaSection + Footer)
[locale]/(auth)/layout.tsx                  — 认证分屏布局 (左 50% 玫瑰渐变 + 右 50% 深色背景 + 语言切换)
[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx  — 登录页 (AuthHeader + Clerk SignIn + AuthFooter)
[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx  — 注册页 (AuthHeader + Clerk SignUp + AuthFooter)
[locale]/(app)/layout.tsx                   — 应用布局 (AppSidebar 200px + main flex-1)
[locale]/(app)/explore/page.tsx             — 社区广场 (ExploreContent: tabs + 视频卡片网格)
[locale]/(app)/workflows/page.tsx           — 工作流分享 (WorkflowsContent: 分类 + 搜索 + 工作流卡片)
[locale]/(app)/video-analysis/page.tsx      — 视频分析 (VideoAnalysisContent: 上传 + AI 模型 + 历史)
[locale]/(app)/elements/page.tsx            — 元素库 (Coming Soon 占位)
[locale]/(app)/workspace/page.tsx           — 工作区 (WorkspaceContent: 项目卡片网格 + 新建弹窗)
[locale]/(app)/workspace/[id]/page.tsx      — 画布编辑器 (ReactFlowProvider + Canvas CSR)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
