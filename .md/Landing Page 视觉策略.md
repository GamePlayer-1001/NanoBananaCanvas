# Nano Banana Canvas - Landing Page 视觉策略

> 文档版本：v1.1
> 创建日期：2026-03-04
> 最后更新：2026-04-26
> 关联文档：项目框架结构.md、项目执行规范.md、archive/差距分析报告.md

---

## 一、设计哲学

### 1.1 视觉叙事主线

```
黑暗中浮现光芒 → 展示创造的可能性 → 证明工具的力量 → 引导行动

具体映射：
Hero（震撼开场）→ 模型动态脑图（能力证明）→ Features（操作实感）→ Pricing 四档（决策引导）→ Testimonials（社会证明）→ FAQ（顾虑消解）→ CTA（临门一脚）→ Footer（导航收束）
```

### 1.2 核心设计原则

| 原则       | 说明                                                          | 禁忌                   |
| ---------- | ------------------------------------------------------------- | ---------------------- |
| 深色科技风 | 背景 `#0B0B0F` → `#000000` 渐变，内容在暗色中浮现             | 禁止使用荧光色（neon） |
| 克制的色彩 | 主色低饱和紫蓝，点缀金属银灰，高光仅用于 CTA                  | 禁止大面积高饱和色块   |
| 呼吸感留白 | Section 间距 120-160px，元素间距 32-48px                      | 禁止信息堆砌           |
| 渐进式揭示 | 内容随滚动渐入，不一次性暴露全部信息                          | 禁止全页面同时加载动画 |
| 全宽铺满   | Landing 主内容不使用窄 `max-width` 容器，只保留响应式安全边距 | 禁止黑底两侧大面积空置 |

### 1.3 色彩系统（Landing 专用）

```css
/* ============================================ */
/*  Landing Page 深色科技风配色                   */
/*  基于 Lux 主题 + 品牌色注入                    */
/*  禁止使用荧光色（neon colors）                 */
/* ============================================ */

:root {
  /* 背景层级 */
  --landing-bg-base: #0b0b0f;
  --landing-bg-section: #08080c;
  --landing-bg-card: rgba(255, 255, 255, 0.03);
  --landing-bg-card-hover: rgba(255, 255, 255, 0.06);

  /* 文字层级 */
  --landing-text-hero: #ffffff;
  --landing-text-primary: rgba(255, 255, 255, 0.9);
  --landing-text-secondary: rgba(255, 255, 255, 0.6);
  --landing-text-tertiary: rgba(255, 255, 255, 0.4);

  /* 品牌色 — 低饱和紫蓝渐变 */
  --landing-accent-start: #6366f1; /* Indigo-500 */
  --landing-accent-end: #8b5cf6; /* Violet-500 */
  --landing-accent-glow: rgba(99, 102, 241, 0.15);

  /* 功能色 */
  --landing-border: rgba(255, 255, 255, 0.08);
  --landing-border-hover: rgba(255, 255, 255, 0.15);
  --landing-success: #34d399; /* Emerald-400 */
  --landing-gold: #d4a574; /* 低饱和金色，用于 Pro 标签 */
}
```

**绝对禁止**：

- `#00FF00` `#FF00FF` `#00FFFF` 等荧光色
- 任何饱和度 > 80% 的大面积色块
- 纯白背景区域

---

## 二、动效架构

### 2.1 双引擎策略

| 引擎              | 职责                                                 | 场景                                                |
| ----------------- | ---------------------------------------------------- | --------------------------------------------------- |
| **anime.js v4**   | 复杂编排动画、ScrollObserver、SVG 变形、Stagger 序列 | Hero 背景粒子、滚动触发的多元素协调动画、数据计数器 |
| **Framer Motion** | React 组件生命周期动画（mount/unmount/layout）       | Section 渐入、卡片悬停、定价表切换、Tab 内容过渡    |

### 2.2 职责边界（铁律）

