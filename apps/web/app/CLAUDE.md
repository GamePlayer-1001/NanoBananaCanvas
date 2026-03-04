# apps/web/app/
> L2 | 父级: apps/web/CLAUDE.md

App Router 路由树 · SSR/SSG 渲染

## 成员清单

```
layout.tsx                  — 根布局 (Geist 字体/metadata/suppressHydrationWarning)
not-found.tsx               — 全局 404 页面
globals.css                 — Tailwind v4 + Lux 主题 + 品牌色 Indigo + landing-dark
api/health/route.ts         — GET /api/health 健康检查端点

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
