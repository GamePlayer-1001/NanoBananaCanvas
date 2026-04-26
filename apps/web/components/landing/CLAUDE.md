# apps/web/components/landing/

> L2 | 父级: apps/web/CLAUDE.md

Landing 首页专用组件 — 全宽交互式画板 Hero + 首页面叙事区块

## 成员清单

```
hero-section.tsx     — HeroSection 全宽交互式画板 (可拖动真实图片/视频节点 + SVG bezier 连线 + 标题覆盖层)
landing-sections.tsx — Landing 首页全宽内容区集合 (模型动态脑图 / 标题切换式 Features 图文展示 / Pricing 四档 / Testimonials / FAQ；FAQ 已改为更适合 SEO 的大标题折叠样式，CTA 召回区已完全移除)
public-pages.tsx     — 公开子页面通用营销组件 (Hero / Section / CardGrid / ActionStrip)，供 features/models/about/docs/community/policy 等页复用
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