```
anime.js 的领地：
├── 需要精确时间线控制的编排动画
├── ScrollObserver 驱动的视差效果
├── SVG Path 变形 / 描边动画
├── Stagger 错开动画（多元素依次进入）
├── 数字递增计数器
└── 背景装饰动效（粒子、网格线流动）

Framer Motion 的领地：
├── React 组件的 mount/unmount 过渡
├── layout 属性驱动的布局动画
├── AnimatePresence（条件渲染过渡）
├── 悬停/点击微交互 (whileHover, whileTap)
├── 页面切换过渡
└── 列表增删动画（reorder）
```

**决策原则**：如果动画的生命周期和 React 组件的生命周期绑定（出现/消失/布局变化），用 Framer Motion。如果是独立于组件生命周期的装饰性/叙事性动画，用 anime.js。

### 2.3 性能约束

| 约束                     | 值               | 理由                           |
| ------------------------ | ---------------- | ------------------------------ |
| 首屏动画启动延迟         | ≤ 200ms          | 用户感知即时性                 |
| 同时运行动画实例         | ≤ 8              | 避免掉帧                       |
| 滚动动画触发阈值         | 元素进入视口 20% | 在用户注意力到达前启动         |
| 动画总时长（单个）       | 300-800ms        | 过长显得迟钝，过短看不清       |
| `prefers-reduced-motion` | 必须尊重         | 无障碍要求，禁用所有非必要动画 |

---

## 三、Section 详细设计

### 3.1 Hero Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                    [Logo + Nav]  [Sign In]                        │
│                                                                   │
│                                                                   │
│              Visual AI Workflow Platform                          │
│     (主标题，anime.js 逐字渐入 + 微小 Y 轴偏移)                   │
│                                                                   │
│         Build, share, and run AI workflows                       │
│     (副标题，延迟 300ms 后 Framer Motion fadeIn)                   │
│                                                                   │
│              [Get Started Free]  [Watch Demo]                    │
│     (CTA 按钮，延迟 500ms，Framer Motion scale 弹入)              │
│                                                                   │
│     ┌─────────────────────────────────────────────────┐         │
│     │                                                   │         │
│     │          画布编辑器截图/动态预览                    │         │
│     │     (anime.js 缓慢 scale 1.0→1.02 + 微位移)      │         │
│     │                                                   │         │
│     └─────────────────────────────────────────────────┘         │
│                                                                   │
│  背景：anime.js 驱动的柔和粒子/网格线流动                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素          | 引擎          | 动画                               | 时机               |
| ------------- | ------------- | ---------------------------------- | ------------------ |
| 背景粒子/网格 | anime.js      | 持续缓慢流动，opacity 呼吸         | 页面加载即开始     |
| 导航栏        | Framer Motion | fadeIn + Y:-20→0                   | 0ms                |
| 主标题        | anime.js      | 逐字 stagger，opacity 0→1 + Y:20→0 | 100ms，每字 30ms   |
| 副标题        | Framer Motion | fadeIn + Y:10→0                    | 主标题完成后 200ms |
| CTA 按钮组    | Framer Motion | scale 0.95→1 + opacity 0→1         | 副标题后 200ms     |
| 编辑器预览    | anime.js      | opacity 0→1 + scale 0.98→1         | CTA 后 300ms       |
| 信任标签      | Framer Motion | stagger fadeIn                     | 预览后 200ms       |

