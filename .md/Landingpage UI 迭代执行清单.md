# Nano Banana Canvas - Landingpage UI 迭代执行清单

> 文档版本：v1.0
> 创建日期：2026-04-23
> 关联文档：UI迭代需求.md、Landing Page 视觉策略.md、SEO 与 Open Graph 策略.md、项目执行规范.md

---

## 一、任务定位

本清单把 `UI迭代需求.md` 落成可执行任务。目标不是给 Landing 加更多装饰，而是把公开页改成一条清晰的创作叙事：图像节点生成逻辑、模型生态证明、功能解释、价格决策、FAQ 消除顾虑、CTA 转化。

当前任务量评估：中等偏大。涉及 Landing 首页、导航、页脚、Auth 页面、i18n、SEO、sitemap、公开子页面树和文档回环。若进入代码实现阶段，建议拆成 6 到 8 个小提交，而不是一次大改。

执行身份代入：

| 团队                        | 负责问题                       | 执行原则                     |
| --------------------------- | ------------------------------ | ---------------------------- |
| Framer/ReactBits 动效团队   | 滚动板块、脑图、Hero 流光      | 动效只服务叙事               |
| Linear 信息架构团队         | 导航、子页面树、FAQ            | 每个入口都必须可达           |
| Google Search 技术 SEO 团队 | FAQ、sitemap、结构化数据       | 可见内容与结构化数据同源     |
| Stripe 产品定价团队         | 首页定价摘要与 `/pricing` 分工 | 首页说清选择，详情页负责购买 |

---

## 二、当前事实

- [x] 已确认当前仓库为 Next.js 16 + React 19 + Tailwind v4 + next-intl。
- [x] 已确认 `BrandMark` 统一使用 `font-brand`，`Kaushan_Script` 已在 `[locale]/layout.tsx` 接入。
- [x] 已确认当前 `animejs` 与 `framer-motion` 未安装，视觉策略 v1.0 的依赖描述尚未落到真实 `package.json`。
- [x] 已确认当前 Landing 首页真实结构为 `HeroSection + SEO 内容区 + LandingFooter`。
- [x] 已确认当前 Hero 是文字节点，不是需求中的图像节点叙事。
- [x] 已确认当前导航存在无效企业版入口和按钮式下拉占位。
- [x] 已确认当前 FAQ 是三列静态布局，尚不是手风琴。
- [x] 已确认当前 `/pricing` 已有动态 Stripe 定价页，可作为首页定价区的详情承接页。
- [x] 已确认当前 `/contact` 位于 `(app)` 路由组，若作为公开资源入口需要迁移或重新定位。

---

## 三、默认产品决策

无需额外确认即可执行的默认决策：

- [ ] Hero 按钮与标签栏按钮改为黑白高对比；Landing 其他区域保持深色科技视觉，不扩散为整站黑白。
- [ ] 移除 Landing 导航里的企业版入口。
- [ ] Features、Models、Pricing、FAQ 优先做首页锚点，后续再扩展为独立 SEO 子页面。
- [ ] Testimonials 在没有真实用户反馈前，先使用“使用场景证明卡”，不伪造用户评价。
- [ ] 模型支持区文案区分“当前可用能力”和“生态规划支持”，避免误导。
- [ ] 复杂动效先用 CSS + IntersectionObserver 试做，只有模型脑图时间线确实需要时再引入 `animejs`。
- [ ] 移动端不强制一滚一屏，优先保证阅读、性能和 CTA 可达。
- [ ] Hero、Features、Auth 左侧视觉所需图片资产，默认属于交付范围；至少要交提示词，不允许留成“后续补图”。

需要在实现前再次确认的点：

- [ ] 是否要我直接生成 Hero 与登录页图片资产，还是只输出提示词由你生成。
- [ ] `/contact` 是否从 `(app)` 迁移到 `(landing)`，让它成为公开资源页。
- [ ] Testimonials 是否已有真实用户反馈素材；如果没有，按“使用场景证明卡”实现。

---

## 四、阶段清单

### Phase 0 - 文档与分支边界

- [x] LUI-000 创建任务分支：`docs/landingpage-ui-iteration-plan`。
- [x] LUI-001 阅读 `.md` 活文档、归档索引与 SEO 知识库索引。
- [x] LUI-002 阅读 Landing/Auth/SEO/Pricing/i18n 相关代码。
- [x] LUI-003 更新 `Landing Page 视觉策略.md` 为 v2.0。
- [x] LUI-004 新建本执行清单。
- [x] LUI-005 更新 `.md/CLAUDE.MD` 成员清单，纳入本执行清单。
- [x] LUI-006 校准黑白视觉范围：仅限 Hero 按钮与标签栏/胶囊按钮，Landing 其他区域保持深色科技视觉。

