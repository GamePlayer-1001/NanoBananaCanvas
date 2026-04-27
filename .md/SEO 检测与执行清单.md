# Nano Banana Canvas - SEO 检测与执行清单

> 文档版本：v1.0
> 创建日期：2026-04-27
> 适用范围：当前 `apps/web` 公开站点的静态代码 SEO 审计
> 检测方式：代码审计 + 路由结构审计 + metadata/robots/sitemap/结构化数据检查
> 说明：本次未接入 Google Search Console、Bing Webmaster、真实日志、线上 Lighthouse，因此结论聚焦“站内可见事实”，不伪造线上收录与流量结果

---

## 一、检测结论

### 1.1 总体判断

当前站点已经具备一层像样的 SEO 基础骨架：

1. 已有统一的 metadata 工厂：`apps/web/lib/seo.ts`
2. 已有动态 `robots.ts` 与 `sitemap.ts`
3. 首页已经落了 `Organization + SoftwareApplication + FAQPage`
4. 大部分公开营销页都在独立生成 `title / description / canonical / OG / Twitter`

但如果按“真正要让这个站稳定吃到自然搜索流量”的标准看，当前仍有三类结构性问题：

1. **多语言 SEO 目前并未真正成立**
2. **部分高价值公开页的搜索信号仍然缺失或不完整**
3. **项目文档中的 SEO 目标，和代码现状之间仍存在明显落差**

### 1.2 风险等级

- **高风险**：多语言 URL 策略与 `hreflang` 能力缺失，导致中英内容不能作为两套独立搜索资产运营
- **中风险**：部分公开页未补页面级 metadata，动态内容页未补结构化数据，影响收录质量与结果页表达
- **中风险**：sitemap 与公开页面策略不够精细，仍带有“能收就全收”的倾向
- **低风险**：OG、404、法务页等辅助信号仍可继续打磨

### 1.3 当前评分

按 `.md/seo.txt` 中的四维框架做静态估算：

| 维度         | 当前估分 | 判断                                                     |
| ------------ | -------- | -------------------------------------------------------- |
| 技术 SEO     | 72 / 100 | 基础设施已具备，但多语言、结构化数据和 sitemap 精度不足  |
| 页面质量     | 76 / 100 | 首页和主营销页较完整，部分法务/详情页缺口明显            |
| 性能准备度   | 75 / 100 | Next.js 16 + SSR/SSG 架构有优势，但本轮未做真实 CWV 实测 |
| 内容与关键词 | 68 / 100 | 已有营销文案和关键词意识，但页面职责与关键词承接仍不够细 |

**综合静态评分：73 / 100**

这不是“不能上线”的分数，但离“稳定拿搜索流量的生产态 SEO 站点”还有一段距离。

---

## 二、检测范围

本次已检查：

1. `.md` 目录全部主文档、归档文档与 `Google-SEOs.skill` 核心说明
2. Google SEO Skill 的以下参考：
   - `references/06-specialty/implementation-playbook.md`
   - `references/06-specialty/multilingual-seo-playbook.md`
   - `references/06-specialty/keyword-optimization-playbook.md`
   - `references/07-patterns/常见问题诊断.md`
3. 当前项目 SEO 关键代码：
   - `apps/web/app/layout.tsx`
   - `apps/web/app/robots.ts`
   - `apps/web/app/sitemap.ts`
   - `apps/web/lib/seo.ts`
   - `apps/web/middleware.ts`
   - `apps/web/i18n/config.ts`
   - `apps/web/i18n/routing.ts`
   - 公开营销页、公开社区页、认证页、404 页、OG 图片接口

---

## 三、核心问题与根因

### P0-1 多语言 SEO 没有真正建立

#### 现象层

1. 当前 i18n 路由是 `localePrefix: 'never'`
2. 外部公开 URL 只有一套：
   - `/`
   - `/features`
   - `/models`
   - `/pricing`
3. `buildPageMetadata()` 只输出 canonical，不输出 `hreflang`
4. `.md/archive/SEO 与 Open Graph 策略.md` 也明确写了“当前不输出 hreflang”

#### 本质层

这代表当前站点虽然“支持中英文界面”，但并没有形成两套可独立索引的语言 URL 资产。

对搜索引擎来说：

1. 同一 URL 只能稳定承接一种主语言信号
2. 无法建立 `en` 与 `zh` 版本之间的对应关系
3. 无法把中英内容分别投放到不同语言搜索场景

#### 代码证据

1. `apps/web/i18n/routing.ts`
2. `apps/web/lib/seo.ts`
3. `apps/web/middleware.ts`

#### 官方依据

1. `references/06-specialty/multilingual-seo-playbook.md`
2. `references/02-crawling-indexing/consolidate-duplicate-urls.md`
3. `references/03-ranking-appearance/site-names.md`