### 3.2 Model Showcase Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  上方左侧：超大标题 + 描述 + 主按钮                                  │
│                                                                   │
│  主视觉：轨道式模型生态云图                                         │
│    • 中心是 Nano Banana Canvas 紫色主星体                          │
│    • 多层椭圆轨道承载 OpenAI / Google / Anthropic / Gemini 等节点 │
│    • 节点采用“发光圆形 logo + 球体内部小号名称”样式                 │
│    • 节点需沿各自椭圆轨道缓慢公转，形成围绕核心恒星的秩序感         │
│    • 节点需体现“近大远小”的纵深，并通过分层轨道避免相互碰撞         │
│    • 轨道、星点、节点在滚动进入时整体渐显并伴随轻微漂移             │
│    • 整个 section 直接融入 landing 背景，不再包裹独立大卡片         │
│    • 核心主星体必须处于云图几何中心，节点围绕核心均衡展开           │
│                                                                   │
│  底部：四列能力指标带                                              │
│    • 接入供应商 / 统一编排 / 跨模型接力 / 连续体验                  │
│    • 指标带作为模型区的收束，而不是右侧堆叠说明卡或一排统计卡片     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素          | 引擎                          | 动画                                       | 时机         |
| ------------- | ----------------------------- | ------------------------------------------ | ------------ |
| 顶部文案列    | anime.js ScrollObserver       | opacity 0→1 + X:-40→0                      | 进入视口 20% |
| 轨道主画布    | anime.js                      | 整体 opacity/scale 渐入 + 轻微 rotate 漂移 | Section 可见 |
| 中心核心球    | anime.js                      | 呼吸式 scale + glow 脉冲                   | 持续循环     |
| 轨道/星点     | anime.js                      | 透明度渐显 + 星点 pulse                    | Section 可见 |
| Provider 节点 | React + requestAnimationFrame | 逐个错峰 reveal + 分层轨道公转 + 近大远小  | 滚动触发后   |
| 底部指标带    | anime.js ScrollObserver       | opacity 0→1 + Y:+24→0                      | 进入视口 20% |

### 3.3 Feature Showcase Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│              Why Nano Banana Canvas?                              │
│                                                                   │
│   ┌─────────────────────┐    ┌─────────────────────┐            │
│   │ 🎨 Visual Workflow   │    │  [动态演示区]        │            │
│   │                      │    │   当前选中功能的      │            │
│   │ 📦 30+ AI Models    │    │   交互式预览          │            │
│   │                      │    │                      │            │
│   │ 🚀 Cloud Rendering  │    │   (anime.js 驱动      │            │
│   │                      │    │    节点连线动画)      │            │
│   │ 👥 Community        │    │                      │            │
│   └─────────────────────┘    └─────────────────────┘            │
│   (左侧列表选中态切换)         (右侧对应演示切换)                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素         | 引擎                    | 动画                             | 时机            |
| ------------ | ----------------------- | -------------------------------- | --------------- |
| Section 标题 | anime.js ScrollObserver | 同上                             | 进入视口        |
| 功能列表项   | Framer Motion           | stagger fadeIn，选中态 layoutId  | 滚动触发 + 交互 |
| 演示区切换   | Framer Motion           | AnimatePresence crossfade        | 功能项切换      |
| 节点连线动画 | anime.js                | SVG path dashoffset + 节点 scale | 演示区激活时    |

### 3.4 Testimonials Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│              Trusted by Creative Operators                       │
│                                                                   │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐                 │
│   │ 用户评价卡 │ │ 用户评价卡 │ │ 用户评价卡 │                 │
│   │ quote/name │ │ quote/name │ │ quote/name │                 │
│   └────────────┘ └────────────┘ └────────────┘                 │
│   (社会证明，3 张宽松卡片，不再把 FAQ 和底部内容挤在一起)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素         | 引擎          | 动画                                              | 时机           |
| ------------ | ------------- | ------------------------------------------------- | -------------- |
| 用户评价卡片 | anime.js      | stagger grid，opacity 0→1 + Y:60→0 + scale 0.95→1 | 滚动进入       |
| 卡片悬停     | Framer Motion | whileHover scale 1.02 + shadow 增强               | 用户交互       |
| 星级/署名    | Framer Motion | 轻微 fadeIn                                       | 卡片动画完成后 |