### Phase 1 - 品牌与基础视觉

- [ ] LUI-101 审核 `BrandMark` 在导航、Hero、Footer、Auth、Sidebar 的使用位置，禁止局部硬编码品牌字标。
- [x] LUI-102 放大主页中央、导航右上、登录页右侧品牌字标，统一使用艺术手写字体。
- [x] LUI-103 将 Hero 主 CTA 统一为黑白按钮系统：主按钮黑底白字，次按钮白底黑字或透明描边。
- [x] LUI-104 更新 `landing-dark` token，保留深色科技基底，并在 Hero 视觉中加入银灰玻璃反光、颗粒质感。
- [ ] LUI-105 检查深色留白，改为满屏铺展背景，不再让黑色大面积空着。

### Phase 2 - Landing 导航与页面骨架

- [x] LUI-201 移除企业版入口。
- [x] LUI-202 将 Features 链接指向首页 `#features` 或 `/features`。
- [x] LUI-203 将 Pricing 链接指向 `/pricing`。
- [x] LUI-204 将 Models 链接指向 `#models` 或 `/models`。
- [x] LUI-205 将 Resources 改成真实菜单：Docs、Community、Contact。
- [x] LUI-206 所有导航链接必须有真实 href，不允许保留无效 button 占位。
- [x] LUI-207 更新 `landing-nav.tsx` L3 头部、`components/layout/CLAUDE.md` 与 i18n key。

### Phase 3 - Hero 图像节点画布

- [x] LUI-301 将 Hero 画板容器扩大到接近全屏，桌面端建议逻辑尺寸不小于 `1440x760`。
- [x] LUI-302 将六个文字节点替换为图像节点，表达“脸部特征 + 人物 + 融合 + 场景 + 场景融合 + 动态输出”。
- [x] LUI-302A 节点 1 固定为“女孩脸部特征特写”，负责提供可被继承的面部特征。
- [x] LUI-302B 节点 2 固定为“另一个女孩的人像主体”，负责提供人物基础身份。
- [x] LUI-302C 节点 3 固定为“节点 1 + 节点 2 的融合结果”，必须一眼看出这是“拥有该面部特征的女孩”。
- [x] LUI-302D 节点 4 固定为“风景背景图”，负责提供环境，不得退化成文字标签。
- [x] LUI-302E 节点 5 固定为“节点 3 + 节点 4 的融合结果”，必须表达“这个女孩在这个风景中”。
- [x] LUI-302F 节点 6 固定为“节点 5 的动态视频感输出”，必须表达“这个女孩在动态风景中行走”，而不是静态终图。
- [x] LUI-302G 六节点叙事必须让用户看懂 `1+1=2` 的生成逻辑，不能退化成六张无因果关系的好看图片。
- [x] LUI-303 统一 SVG 与节点逻辑坐标，修复拖动后连线消失问题。
- [x] LUI-304 节点拖动使用边界约束，避免节点被容器裁掉。
- [x] LUI-305 连线增加流光或 dash 动效，表达数据流。
- [x] LUI-306 Hero 标题放大，减少描述文字，突出品牌和一句主张。
- [x] LUI-307 Hero CTA 改为黑白高对比，并进入 `/sign-in?redirect_url=/workspace`。
- [x] LUI-308 更新 `components/landing/CLAUDE.md`，如果拆分新组件则补全成员清单。

### Phase 4 - Section Snap 与节点式滚动条

- [x] LUI-401 新建 Landing section shell，统一 `min-height: 100svh`、`scroll-snap-align`、宽度铺满。
- [x] LUI-402 桌面端启用一滚一屏，移动端降级为自然滚动。
- [x] LUI-403 新建右侧节点式滚动 rail，显示 Hero、Models、Features、Pricing、Proof、FAQ、CTA。
- [x] LUI-404 rail 默认隐藏，滚动或鼠标接近时显示。
- [x] LUI-405 处理 `prefers-reduced-motion`，禁用非必要动画。

### Phase 5 - 模型支持动态脑图

- [x] LUI-501 新建 `ModelMindMapSection`。
- [x] LUI-502 中心节点为 Nano Banana Canvas，四类能力簇为 Text、Image、Video、Audio。
- [x] LUI-503 展示模型与厂商：MiniMax、Vidu、Qwen、OpenAI、Midjourney、Luma、Groq、xAI、Black Forest Labs、Runway、ByteDance、Google、Kling、Anthropic、Gemini、Alibaba Wan、OpenRouter、DeepSeek、ElevenLabs、Stability。
- [x] LUI-504 明确区分“当前真实运行时支持”和“生态展示/规划支持”。
- [x] LUI-505 进入与离开时做聚合/散开动画，避免静态 logo 墙。
- [x] LUI-506 未引入 `animejs`，本轮采用 CSS 动效 + `prefers-reduced-motion`，因此无需更新 `package.json` 与 lockfile。