#### 判断

这是当前 SEO 最大的结构性限制。  
如果你后续明确要做中文 SEO 和英文 SEO 两条线，这个问题必须优先解决。

---

### P0-2 法务高信任页 metadata 不完整

#### 现象层

`/privacy` 与 `/terms` 页面当前没有独立 `generateMetadata()`，会退回根布局默认 metadata。

#### 本质层

法务页不是流量主入口，但它是：

1. 信任页
2. 品牌实体页的一部分
3. 搜索引擎理解商业网站完整性的辅助信号

如果这些页面始终继承首页默认标题与描述，会让页面主题表达失真。

#### 代码证据

1. `apps/web/app/[locale]/(landing)/privacy/page.tsx`
2. `apps/web/app/[locale]/(landing)/terms/page.tsx`
3. 对比：
   - `apps/web/app/[locale]/(landing)/refund-policy/page.tsx`
   - `apps/web/app/[locale]/(landing)/acceptable-use/page.tsx`
   - `apps/web/app/[locale]/(landing)/cookies/page.tsx`

#### 官方依据

1. `references/06-specialty/implementation-playbook.md`
2. `references/03-ranking-appearance/title-link.md`
3. `references/03-ranking-appearance/snippet.md`

#### 判断

这是低成本高价值修复项，应该直接做。

---

### P0-3 公开详情页缺少结构化数据闭环

#### 现象层

首页已有 JSON-LD，但社区详情页 `/explore/[id]` 当前只有 metadata，没有结构化数据。

同时，归档策略文档曾规划：

1. `CreativeWork`
2. 动态 OG
3. 公开内容页专属 SEO 表达

但当前代码未完整落地。

#### 本质层

如果 `explore/[id]` 是你未来希望承接长尾搜索和模板搜索的页面，那么它应该是“内容资产页”，而不是“只有 title/description 的普通详情页”。

缺失结构化数据会导致：

1. 搜索引擎对页面实体理解不完整
2. 分享与结果页表达的可塑性变弱
3. 无法把“工作流模板”进一步明确定义成可理解对象

#### 代码证据

1. `apps/web/app/[locale]/(app)/explore/[id]/page.tsx`
2. `apps/web/app/api/og/route.tsx`
3. 对照文档：`.md/archive/SEO 与 Open Graph 策略.md`

#### 官方依据

1. `references/04-structured-data/search-gallery.md`
2. `references/03-ranking-appearance/title-link.md`
3. `references/06-specialty/implementation-playbook.md`

#### 判断

如果社区模板页要吃 SEO，这项应进入本周任务。

---

### P1-1 Pricing 页缺少 Product / Offer 结构化数据

#### 现象层

`/pricing` 页面有完整 metadata，但当前没有 `Product / Offer` JSON-LD。

#### 本质层

定价页天然适合承接：

1. 品牌词 + pricing intent
2. 产品定价页收录
3. 结果页对套餐结构的机器理解

虽然结构化数据不保证排名，但它有助于搜索引擎更准确理解页面主题。

#### 代码证据

1. `apps/web/app/[locale]/(landing)/pricing/page.tsx`
2. `apps/web/components/pricing/pricing-content.tsx`

#### 官方依据

1. `references/04-structured-data/product.md`
2. `references/04-structured-data/organization.md`
3. `references/06-specialty/implementation-playbook.md`

---

### P1-2 sitemap 的 `lastModified` 质量不高

#### 现象层

静态页面 sitemap 当前统一使用 `new Date()`。

#### 本质层

这意味着每次生成 sitemap，都像在告诉搜索引擎“所有静态页今天刚改过”。  
这不算致命错误，但不是高质量信号。

#### 代码证据

1. `apps/web/app/sitemap.ts`

#### 官方依据

1. `references/02-crawling-indexing/sitemaps-overview.md`
2. `references/06-specialty/implementation-playbook.md`

#### 判断

建议改为真实内容更新时间，或静态常量日期。

---

### P1-3 sitemap 公开页边界还不够克制

#### 现象层

当前 sitemap 主动提交了：

1. `/video-analysis`
2. `/workflows`
3. `/explore`
4. `/explore/[id]`

其中：

1. `/explore` 与 `/workflows` 适合作为公开聚合页
2. `/explore/[id]` 适合作为公开内容页
3. `/video-analysis` 更像工具页，是否应索引，需要重新定义

#### 本质层

不是所有可访问页面都应该进入 sitemap。  
Google 更偏好“明确、有价值、希望被索引”的 URL 集合。

#### 代码证据

1. `apps/web/app/sitemap.ts`
2. `apps/web/app/[locale]/(app)/video-analysis/page.tsx`

#### 官方依据