### 3.5 Pricing Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│              Simple, Transparent Pricing                         │
│                                                                   │
│              [Monthly] [Yearly - Save 20%]                       │
│              (Framer Motion layoutId 滑块)                       │
│                                                                   │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│   │  Free   │  │Standard │  │★ Pro ★  │  │Ultimate │          │
│   │  $0     │  │  $20    │  │  $50    │  │  $150   │          │
│   │  200    │  │  1,600  │  │  5,400  │  │ 17,000  │          │
│   │ credits │  │ credits │  │ credits │  │ credits │          │
│   │         │  │         │  │         │  │         │          │
│   │ [Start] │  │[Choose] │  │[Choose] │  │[Choose] │          │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘          │
│   (anime.js stagger 从底部渐入)                                   │
│   (Pro 推荐卡片有微弱的品牌色 glow 动画)                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素                | 引擎          | 动画                          | 时机                |
| ------------------- | ------------- | ----------------------------- | ------------------- |
| Monthly/Yearly 切换 | Framer Motion | layoutId 滑块 + 价格数字变化  | 用户交互            |
| 价格数字变化        | anime.js      | 数字递增/递减动画             | 切换 Monthly/Yearly |
| 卡片组              | anime.js      | stagger，opacity + Y + scale  | 滚动进入            |
| Pro 推荐卡片        | anime.js      | 品牌色 glow 脉冲 (box-shadow) | 持续循环            |
| CTA 按钮 hover      | Framer Motion | whileHover scale + 渐变位移   | 用户交互            |

### 3.6 Final CTA Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│         Start Creating with AI. For Free.                        │
│                                                                   │
│                  [Get Started →]                                  │
│                                                                   │
│         200 free credits. No credit card required.               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.7 FAQ Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│              FAQ                                                  │
│                                                                   │
│   [问题一 ▾]                                                       │
│   [问题二 ▾]                                                       │
│   [问题三 ▾]                                                       │
│   [问题四 ▾]                                                       │
│   (details/summary 点击展开，避免底部信息密集堆叠)                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8 Footer

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Logo     Product    Legal      Connect                          │
│           Features   Terms      Twitter                          │
│           Pricing    Privacy    Discord                          │
│           Explore    Refund     GitHub                           │
│                                                                   │
│           © 2026 Nano Banana Canvas. All rights reserved.        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、导航栏设计

### 4.1 固定顶部导航

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]     Features  Pricing  Explore     [🌐 EN] [Sign In]   │
└─────────────────────────────────────────────────────────────────┘
```

**行为**：

- 初始透明背景，滚动超过 Hero 后渐变为 `backdrop-blur + 半透明黑底`
- 背景切换使用 Framer Motion `animate` + `useScroll`
- Logo 在深色背景上使用白色变体

---

## 五、关键交互模式

### 5.1 ScrollObserver 统一配置（anime.js）

```typescript
// lib/animations/scroll-observer.ts
import anime from 'animejs'

export function createScrollReveal(
  selector: string,
  options?: {
    threshold?: number
    stagger?: number
    translateY?: number
    duration?: number
    delay?: number
  },
) {
  const {
    threshold = 0.2,
    stagger = 80,
    translateY = 40,
    duration = 600,
    delay = 0,
  } = options ?? {}

  anime({
    targets: selector,
    translateY: [translateY, 0],
    opacity: [0, 1],
    duration,
    delay: anime.stagger(stagger, { start: delay }),
    easing: 'easeOutCubic',
    autoplay: false,
    // v4 ScrollObserver
    onScroll: {
      enter: 'play',
      threshold,
    },
  })
}
```

### 5.2 Framer Motion 通用变体

```typescript
// lib/animations/motion-variants.ts

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: 'easeOut' },
}
```

### 5.3 无障碍动画处理

```typescript
// hooks/use-reduced-motion.ts
import { useMotionValue } from 'framer-motion'