### Phase 6 - Features 图文板块

- [x] LUI-601 新建 `FeaturesSection`。
- [x] LUI-602 功能 1：Visual Workflow，配图展示节点画布如何组织生产逻辑。
- [x] LUI-603 功能 2：Image Fusion，配图展示人物、风格、场景融合。
- [x] LUI-604 功能 3：Video Generation，配图展示静帧到动态镜头。
- [x] LUI-605 功能 4：Model Routing，配图展示多 Provider 统一接入。
- [x] LUI-606 所有图像资产使用统一提示词风格，不混用廉价 3D 或荧光风。
- [x] LUI-607 文案全部进入 `messages/en.json` 与 `messages/zh.json`。
- [x] LUI-608 为 Hero 六节点、Features 配图、登录页左侧主视觉提供可用图片资产，或提供可直接生成的高质量提示词包。
- [x] LUI-609 如果本轮不直接出图，必须产出按场景拆分的提示词清单与风格统一说明。

### Phase 7 - Pricing 首页摘要

- [x] LUI-701 首页定价区展示四档：Free、Standard、Pro、Ultimate。
- [x] LUI-702 首页只展示核心权益与进入 `/pricing` 的 CTA，不重复完整 Checkout 逻辑。
- [x] LUI-703 保留 Free 默认态解释，避免“购买 Free”心智。
- [x] LUI-704 定价 CTA 保持 Landing 深色科技按钮体系；黑白高对比仅用于 Hero 与标签栏/胶囊按钮。
- [x] LUI-705 `/pricing` 保持真实 Stripe 动态价格主链。

### Phase 8 - Proof 与 FAQ

- [ ] LUI-801 没有真实评价时，Testimonials 改为使用场景证明卡，不虚构用户头像和姓名。
- [ ] LUI-802 如果已有真实反馈，需记录来源与授权状态。
- [x] LUI-803 FAQ 改为点击展开的手风琴。
- [x] LUI-804 FAQ 文案与 `FAQPage` JSON-LD 共用同一数据源。
- [x] LUI-805 FAQ 留白加大，避免所有问题挤在一个密集网格里。

### Phase 9 - CTA + Footer

- [x] LUI-901 新建或恢复 `CtaSection`，最后一屏只负责转化。
- [x] LUI-902 Footer 调整为 Product、Resources、Company、Legal、Social。
- [x] LUI-903 Footer 链接必须指向真实页面或明确待建页面，不允许全部回到 `/`。
- [x] LUI-904 社交图标避免 emoji 占位，使用 Lucide 或真实品牌图标方案。

### Phase 10 - 公开子页面树

- [x] LUI-1001 新建 `/features` 总览页。
- [ ] LUI-1002 新建 `/features/visual-workflow`。
- [ ] LUI-1003 新建 `/features/image-generation`。
- [ ] LUI-1004 新建 `/features/video-generation`。
- [ ] LUI-1005 新建 `/features/model-routing`。
- [x] LUI-1006 新建 `/models`。
- [x] LUI-1007 新建 `/docs`。
- [ ] LUI-1008 新建 `/community` 或将公开社区入口明确指向现有 `/explore`。
- [x] LUI-1009 新建 `/about`。
- [ ] LUI-1010 决定并执行 `/contact` 公开化迁移。
- [ ] LUI-1011 新建 `/refund-policy`。
- [ ] LUI-1012 新建 `/acceptable-use`。
- [ ] LUI-1013 新建 `/cookie-settings`。
- [~] LUI-1014 同步 `sitemap.ts`、metadata、robots 边界和对应 `CLAUDE.md`。

### Phase 11 - 登录页视觉迭代

- [x] LUI-1101 移除左侧视觉区左上品牌标识。
- [x] LUI-1102 移除左下解释性旧需求文案。
- [x] LUI-1103 重写左侧诗意品牌文案，保留主标题、正文、三个板块。
- [x] LUI-1104 替换左侧视觉为“迷幻夜晚热气球升空”方向。
- [x] LUI-1105 右侧展示并放大 `BrandMark`。
- [x] LUI-1106 删除“输入邮箱和密码...”说明句。
- [x] LUI-1107 优化 Clerk 卡片阴影：向下、距离略远、扩散更大。
- [x] LUI-1108 同步 `auth` 文案、`components/auth/CLAUDE.md` 与 `(auth)/CLAUDE.md`。

### Phase 12 - 验证与回环