1. `references/02-crawling-indexing/sitemaps-overview.md`
2. `references/07-patterns/常见问题诊断.md`

#### 判断

如果 `video-analysis` 缺少足够可读的公开内容，而更像登录后功能页，建议从 sitemap 移除，或改成 `noindex`。

---

### P1-4 法务与品牌页关键词承接还偏弱

#### 现象层

营销页的 title/description 已经比很多项目好，但关键词布局仍主要集中在：

1. AI workflow
2. GPT Image 2
3. image generation
4. multimodal

当前还缺少更明确的“页面职责映射表”：

1. 首页吃什么词
2. `/features` 吃什么词
3. `/models` 吃什么词
4. `/pricing` 吃什么词
5. `/explore/[id]` 吃什么长尾词

#### 本质层

这不是 metadata 的问题，而是关键词映射尚未被制度化。  
如果不做页面与关键词的一一映射，后续会出现：

1. 标题趋同
2. 多页争抢同一主词
3. 内容页无法稳定承接长尾搜索

#### 官方依据

1. `references/06-specialty/keyword-optimization-playbook.md`
2. `references/01-fundamentals/creating-helpful-content.md`

---

### P2-1 OG 与社交分享仍有提升空间

#### 现象层

当前全站 OG 图片统一走 `apps/web/app/api/og/route.tsx`，以通用标题图为主。

#### 本质层

对 SEO 的直接影响有限，但会影响：

1. 社交分享点击率
2. 社区详情页的传播质量
3. 品牌一致性

#### 判断

后续可为首页、pricing、explore detail 做更贴近页面实体的 OG 图模板。

---

## 四、当前已做得对的地方

这部分很重要，因为不是要把现状说成一片废墟。

### 4.1 已具备统一 metadata 真相源

`apps/web/lib/seo.ts` 已经统一收口：

1. canonical
2. robots
3. OG
4. Twitter

这是好事，说明后续修复可以“一处收口，多页受益”。

### 4.2 已具备基础抓取控制

`apps/web/app/robots.ts` 已经正确挡住：

1. `/api/`
2. `/sign-in`
3. `/sign-up`
4. `/workspace/`
5. `/canvas/`

这符合“公开页可抓，私有功能页不浪费 crawl budget”的基本方向。

### 4.3 首页已有结构化数据意识

首页当前已经落地：

1. `Organization`
2. `SoftwareApplication`
3. `FAQPage`

这说明不是从零开始，而是已经有 SEO 工程意识。

### 4.4 营销页有真实页面级 metadata

以下页面都已经在独立生成 metadata：

1. `/`
2. `/features`
3. `/models`
4. `/docs`
5. `/community`
6. `/about`
7. `/contact`
8. `/pricing`
9. `/refund-policy`
10. `/acceptable-use`
11. `/cookies`

这比“全站只有一个默认 title”要强很多。

---

## 五、分阶段执行清单

## Phase 0：立即修复（本周内）

- [ ] 把多语言 SEO 方向定下来：继续“隐藏 locale，只做单语索引”，还是切换为“显式语言 URL”
- [ ] 给 `/privacy` 增加 `generateMetadata()`
- [ ] 给 `/terms` 增加 `generateMetadata()`
- [ ] 重新评估 `/video-analysis` 是否应该进入 sitemap
- [ ] 为 sitemap 静态页改成真实 `lastModified`，不要每次都用当前时间

### 推荐落点

1. `apps/web/app/[locale]/(landing)/privacy/page.tsx`
2. `apps/web/app/[locale]/(landing)/terms/page.tsx`
3. `apps/web/app/sitemap.ts`

## Phase 1：结构性优化（1 周）

- [ ] 为 `/pricing` 添加 `Product / Offer` JSON-LD
- [ ] 为 `/explore/[id]` 添加 `CreativeWork` 或更合适的结构化数据
- [ ] 为 `/explore/[id]` 补更贴合实体的 OG 表达
- [ ] 明确哪些公开页应该 `index`，哪些公开页虽然可访问但不值得进入搜索结果
- [ ] 输出“页面 - 主关键词 - 次关键词 - 支撑词”映射表

### 推荐落点

1. `apps/web/app/[locale]/(landing)/pricing/page.tsx`
2. `apps/web/app/[locale]/(app)/explore/[id]/page.tsx`
3. `apps/web/lib/seo.ts`
4. 新增关键词映射文档，可并入本文件后续版本

## Phase 2：真正建立多语言 SEO（如果要做国际化搜索）

- [ ] 把 `localePrefix: 'never'` 改成可索引语言路径策略
- [ ] 为 `en` / `zh` 建立真实独立 URL
- [ ] 输出 `hreflang` 与 `x-default`
- [ ] 让 canonical 与语言 URL 一一对应
- [ ] 为不同语言版本做独立 sitemap
- [ ] 把中英文 metadata、schema 文本、法务文本继续做深度本地化校对

