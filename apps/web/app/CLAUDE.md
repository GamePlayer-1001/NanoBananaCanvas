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

[locale]/layout.tsx                         — i18n 语言布局 (P1 接入 next-intl)
[locale]/(landing)/layout.tsx               — Landing 深色布局 (landing-dark)
[locale]/(landing)/page.tsx                 — Landing 首页 (渐变标题 + CTA)
[locale]/(auth)/layout.tsx                  — 认证居中布局
[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx  — 登录页占位 (P1 接 Clerk)
[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx  — 注册页占位 (P1 接 Clerk)
[locale]/(app)/layout.tsx                   — 应用布局 (侧边栏 + 顶栏骨架)
[locale]/(app)/workspace/page.tsx           — 工作空间列表页占位
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
