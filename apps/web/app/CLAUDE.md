# apps/web/app/
> L2 | 父级: apps/web/CLAUDE.md

App Router 路由树 · SSR/SSG 渲染

## 成员清单

```
layout.tsx              — 根布局 (Geist 字体/metadata)
not-found.tsx           — 全局 404 页面
globals.css             — Tailwind v4 主题 + Lux + 品牌色
api/health/route.ts     — GET /api/health 健康检查

[locale]/layout.tsx         — i18n 语言布局
[locale]/(landing)/         — 营销页路由组 (深色科技风)
[locale]/(auth)/            — 认证页路由组 (居中布局)
[locale]/(app)/             — 应用页路由组 (侧边栏 + 顶栏)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
