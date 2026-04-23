# apps/web/components/landing/

> L2 | 父级: apps/web/CLAUDE.md

Landing 首页专用组件 — Hero、内容板块、公开资源页模板与首页板块子模块

## 成员清单

```
hero-section.tsx          — HeroSection 黑白电影感图像节点画板，表达人物特征到动态输出的因果链
hero-canvas.tsx           — HeroCanvas 可拖拽图像节点画布，承载六节点因果链、坐标缩放与 SVG 连线
landing-sections.tsx     — Landing 主体编排层，只负责组合 sections 子模块与维护 rail 激活状态
public-resource-page.tsx — 公开资源页通用模板，被 /features /models /docs /about 复用
sections/                — Landing 首页板块子模块，拆分模型、功能、定价、证明、FAQ、CTA 与节点 rail
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
