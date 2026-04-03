# e2e/

> L2 | 父级: /CLAUDE.md

Playwright E2E 测试 · 面向 apps/web 的端到端验证

## 成员清单

```
tests/health.spec.ts     — 健康检查端点冒烟测试
tests/landing.spec.ts    — Landing 页面渲染、导航链接、性能预算
tests/navigation.spec.ts — 路由系统 (i18n 重定向、认证重定向、404)
tests/api-public.spec.ts — 公开 API 端点 (explore/categories/models) + 认证/限流守卫
tests/seo.spec.ts        — SEO 基础设施 (robots.txt/sitemap.xml/OG/meta)
playwright.config.ts     — Playwright 配置 (chromium, 固定 3000 端口, 串行稳定运行)
tsconfig.json            — TypeScript 配置
package.json             — 包描述与脚本
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