export function useReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 使用
const shouldReduceMotion = useReducedMotion()
const animationDuration = shouldReduceMotion ? 0 : 600
```

---

## 六、响应式适配策略

### 6.1 断点行为

| Section          | Desktop (≥1024)   | Tablet (768-1023) | Mobile (<768)              |
| ---------------- | ----------------- | ----------------- | -------------------------- |
| Hero             | 全尺寸 + 背景动画 | 缩小预览图        | 隐藏背景动画，保留文字动效 |
| Model Carousel   | 6 个 Logo 可见    | 4 个              | 3 个                       |
| Feature Showcase | 左右分栏          | 上下堆叠          | 上下堆叠，隐藏交互演示     |
| Community        | 3 列网格          | 2 列              | 1 列                       |
| Pricing          | 4 卡片并排        | 2×2 网格          | 纵向堆叠                   |

### 6.2 移动端动画降级

- 禁用 `背景粒子/网格线流动`（性能考虑）
- Stagger 间距缩短至 40ms（加速信息展示）
- 取消 `视差滚动`（移动端体验不佳）
- 保留 `组件渐入` 和 `悬停微交互`

---

## 七、品牌一致性

### 7.1 字体方案

| 用途         | 字体                       | 权重           |
| ------------ | -------------------------- | -------------- |
| Hero 标题    | Inter / 系统默认           | 700 (Bold)     |
| Section 标题 | Inter / 系统默认           | 600 (SemiBold) |
| 正文         | Inter / 系统默认           | 400 (Regular)  |
| 代码/数据    | JetBrains Mono / Fira Code | 400            |

### 7.2 间距系统

| 层级         | 值          | 用途               |
| ------------ | ----------- | ------------------ |
| Section 间距 | 120px-160px | Section 之间       |
| 区块间距     | 48px-64px   | Section 内区块之间 |
| 元素间距     | 16px-32px   | 组件之间           |
| 紧凑间距     | 8px-12px    | 内联元素           |

### 7.3 风格禁忌清单

- **禁止** 荧光色 / Neon 色（#00FF00, #FF00FF 等高饱和电子色）
- **禁止** 彩虹渐变（gradient 最多 2 色，且同色系）
- **禁止** 3D 旋转/翻转动画（感觉廉价）
- **禁止** 弹跳 easing（bounce、elastic）用于内容元素
- **禁止** 自动播放视频带声音
- **禁止** 模态弹窗打断浏览流

---

## 八、实现参考（ReactBits 灵感，anime.js 实现）

以下效果参考 ReactBits 组件思路，但使用 anime.js 手写实现以保持依赖精简：

| ReactBits 参考 | 我们的实现方式                                  | 应用位置           |
| -------------- | ----------------------------------------------- | ------------------ |
| TextReveal     | anime.js 逐字 stagger + opacity + Y 偏移        | Hero 主标题        |
| GradientText   | CSS `background-clip: text` + anime.js 渐变位移 | Section 标题关键词 |
| CountUp        | anime.js `round` + targets 对象属性动画         | 定价积分数字       |
| Marquee        | anime.js translateX 循环 + 克隆元素             | 模型 Logo 轮播     |
| SpotlightCard  | CSS radial-gradient + mousemove 事件            | 功能卡片悬停       |

---

## 九、技术依赖

```json
{
  "dependencies": {
    "animejs": "^4.0.0",
    "framer-motion": "^11.0.0"
  }
}
```

**anime.js v4 关键 API**：

- `anime({ ...options, onScroll: { enter, leave, threshold } })` — 滚动触发
- `anime.stagger(value, { start, direction, grid })` — 错开动画
- `anime.timeline()` — 时间线编排
- Draggable module — 拖拽物理

**Framer Motion 关键 API**：

- `<motion.div>` — 动画包装器
- `<AnimatePresence>` — 条件渲染过渡
- `layoutId` — 共享布局动画
- `useScroll()` — 滚动进度
- `whileHover` / `whileTap` — 交互态

---

## 十、更新日志

| 日期       | 版本 | 变更内容                                                            |
| ---------- | ---- | ------------------------------------------------------------------- |
| 2026-03-04 | v1.0 | 初始版本：视觉叙事策略、双引擎动效架构、Section 详细设计、色彩系统  |
| 2026-04-24 | v1.1 | 模型展示区改为三栏云脑图布局，对齐当前 landing 实现与能力总览卡结构 |

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
