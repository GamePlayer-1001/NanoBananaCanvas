# Nano Banana Canvas - Landing Page 视觉策略

> 文档版本：v2.0
> 创建日期：2026-03-04
> 更新日期：2026-04-23
> 关联文档：项目框架结构.md、项目执行规范.md、archive/差距分析报告.md

---

## 一、设计哲学

### 1.1 视觉叙事主线

```
黑暗中浮现光芒 → 展示创造的可能性 → 证明工具的力量 → 引导行动

具体映射：
Hero（震撼开场）→ 模型展示（能力证明）→ 功能演示（操作实感）→ 社区作品（社会证明）→ 定价（决策引导）→ CTA（临门一脚）
```

### 1.2 核心设计原则

| 原则       | 说明                                              | 禁忌                   |
| ---------- | ------------------------------------------------- | ---------------------- |
| 深色科技风 | 背景 `#0B0B0F` → `#000000` 渐变，内容在暗色中浮现 | 禁止使用荧光色（neon） |
| 克制的色彩 | 主色低饱和紫蓝，点缀金属银灰，高光仅用于 CTA      | 禁止大面积高饱和色块   |
| 呼吸感留白 | Section 间距 120-160px，元素间距 32-48px          | 禁止信息堆砌           |
| 渐进式揭示 | 内容随滚动渐入，不一次性暴露全部信息              | 禁止全页面同时加载动画 |

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
│                30+ AI Models, One Canvas                         │
│                                                                   │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  │
│   │ Sora │  │ FLUX │  │ Kling│  │ SD   │  │ EL   │  │ GPT  │  │
│   │ 视频 │  │ 图片 │  │ 视频 │  │ 图片 │  │ 音频 │  │ 文本 │  │
│   └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  │
│   (anime.js 水平无限滚动 + 悬停暂停)                              │
│                                                                   │
│              Video ● Image ● Audio ● Text                        │
│   (Framer Motion AnimatePresence 切换内容)                        │
│                                                                   │
│   ┌─────────────────────────────────────────────────┐           │
│   │  当前分类的模型详情卡片                            │           │
│   │  (Framer Motion layout 过渡)                     │           │
│   └─────────────────────────────────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素           | 引擎                    | 动画                            | 时机           |
| -------------- | ----------------------- | ------------------------------- | -------------- |
| Section 标题   | anime.js ScrollObserver | opacity 0→1 + Y:40→0            | 进入视口 20%   |
| 模型 Logo 轮播 | anime.js                | translateX 持续滚动，hover 暂停 | Section 可见后 |
| 分类 Tab       | Framer Motion           | layoutId 下划线滑动             | 用户交互       |
| 模型详情卡片   | Framer Motion           | AnimatePresence mode="wait"     | Tab 切换       |

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

### 3.4 Community Gallery Section

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│              Created by the Community                            │
│                                                                   │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│   │ 作品 │ │ 作品 │ │ 作品 │ │ 作品 │ │ 作品 │ │ 作品 │       │
│   │ 卡片 │ │ 卡片 │ │ 卡片 │ │ 卡片 │ │ 卡片 │ │ 卡片 │       │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│   (anime.js stagger 从底部渐入，3列×2行 = 6张)                    │
│                                                                   │
│                    [Explore More →]                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**动效清单**：

| 元素              | 引擎          | 动画                                              | 时机           |
| ----------------- | ------------- | ------------------------------------------------- | -------------- |
| 作品卡片网格      | anime.js      | stagger grid，opacity 0→1 + Y:60→0 + scale 0.95→1 | 滚动进入       |
| 卡片悬停          | Framer Motion | whileHover scale 1.03 + shadow 增强               | 用户交互       |
| Explore More 按钮 | Framer Motion | 箭头 X 微移 loop                                  | 卡片动画完成后 |

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

### 3.7 Footer

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

## 十、v2.0 Landingpage UI 迭代方案

### 10.1 现象诊断