### 推荐落点

1. `apps/web/i18n/routing.ts`
2. `apps/web/middleware.ts`
3. `apps/web/lib/seo.ts`
4. 各公开页 `generateMetadata()`

## Phase 3：增长型 SEO（2-6 周）

- [ ] 建立首页、features、models、pricing、explore detail 的关键词地图
- [ ] 为模板详情页设计可承接长尾的正文结构
- [ ] 规划 blog/docs/help 类内容入口，承接问题型搜索
- [ ] 接入 Search Console、Bing Webmaster、PageSpeed Insights 周期复盘
- [ ] 建立“高展示低点击页”与“多 URL 抢词页”的月度复盘机制

---

## 六、推荐页面关键词映射（首版）

### 首页 `/`

- 主关键词：
  - visual AI workflow builder
  - AI workflow platform
- 次关键词：
  - multimodal workflow
  - GPT Image 2 workflow
- 支撑词：
  - creators
  - teams
  - prompt systems
  - video analysis

### `/features`

- 主关键词：
  - AI workflow features
  - visual workflow builder features
- 次关键词：
  - AI canvas
  - workflow orchestration

### `/models`

- 主关键词：
  - AI model directory
  - GPT Image 2 / image generation models
- 次关键词：
  - multimodal AI models
  - image and video AI models

### `/pricing`

- 主关键词：
  - Nano Banana Canvas pricing
  - AI workflow pricing
- 次关键词：
  - AI credits pricing
  - image generation pricing

### `/explore/[id]`

- 主关键词：
  - workflow title 本身
  - AI workflow template
- 次关键词：
  - reusable workflow
  - creator workflow
  - image/video prompt chain

说明：  
这只是首版方向，不是最终词表。真正上线前最好结合 Search Console 与关键词工具再二次校准。

---

## 七、验证方式

### 7.1 代码侧验证

- [ ] 确认所有公开页都有独立 metadata
- [ ] 确认 `robots.txt`、`sitemap.xml` 可正常生成
- [ ] 确认结构化数据 JSON-LD 语法正确
- [ ] 确认 canonical 指向真实公开 URL

### 7.2 工具侧验证

- [ ] Google Rich Results Test
- [ ] Schema Markup Validator
- [ ] Google Search Console URL Inspection
- [ ] PageSpeed Insights
- [ ] Screaming Frog

### 7.3 预期结果

如果只完成 Phase 0 + Phase 1，预期可得到：

1. 搜索引擎对站点主题理解更稳定
2. 法务页、pricing 页、社区详情页的表达更完整
3. sitemap 信号更干净
4. 后续内容 SEO 更容易扩展

如果进一步完成 Phase 2，预期可得到：

1. 中英文页面可作为两套独立搜索资产运营
2. 可以建立真正的 `hreflang` 关系
3. 国际化 SEO 才算从“界面多语言”升级到“搜索多语言”

---

## 八、结案判断

### 当前最应该先做什么

如果按投入产出比排序，最优顺序是：

1. **先修 `/privacy` 与 `/terms` metadata**
2. **再清理 sitemap 边界与 lastModified**
3. **再给 pricing / explore detail 补结构化数据**
4. **最后决定是否升级为真正的多语言 SEO 架构**

### 一句话总结

当前站点已经有 SEO 基础设施，但还停留在“营销页可被理解”的阶段；  
如果要把它推进到“能稳定承接国际自然流量”的阶段，下一步的关键不是再堆几个 meta tag，而是先解决**多语言 URL 策略**与**公开内容页的实体化表达**。

---

## 九、参考依据

### Google SEO Skill

1. `.md/Google-SEOs.skill/SKILL.md`
2. `.md/Google-SEOs.skill/references/06-specialty/implementation-playbook.md`
3. `.md/Google-SEOs.skill/references/06-specialty/multilingual-seo-playbook.md`
4. `.md/Google-SEOs.skill/references/06-specialty/keyword-optimization-playbook.md`
5. `.md/Google-SEOs.skill/references/07-patterns/常见问题诊断.md`

### 项目内现有策略文档

1. `.md/seo.txt`
2. `.md/archive/SEO 与 Open Graph 策略.md`
3. `.md/项目框架结构.md`
4. `.md/项目执行规范.md`

### 本次直接检查的代码文件

1. `apps/web/lib/seo.ts`
2. `apps/web/app/robots.ts`
3. `apps/web/app/sitemap.ts`
4. `apps/web/i18n/routing.ts`
5. `apps/web/middleware.ts`
6. `apps/web/app/[locale]/(landing)/*`
7. `apps/web/app/[locale]/(app)/explore/*`

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