- [x] LUI-1201 运行 `pnpm --filter @nano-banana/web lint`。
- [x] LUI-1202 运行 `pnpm --filter @nano-banana/web test`。
- [x] LUI-1203 运行 `pnpm --filter @nano-banana/web build`。
- [x] LUI-1204 如新增/修改 i18n key，运行 `pnpm --filter @nano-banana/web i18n:check`。
- [ ] LUI-1205 如新增公开页面，检查 `sitemap.xml` 路由与 canonical。
- [ ] LUI-1206 检查移动端、桌面端、`prefers-reduced-motion`。
- [x] LUI-1207 检查 L3 文件头、L2 CLAUDE、L1 CLAUDE 是否需要同步。
- [ ] LUI-1208 每个阶段完成后做本地 commit，避免巨大不可回溯提交。
- [x] LUI-1209 坏味道治理：拆分 `hero-section.tsx` 与 `landing-sections.tsx` 的多职责结构，新增 `hero-canvas.tsx` 与 `landing/sections/` 子模块。
- [x] LUI-1210 部署回归修复：Hero 主 CTA 恢复为 `Get Started` / `开始使用`，对齐 E2E 的公开首页 CTA 可见性断言。
- [x] LUI-1211 推送部署闭环：`main` 推送至 `742782d` 后触发 GitHub Actions `24826523254`，`Lint & Build` 与 `Deploy` 均通过，Web 与 API Worker 已完成部署。
- [x] LUI-1212 部署坏味道清理：删除缺失 `.gitmodules` 映射的 `.md/Google-SEOs.skill` gitlink 与本地目录，`git submodule status --recursive` 不再报错。

---

## 五、资产提示词

Hero 六节点统一风格：

```text
Cinematic monochrome editorial still, subtle silver highlights, soft film grain, reflective glass surface, high-end AI creative workflow aesthetic, black background, realistic but dreamlike, 16:10, no text, no watermark.
```

登录页左侧图像：

```text
Psychedelic dreamlike night scene, surface-level granular reflections, iridescent flowing light, many hot air balloons rising from uneven rolling ground, low angle upward view, distant balloons still on the ground and others already in the sky, stars interweaving with balloon lights, lens flare material, cinematic, magical but premium, no text, no logo.
```

Features 图文区统一风格：

```text
Premium cinematic monochrome product still, deep black background, silver glass reflections, soft film grain, high-end AI workflow interface, subtle volumetric light, no neon, no cheap 3D, no text, no watermark, 16:10.
```

Visual Workflow 配图：

```text
Premium cinematic monochrome product still of a node-based AI workflow canvas, four glass nodes connected by silver flowing lines, visible prompt node, branching logic node, model node, output node, deep black background, soft film grain, no text, no watermark, 16:10.
```

Image Fusion 配图：

```text
Premium cinematic monochrome product still showing image fusion logic, two source portrait cards and one scene reference card merging into a coherent final portrait-in-scene result, silver glass panels, visible connection lines, deep black background, no text, no watermark, 16:10.
```

Video Generation 配图：

```text
Premium cinematic monochrome product still showing still frames evolving into motion, three sequential video keyframes on a dark glass timeline, subtle motion blur and silver progress path, cinematic AI production interface, no text, no watermark, 16:10.
```

Model Routing 配图：

```text
Premium cinematic monochrome product still showing a central AI router node connected to multiple provider nodes, OpenAI-like text model route, image route, video route, storage route, silver glass network lines, deep black background, no logos, no text, no watermark, 16:10.
```

---

## 六、坏味道与风险

- 文档失配：`components/CLAUDE.md` 仍提到 `FloatingCards + CtaSection`，真实 landing 目录只有 `HeroSection`。实现阶段必须同步修复。
- 依赖失配：视觉策略 v1.0 提到 `animejs` 与 `framer-motion`，真实依赖未安装。实现阶段必须先决定是否引入。
- 路由风险：`/contact` 当前在 `(app)` 下，公开资源菜单直接指向它可能把用户带入 App 语义。
- SEO 风险：Testimonials 不得伪造用户评价，FAQ JSON-LD 不得标记页面不可见内容。
- 性能风险：全屏 snap、脑图动画和大图资产可能影响 LCP，必须用静态首屏、懒加载和 reduced motion 兜底。

---

## 七、完成定义

完成不等于 UI 看起来更炫。完成必须同时满足：

- [ ] 需求文档中的视觉、导航、Hero、FAQ、模型区、子页面树、登录页诉求均已覆盖。
- [ ] Hero 六节点仍保留“脸部特征 -> 人物主体 -> 人物融合 -> 风景 -> 场景融合 -> 动态输出”的因果叙事。
- [ ] 公开页没有无效链接。
- [ ] i18n、metadata、sitemap、robots 与页面现实一致。
- [ ] 文档 L1/L2/L3 完成回环。
- [ ] lint/test/build 已运行，或明确记录未运行原因。
- [ ] 每个阶段都有清晰 git 留痕。

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