当前 Landing 的真实代码结构是 `HeroSection + SEO 内容区 + LandingFooter`，Hero 内部是文字节点卡片与 SVG 连线，导航包含无效按钮，FAQ 是三列静态卡片。该结构能表达“画布工具”，但还没有表达“图像生成逻辑”和“多模型生产网络”，因此用户感知会停留在工具截图，而不是创作叙事。

需求中的核心矛盾不是“多加动画”，而是视觉叙事缺少单一主轴。新的主轴应改为：

```
图像特征输入 -> 人物融合 -> 场景融合 -> 动态视频输出 -> 多模型网络支撑 -> 功能与价格证明 -> FAQ 消除顾虑 -> CTA 转化
```

### 10.2 本质方案

Landing 应从“深色科技展示页”升级为“黑白电影感的全屏创作旅程”。页面不再依赖零散卡片堆叠，而是采用全屏 Section snap：鼠标滚轮一次推进一个叙事板块，右侧以自动隐藏的节点式进度轨提示当前位置。能被一屏讲清的内容不跨屏重复，能用图像讲清的能力不再用文字节点解释。

最适合解决该任务的团队组合是：

| 角色                          | 代入方式                                   | 落地标准                     |
| ----------------------------- | ------------------------------------------ | ---------------------------- |
| Framer/ReactBits 视觉动效团队 | 先定义滚动节奏和动效语法，再拆组件         | 动效服务叙事，不做无意义漂浮 |
| Linear/Stripe 信息架构团队    | 去掉无效入口，把价格、FAQ、法务路径变清楚  | 每个链接都有明确目标         |
| Google Search 技术 SEO 团队   | 子页面树服务搜索意图，FAQ 与结构化数据同源 | 不造假、不堆关键词、不做门页 |
| 顶级电影概念设计团队          | 用图像节点表达 1+1=2 的生成逻辑            | Hero 一眼看懂“画布如何创造”  |

### 10.3 新页面结构

```
Hero 首屏区
模型支持动态脑图区
Features 功能特性展示区
Pricing 定价预览区
Testimonials 社会证明区
FAQ 常见问题区
CTA + Footer 底部转化区
```

执行原则：

- Hero 负责建立“可视化生成逻辑”，不要承载所有功能说明。
- 模型支持区负责证明生态广度，不要塞到 Hero 的小字里。
- Features 负责图文并茂地解释核心能力，每个功能对应一张视觉资产或动效演示。
- Pricing 首页只展示四档摘要，复杂购买模式继续交给 `/pricing`。
- Testimonials 如果没有真实用户反馈，先用“使用场景证明卡”替代，避免伪造评价污染信任与 SEO。
- FAQ 保留在首页但改为手风琴，结构化数据只引用页面真实可见问答。

### 10.4 视觉系统修订

| 项目      | v1.0                | v2.0                                           |
| --------- | ------------------- | ---------------------------------------------- |
| 主色      | 低饱和紫蓝强调      | 黑白为主，银灰与玻璃质感为辅                   |
| CTA       | 品牌紫蓝按钮        | 黑底白字、白底黑字，两种高对比按钮             |
| 品牌字标  | `font-brand` 已接入 | 全站统一放大艺术手写字标，优先复用 `BrandMark` |
| 背景      | 暗色渐变 + 点阵     | 满屏黑色电影感背景 + 颗粒、柔光、玻璃反射      |
| 内容密度  | 多卡片并列          | 一屏一主题，少字大图，大留白但不空洞           |
| Hero 节点 | 文本节点            | 图片节点，表达人物、特征、场景、动态结果       |

推荐配色：

```css
:root {
  --landing-bg-base: #030303;
  --landing-bg-panel: #0a0a0a;
  --landing-ink: #f7f4ee;
  --landing-muted: rgba(247, 244, 238, 0.62);
  --landing-faint: rgba(247, 244, 238, 0.34);
  --landing-line: rgba(247, 244, 238, 0.14);
  --landing-glass: rgba(255, 255, 255, 0.055);
  --landing-cta-dark: #050505;
  --landing-cta-light: #f7f4ee;
  --landing-reflection: rgba(255, 255, 255, 0.18);
}
```

保留约束：

