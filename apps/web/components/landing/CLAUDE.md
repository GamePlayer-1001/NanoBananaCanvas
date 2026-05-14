# apps/web/components/landing/

> L2 | 父级: apps/web/CLAUDE.md

Landing 首页专用组件 — 全宽交互式画板 Hero + 首页面叙事区块

## 成员清单

```
hero-section.tsx     — HeroSection 全宽交互式画板 (可拖动真实图片节点 + reduced motion 下回退静态图，降低首屏视频负担并保持标题覆盖层稳定)
model-mind-map-section.tsx — ModelMindMapSection 轨道星图模型生态区 (中心主星体 + 多供应商环绕卡片 + 底部指标带；首页改为延后客户端加载，供应商图标从远程 SVG 回退为本地字母徽标，减少首屏网络噪音)
landing-sections.tsx — Landing 首页全宽内容区集合 (标题切换式 Features 图文展示 + 四卡 Pricing 预览 + Testimonials + FAQ；首页当前顺序为 Features → Pricing → Testimonials → 模型生态区 → FAQ，FAQ 保持简洁居中标题样式，Testimonials 移除远程头像，Pricing 使用 Stripe 月付价格，并把 CTA 统一收口为“未登录进登录页、已登录进 Stripe Portal”；Features 桌面区使用 `passive: false` 的原生 wheel 监听切换内容，避免浏览器对 React 被动滚轮事件的告警)
public-pages.tsx     — 法务页轻量公共构件 (仅保留返回首页按钮，供 privacy/terms 复用)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
