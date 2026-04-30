# e2e/

> L2 | 父级: /CLAUDE.md

Playwright E2E 测试 · 面向 apps/web 的端到端验证

## 成员清单

```
tests/health.spec.ts     — 健康检查端点冒烟测试
tests/landing.spec.ts    — Landing 页面渲染、导航链接、性能预算
tests/navigation.spec.ts — 公开路由可达性与匿名主链稳定性 (landing/pricing/legal/404)
tests/api-public.spec.ts — API 烟雾测试 (health + 匿名请求守卫，依赖 `apps/web` 在 `dev:e2e` 启动前自动重置并重建本地 D1 schema)
tests/seo.spec.ts        — SEO 基础设施 (robots.txt/sitemap.xml/OG/meta)
tests/agent-create-workflow.spec.ts — Agent 工作流创建主链 E2E，覆盖 workspace 新建项目 + 一句话生成提案
playwright.config.ts     — Playwright 配置 (chromium, 固定 3000 端口, 串行稳定运行，启动时调用 `apps/web` 的自重置 + 自初始化 `dev:e2e`)
tsconfig.json            — TypeScript 配置
package.json             — 包描述与脚本
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