- 不使用大面积蓝白按钮。
- 不使用荧光色与彩虹渐变。
- 不用三层以上嵌套的特殊动画逻辑。
- 品牌字标统一走 `BrandMark`，不在各组件里各自写字体。

### 10.5 Hero 图像节点叙事

Hero 画板应扩大为接近全屏的视觉容器，节点不再是文字卡片，而是六个图像节点：

| 节点 | 内容                             | 连接语义           |
| ---- | -------------------------------- | ------------------ |
| 1    | 女孩 A 的脸部特征特写            | 提供人物特征       |
| 2    | 女孩 B 的人像                    | 提供人物主体       |
| 3    | 融合结果：拥有 A 特征的女孩 B    | 节点 1 + 节点 2    |
| 4    | 风景背景图                       | 提供环境           |
| 5    | 女孩置入风景                     | 节点 3 + 节点 4    |
| 6    | 女孩在动态风景中行走的视频感预览 | 节点 5 -> 动态输出 |

Hero 连线消失问题的正确修法不是增加更多边界 if，而是统一坐标系：

- 画板使用固定逻辑坐标和响应式缩放。
- SVG 使用与节点相同的逻辑尺寸和 `overflow: visible`。
- 节点拖动被限制在逻辑画板安全边界内。
- 连线路径从节点中心端口计算，不依赖容器裁剪。

### 10.6 滚动与动效策略

桌面端采用 Section snap：

- 页面容器使用 `scroll-snap-type: y mandatory`。
- 每个核心板块使用 `min-height: 100svh` 与 `scroll-snap-align: start`。
- 滚轮一次只推进一个板块，避免轻触滚轮滚过多屏。
- 右侧进度条改为节点式 rail，默认透明，滚动或鼠标接近时展示。

动效职责：

| 场景              | 首选实现                               | 说明                     |
| ----------------- | -------------------------------------- | ------------------------ |
| Section 进入/离开 | CSS + IntersectionObserver 或 anime.js | 先做可控，不为依赖而依赖 |
| Hero 连线流光     | SVG stroke-dashoffset / anime.js       | 表达数据流               |
| 模型脑图聚合      | anime.js timeline                      | 多点进入、聚合、离场     |
| FAQ 展开          | shadcn Collapsible + CSS transition    | 轻交互，少依赖           |
| Pricing 切换      | 现有 React state + CSS transition      | 保持现有稳定逻辑         |

当前代码未安装 `animejs` 与 `framer-motion`。执行时应先做依赖决策：如果只需要 Section reveal、FAQ、CTA hover，CSS 与 React 即可；如果要实现复杂脑图时间线，再引入 `animejs`。不要为了追求“看起来高级”提前引入两套动画引擎。

### 10.7 模型支持动态脑图

模型区采用云脑图，而不是横向 logo 堆砌。中心节点是 `Nano Banana Canvas`，四个能力簇围绕展开：

- 文本与推理：OpenAI、Anthropic、xAI、Groq、Qwen、DeepSeek、OpenRouter、Google Gemini。
- 图像：Midjourney、Black Forest Labs、Qwen Image、Google Imagen/Gemini、OpenAI、Stability。
- 视频：Runway、Luma、Kling、Vidu、MiniMax、ByteDance、Alibaba Wan、Google。
- 音频：OpenAI Audio、ElevenLabs、MiniMax、Google。

页面文案必须区分“当前真实运行时支持”和“生态规划支持”。真实运行时以 `ai_models`、`MODEL_PROVIDER_OPTIONS`、`ai-node-config` 为准；视觉展示可以表达生态方向，但不能误导为全部已接线可用。

### 10.8 子页面树

公开页面树建议如下：

```
/
/features
/features/visual-workflow
/features/image-generation
/features/video-generation
/features/model-routing
/models
/pricing
/docs
/community
/about
/contact
/terms
/privacy
/refund-policy
/acceptable-use
/cookie-settings
```

执行约束：

- 当前 `/contact` 位于 `(app)` 路由组，若要作为公开资源入口，应迁移到 `(landing)` 路由组，避免公开页进入 AppSidebar 语义。
- 新增页面必须同步 `sitemap.ts`、metadata、i18n、对应 `CLAUDE.md`。
- `features/*` 页面不做薄内容，每页必须有独立主意图、图像资产、FAQ 或可验证能力说明。

