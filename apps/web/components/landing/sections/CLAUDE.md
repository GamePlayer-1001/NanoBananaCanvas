# apps/web/components/landing/sections/

> L2 | 父级: apps/web/components/landing/CLAUDE.md

Landing 首页板块模块。这里把首页中段的模型、功能、定价、证明、FAQ、CTA 与节点 rail 拆成小组件，避免 landing-sections.tsx 继续膨胀成多职责文件。

## 成员清单

```
section-shell.tsx              — SectionShell 板块外壳，统一 snap section 的标题、描述、宽度与间距
landing-rail.tsx               — LandingRail 右侧节点式滚动导航，暴露 LANDING_SECTION_IDS
model-section.tsx              — ModelSection 模型支持板块，区分当前运行时与生态规划支持
features-pricing-section.tsx   — FeaturesSection 与 PricingSummarySection，承载功能卡片和首页定价摘要
proof-faq-section.tsx          — ProofSection 与 FaqSection，承载可见 SEO 证明和 FAQ 手风琴
cta-section.tsx                — FinalCtaSection 末屏转化板块
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
