# apps/web/components/landing/

> L2 | 父级: apps/web/CLAUDE.md

Landing 首页专用组件 — 全宽交互式画板 Hero + 首页面叙事区块

## 成员清单

```
hero-section.tsx     — HeroSection 全宽交互式画板 (可拖动真实图片/视频节点 + SVG bezier 连线 + 标题覆盖层)
model-mind-map-section.tsx — ModelMindMapSection 轨道星图模型生态区 (中心主星体 + 多供应商环绕卡片 + 底部指标带)
landing-sections.tsx — Landing 首页全宽内容区集合 (转发模型生态区 + 标题切换式 Features 图文展示 + 接收服务端 Stripe 动态价格的 Pricing 区 + Testimonials + FAQ；FAQ 已改为更适合 SEO 的大标题折叠样式，CTA 召回区已完全移除，价格缺失时不再渲染约束提示)
marketing-site-tree.tsx — MarketingSiteTree 公开子页面树导航 (产品/资源/公司法务三组入口 + 当前页高亮)
public-pages.tsx     — 公开子页面通用营销组件 (BackHome / Hero / Section / CardGrid / ActionStrip)，供 features/models/about/docs/community/policy 等页复用
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