### 10.9 Auth 页面方向

登录页左侧视觉保留“好看”的大图氛围，但移除左上品牌标识与左下解释性旧需求文案。新的左侧图像方向：

```
迷幻夜晚，表层颗粒反光，流光溢彩，大量热气球从起伏地面升空，仰拍视角，远处未升空与已升空的热气球和星星交相辉映，镜头眩光材质，电影感，梦幻但不甜腻。
```

右侧调整：

- Logo 必须展示，并使用放大的 `BrandMark`。
- 删除“输入邮箱和密码...”这类说明性句子。
- Clerk 卡片阴影改为向下投影，距离略远，扩散更大，避免贴纸感。

### 10.10 图像资产提示词

图像资产交付原则：

- Hero 六节点图像、Features 图文区配图、登录页左侧主视觉，必须纳入交付范围。
- 交付形式允许两种：直接产出可用图片资产，或产出可直接用于生成的高质量提示词。
- 如果阶段目标是先验证版式与叙事，可先交提示词；如果阶段目标是接近上线预览，应直接交付图片资产。
- 不允许只写“这里以后补图”，而没有资产方案或提示词方案。

Hero 六节点统一风格提示词：

```text
Cinematic monochrome editorial still, subtle silver highlights, soft film grain, reflective glass surface, high-end AI creative workflow aesthetic, black background, realistic but dreamlike, 16:10, no text, no watermark.
```

节点 1：

```text
Close-up portrait crop of a young woman's facial features, expressive eyes, delicate cheek structure, cinematic monochrome, silver reflection, soft grain, black background, no text.
```

节点 2：

```text
Half-body portrait of another young woman, calm confident expression, minimal black studio background, cinematic monochrome, subtle glass reflection, no text.
```

节点 3：

```text
Portrait of the second woman carrying the distinctive facial features from the first reference, elegant and coherent identity fusion, cinematic monochrome, silver highlights, no text.
```

节点 4：

```text
Surreal night landscape, rolling ground, distant lights, subtle mist, cinematic monochrome with silver highlights, empty space for composition, no text.
```

节点 5：

```text
The fused woman standing inside the surreal night landscape, coherent lighting, cinematic monochrome, reflective particles, soft lens bloom, no text.
```

节点 6：

```text
Video keyframe feeling: the same woman walking through the dynamic surreal night landscape, motion blur, flowing particles, cinematic monochrome, silver lens flare, no text.
```

登录页左侧图像提示词：

```text
Psychedelic dreamlike night scene, surface-level granular reflections, iridescent flowing light, many hot air balloons rising from uneven rolling ground, low angle upward view, distant balloons still on the ground and others already in the sky, stars interweaving with balloon lights, lens flare material, cinematic, magical but premium, no text, no logo.
```

### 10.11 验收标准

- 首页每个核心板块一屏完成主要表达，桌面端滚轮一次推进一屏。
- Hero 图像节点拖动时连线不消失，节点不会被容器硬裁掉。
- 主 CTA 全部改为黑白高对比，不再使用蓝白主按钮。
- 导航不再出现无效按钮，企业版入口移除。
- FAQ 改为可展开收起，结构化数据与页面可见内容一致。
- 新子页面树进入 sitemap，私有页面继续 noindex。
- `BrandMark` 是唯一品牌字标入口，主页、导航、登录页全部使用艺术手写字体。
- 移动端不强行执行复杂 snap，优先保证阅读和 CTA 可达。

## 十一、更新日志

| 日期       | 版本 | 变更内容                                                                                                          |
| ---------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| 2026-03-04 | v1.0 | 初始版本：视觉叙事策略、双引擎动效架构、Section 详细设计、色彩系统                                                |
| 2026-04-23 | v2.0 | 根据 UI 迭代需求更新 Landing 为黑白电影感、满屏板块滚动、图像节点叙事、模型动态脑图、FAQ 手风琴与公开子页面树方案 |

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
