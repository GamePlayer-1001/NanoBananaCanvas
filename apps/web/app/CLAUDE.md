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
api/                        — RESTful API 路由层 (见 api/CLAUDE.md，32 端点: pricing/billing/ai/files/tasks/workflows/explore/settings/webhooks...)

[locale]/layout.tsx                         — 语言布局 (ClerkProvider + next-intl + QueryProvider + Clerk proxyUrl 透传，认证组件始终处在 ClerkProvider 内)
[locale]/not-found.tsx                     — locale 感知 404 页面 (消费 notFound 文案，覆盖全局英文兜底)
[locale]/(landing)/layout.tsx               — Landing 深色布局 (landing-dark class)
[locale]/(landing)/page.tsx                 — Landing 首页 (Hero + 模型动态脑图 + Features + Pricing 四档 + Testimonials + FAQ + Footer，CTA 召回区已移除)
[locale]/(landing)/features/page.tsx       — 功能详情页 (公开 SEO 承接页，说明工作流编排/多模态生产/团队协作)
[locale]/(landing)/models/page.tsx         — 模型目录页 (图像/视频/语言/视觉/路由模型说明，承接 GPT Image 2 等搜索意图)
[locale]/(landing)/docs/page.tsx           — 公开文档导航页 (快速开始 + 产品地图 + 资源入口)
[locale]/(landing)/community/page.tsx      — 社区说明页 (解释 Explore/Workflows 与公开分享层)
[locale]/(landing)/about/page.tsx          — 关于我们页面 (产品原则/适用对象/品牌定位)
[locale]/(landing)/pricing/page.tsx        — 定价页 (Stripe 动态价格 + 登录/Checkout CTA)
[locale]/(landing)/contact/page.tsx        — 联系我们页面 (公开资源入口，复用 contact 组件)
[locale]/(landing)/privacy/page.tsx        — 隐私政策 (PrivacyContent)
[locale]/(landing)/terms/page.tsx          — 服务条款 (TermsContent)
[locale]/(landing)/refund-policy/page.tsx  — 退款政策页面
[locale]/(landing)/acceptable-use/page.tsx — 合理使用政策页面
[locale]/(landing)/cookies/page.tsx        — Cookie 设置说明页
[locale]/(auth)/layout.tsx                  — 认证布局 (品牌双栏认证壳层，承载 Clerk 登录/注册页)
[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx — 登录页 (Landing 主 CTA 入口 + 真实 Clerk SignIn 卡片，对外暴露 /sign-in)
[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx — 注册页 (复用认证壳层 + 真实 Clerk SignUp 卡片，对外暴露 /sign-up)
[locale]/(app)/layout.tsx                   — 应用动态布局 (AppSidebar 200px + main flex-1)
[locale]/(app)/account/page.tsx             — 账户页 (AccountContent: 个人资料/作品/通知/多条 API 接入配置)
[locale]/(app)/billing/page.tsx             — 账单页 (BillingContent: 余额/流水/usage + Stripe Portal 入口)
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
