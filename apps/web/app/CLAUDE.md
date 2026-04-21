# apps/web/app/

> L2 | 父级: apps/web/CLAUDE.md

App Router 路由树 · SSR/SSG 渲染

## 成员清单

```
layout.tsx                  — 根布局 (Geist 字体/metadata/suppressHydrationWarning)
not-found.tsx               — 全局 404 页面
globals.css                 — Tailwind v4 + Lux 主题 + 品牌色 Indigo + landing-dark
robots.ts                   — robots.txt 动态生成 (SEO)
sitemap.ts                  — sitemap.xml 动态生成 (SEO)
api/                        — RESTful API 路由层 (见 api/CLAUDE.md，26 端点: ai/files/tasks/workflows/explore/settings/webhooks...)

[locale]/layout.tsx                         — 语言布局 (ClerkProvider + next-intl + QueryProvider + Clerk proxyUrl 透传)
[locale]/(landing)/layout.tsx               — Landing 深色布局 (landing-dark class)
[locale]/(landing)/page.tsx                 — Landing 首页 (HeroSection + LandingFooter)
[locale]/(landing)/privacy/page.tsx        — 隐私政策 (PrivacyContent)
[locale]/(landing)/terms/page.tsx          — 服务条款 (TermsContent)
[locale]/(auth)/layout.tsx                  — 认证布局 (参考 martini.art 的双栏认证壳层，承载 Clerk 登录/注册页)
[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx — 登录页 (Landing 主 CTA 入口 + 真实 Clerk SignIn 卡片，对外暴露 /sign-in)
[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx — 注册页 (复用认证壳层 + 真实 Clerk SignUp 卡片，对外暴露 /sign-up)
[locale]/(app)/layout.tsx                   — 应用动态布局 (AppSidebar 200px + main flex-1)
[locale]/(app)/account/page.tsx             — 账户页 (AccountContent: 个人资料/作品/通知/多条 API 接入配置)
[locale]/(app)/explore/page.tsx             — 社区广场 (ExploreContent: tabs + 视频卡片网格)
[locale]/(app)/explore/[id]/page.tsx       — 作品详情 (ExploreDetailContent: 预览 + 作者 + 互动)
[locale]/(app)/workflows/page.tsx           — 工作流分享 (WorkflowsContent: 分类 + 搜索 + 工作流卡片)
[locale]/(app)/video-analysis/page.tsx      — 视频分析 (VideoAnalysisContent: 上传 + AI 模型 + 历史)
[locale]/(app)/elements/page.tsx            — 元素库 (Coming Soon 占位)
[locale]/(app)/workspace/page.tsx           — 工作区 (WorkspaceContent: 项目卡片网格 + 新建弹窗)
[locale]/(app)/workspace/[id]/page.tsx      — 画布编辑器 (ReactFlowProvider + Canvas CSR)
[locale]/(editor)/layout.tsx                — 全屏动态编辑器布局 (最小化容器)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
