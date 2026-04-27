# Nano Banana Canvas - SEO 检测与执行清单

> 文档版本：v1.1
> 创建日期：2026-04-27
> 适用范围：当前 `apps/web` 公开站点的静态代码 SEO 审计
> 检测方式：代码审计 + 路由结构审计 + metadata/robots/sitemap/结构化数据检查 + 线上 HTML 抽查 + Search Console / Bing Webmaster 首轮接管状态复核
> 说明：Google Search Console 与 Bing Webmaster 已完成首轮接管和 sitemap 提交；GA4 与真实 CWV 监控仍未接入，因此流量与性能判断仍不伪造

---

## 一、检测结论

### 1.1 总体判断

当前站点已经具备一层像样的 SEO 基础骨架：

1. 已有统一的 metadata 工厂：`apps/web/lib/seo.ts`
2. 已有动态 `robots.ts` 与 `sitemap.ts`
3. 首页已经落了 `Organization + SoftwareApplication + FAQPage`
4. 大部分公开营销页都在独立生成 `title / description / canonical / OG / Twitter`

但如果按“真正要让这个站稳定吃到自然搜索流量”的标准看，当前仍有三类结构性问题：

1. **多语言 SEO 已建立基础生产态，但还缺少更深的内容本地化与站外验证**
2. **部分增长型 SEO 资产仍未建设，例如深内容页与专属 OG 资源矩阵**
3. **站外已完成首轮接管，但监控与告警消化闭环还未完全稳定**

### 1.2 风险等级

- **高风险**：GA4 / PageSpeed / 日志级监控尚未接入，导致性能与行为反馈链仍然偏弱
- **中风险**：Bing 首轮告警仍在消化中，且增长型内容 SEO 资产尚未建设，长尾搜索承接能力仍不足
- **低风险**：专属 OG 资源矩阵、法务正文深度本地化、性能图片压缩仍可继续打磨

### 1.3 当前评分

按 `.md/seo.txt` 中的四维框架做静态估算：

| 维度         | 当前估分 | 判断                                                     |
| ------------ | -------- | -------------------------------------------------------- |
| 技术 SEO     | 86 / 100 | 站内基础设施已较完整，剩余主要缺口转向站外接管与持续监控 |
| 页面质量     | 84 / 100 | 公开关键页 metadata、关键词和 schema 已完成两轮收口      |
| 性能准备度   | 75 / 100 | Next.js 16 + SSR/SSG 架构有优势，但本轮未做真实 CWV 实测 |
| 内容与关键词 | 80 / 100 | 关键公开页已形成关键词地图，`gpt image` 高权重策略已统一 |

**综合静态评分：82 / 100**

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
4. 公开页面覆盖矩阵：
   - `[locale]/(landing)/*`
   - `[locale]/(app)/explore/*`
   - `[locale]/(app)/workflows/page.tsx`
   - `[locale]/(app)/video-analysis/page.tsx`
   - `[locale]/(auth)/*`
5. 站外接入痕迹：
   - Google Search Console 验证位
   - DNS TXT 验证记录
   - GA4 / `gtag`
   - Bing / 其他站长工具验证位
6. 公共静态资源与品牌入口：
   - `favicon.ico`
   - `public/brand/*`
   - `public/landing/hero/*`

---

## 三、站内外检测矩阵

| 维度                | 当前状态        | 结论                                                                                           |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| `robots.txt`        | 已完成第二轮    | 已同时声明根 sitemap 与中文独立 sitemap，并继续收紧私有路径抓取边界                            |
| `sitemap.xml`       | 已完成第二轮    | 根 sitemap 已聚焦默认语言，中文已拆出独立 sitemap 入口                                         |
| Canonical           | 已实现          | 统一走 `buildPageMetadata()`，方向正确                                                         |
| 页面级 metadata     | 已基本完成      | 公开关键页已覆盖，法务页和列表/详情页 metadata 已补齐                                          |
| `noindex` 私有页    | 已完成第一轮    | 登录页、账户页、工作区、编辑器页已处理，工具页边界已开始收紧                                   |
| 结构化数据          | 已完成第二轮    | 首页、about、docs、community、contact、pricing、explore 列表/详情、workflows、法务页已补关键层 |
| 多语言 SEO          | 已完成第二轮    | 默认英文无前缀、中文显式前缀、独立语言 sitemap、locale 感知关键词已落地                        |
| Search Console      | 已完成首轮接入  | 域名验证已通过，根 sitemap 与中文 sitemap 已提交                                               |
| GA4                 | 未接入          | 仍需补                                                                                         |
| Bing Webmaster      | 已完成首轮接入  | 已通过 GSC 导入站点，但首轮扫描告警仍需继续观察                                                |
| 站点验证 Meta / DNS | 已完成 DNS 验证 | 当前所有权验证主要走 DNS，而不是页面 meta                                                      |
| 404 搜索信号        | 已完成第一轮    | 全局与 locale 404 已补 noindex，后续仍可继续加强跳转引导                                       |
| 公共资源与品牌图标  | 基础存在        | `favicon.ico` 和 logo 存在，但未形成完整 web app / 分享资源体系                                |

---

## 四、页面覆盖审计

### 4.1 页面级 metadata 覆盖现状

#### 已有独立 metadata / generateMetadata 的公开页

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
12. `/explore`
13. `/explore/[id]`
14. `/workflows`
15. `/video-analysis`

#### 已明确 `noindex` 的私有页

1. `/sign-in`
2. `/sign-up`
3. `/workspace`
4. `/account`
5. `/billing`

#### 已在本轮补齐的页面

1. `/privacy`
2. `/terms`
3. `/workspace/[id]` 已明确 `noindex`
4. `/canvas/[id]` 已通过路由 `layout.tsx` 明确 `noindex`

#### 当前仍需继续观察边界的页面

1. `/video-analysis` 已转为 `noindex` 工具页

说明：

1. `workspace/[id]` 作为旧路由兼容重定向，理论上不应被索引
2. `canvas/[id]` 作为编辑器页，按当前产品语义也不应进入搜索结果

### 4.2 结构化数据覆盖现状

#### 本轮已实现

1. 首页 `/`
   - `Organization`
   - `SoftwareApplication`
   - `FAQPage`
2. 联系页 `/contact`
   - `Organization`

#### 已实现

1. `/pricing`
   - `Product / Offer`
   - `BreadcrumbList`
2. `/explore`
   - `CollectionPage`
   - `BreadcrumbList`
3. `/explore/[id]`
   - `CreativeWork`
   - `BreadcrumbList`
4. `/workflows`
   - `CollectionPage`
   - `BreadcrumbList`
5. `/about`
   - `AboutPage`
   - `BreadcrumbList`
6. `/docs`
   - `CollectionPage`
   - `BreadcrumbList`
7. `/community`
   - `CollectionPage`
   - `BreadcrumbList`
8. `/contact`
   - `Organization`
   - `BreadcrumbList`
9. `/privacy`
   - `WebPage`
   - `BreadcrumbList`
10. `/terms`
    - `WebPage`
    - `BreadcrumbList`

#### 未实现但应继续考虑

1. 更细粒度的实体专属 OG 表达
2. 后续如有 blog/docs 深内容页，可继续扩展文章级 schema

### 4.3 公共资源与品牌入口

当前已存在：

1. `apps/web/app/favicon.ico`
2. `apps/web/public/brand/logo-1024.png`

当前未看到明确实现：

1. `site.webmanifest` 已补
2. `apple-touch-icon` 已补
3. 静态 OG 资源目录（当前主要依赖动态 OG 接口）

### 4.4 监控与验证接入现状

当前已确认：

1. Google Search Console 域名验证已通过
2. Bing Webmaster 已通过 GSC 导入站点
3. 根 sitemap：`https://nanobananacanvas.com/sitemap.xml` 已提交
4. 中文 sitemap：`https://nanobananacanvas.com/zh/sitemap.xml` 已提交
5. `robots.txt`、根 sitemap、中文 sitemap 线上均可正常抓取

当前代码中仍未发现：

1. `gtag`
2. `googletagmanager`
3. GA4 Measurement ID

因此当前“站点所有权接管”已完成，但“分析与性能监控接管”仍未完成。

### 4.5 Bing 当前警告复核（2026-04-27）

根据当前 Bing Webmaster 首轮扫描结果，已知告警类型包括：

1. `Too many pages with identical titles`：4 页
2. `Too many pages with identical meta descriptions`：4 页
3. `Meta descriptions on many pages are too short`：3 页
4. `Many of your page titles are too short`：1 页
5. `The <h1> tag is missing.`：1 页，当前指向首页 `/`
6. `The description is missing in the head section of the page.`：1 页，当前指向首页 `/`

当前复核结论：

1. 首页线上真实 HTML 已能抓到 `<title>`、`<meta name="description">` 与 `<h1>`，因此后两条更像是 Bing 旧扫描缓存或首轮渲染误判，不应再按“代码缺失”处理
2. 真正值得继续优化的是“标题过短 / 描述过短 / 相似度偏高”这三类页面级文案问题
3. 本轮已继续强化 `contact`、`privacy`、`terms` 的 metadata 语义，用于压低下一轮站长工具警告概率

---

## 五、核心问题与根因

### P0-1 多语言 SEO 没有真正建立

状态：已完成第二轮

#### 现象层

1. 当前 i18n 路由已从 `localePrefix: 'never'` 调整为默认语言无前缀、中文显式前缀
2. 外部公开 URL 已具备两套可索引入口：
   - 英文：`/features`
   - 中文：`/zh/features`
3. `buildPageMetadata()` 已输出语言版 canonical 与 `hreflang`
4. `sitemap.xml` 已开始输出多语言 URL 与 alternates

#### 本质层

这代表当前站点已经开始从“中英文界面”升级到“中英文可索引入口”，但还没有完全走完多语言 SEO 的全部工程。

对搜索引擎来说：

1. 默认英文与中文现在已具备独立搜索入口
2. 语言版本之间已能建立对应关系
3. 中文版本已拆出独立 sitemap，但更深的本地化校对仍未完成

#### 代码证据

1. `apps/web/i18n/routing.ts`
2. `apps/web/lib/seo.ts`
3. `apps/web/middleware.ts`

#### 官方依据

1. `references/06-specialty/multilingual-seo-playbook.md`
2. `references/02-crawling-indexing/consolidate-duplicate-urls.md`
3. `references/03-ranking-appearance/site-names.md`

#### 判断

这仍然是当前 SEO 最大的结构性主题之一，但“完全没做”这一步已经过去了。  
接下来要做的是把已经落下的多语言抓取入口继续推到完整生产态，并完成内容层校对。

---

### P0-2 法务高信任页 metadata 不完整

状态：已修复

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

状态：已完成第一轮

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

状态：已修复

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

状态：已修复

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

状态：已完成第一轮收口

#### 现象层

当前 sitemap 主动提交了：

1. `/video-analysis`
2. `/workflows`
3. `/explore`
4. `/explore/[id]`

其中：

1. `/explore` 与 `/workflows` 适合作为公开聚合页
2. `/explore/[id]` 适合作为公开内容页
3. `/video-analysis` 更像工具页，当前已转为 `noindex`，并从 sitemap 移除

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

状态：已完成第二轮强化

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

### P1-5 站外平台已建立正式接管，但首轮告警仍需继续消化

#### 现象层

当前已确认这些站外信号：

1. Google Search Console 域名验证已通过
2. Bing Webmaster 已导入并开始扫描
3. 根 sitemap 与中文 sitemap 已提交

当前仍未接入：

1. GA4
2. PageSpeed / CWV 周期化复盘
3. 日志级抓取监控

#### 本质层

这意味着：

1. 站内 SEO 文件已经存在
2. Google / Bing 侧已经被明确告知“这个站由你管理”
3. 但平台首轮告警与真实线上 HTML 之间仍存在时间差
4. 收录、覆盖、点击、排名虽然开始有反馈入口，但分析与性能监控仍未闭环

#### 官方依据

1. `references/03-ranking-appearance/establish-business-details.md`
2. `references/05-monitoring-debugging/google-analytics-search-console.md`
3. `references/06-specialty/implementation-playbook.md`

#### 判断

当前已经跨过“站内做了一半，站外没接上”这道坎。  
下一步不再是“先去验证”，而是“继续消化 Bing / GSC 首轮数据，并补齐 GA4 与周期复盘”。

---

### P1-6 法务与 Cookie 文案领先于真实接入状态

#### 现象层

文案里已经出现了：

1. analytics
2. cookies for analytics
3. payment / billing continuity

但代码里没有看到真实 GA4 或其他分析脚本接入。

#### 本质层

这不是 SEO 直接扣分项，但会带来两个问题：

1. 法务文案与真实运行状态不完全一致
2. 后续如果真要接 GA4，文案和实现之间缺少明确变更节点

#### 判断

建议把它记成“合规与 SEO 周边一致性项”，和 Search Console / GA4 接入一起处理。

---

## 六、当前已做得对的地方

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

## 七、分阶段执行清单

## Phase 0：立即修复（本周内）

- [x] 把多语言 SEO 方向定下来：默认英文无前缀，中文显式前缀
- [x] 给 `/privacy` 增加 `generateMetadata()`
- [x] 给 `/terms` 增加 `generateMetadata()`
- [x] 重新评估 `/video-analysis` 是否应该进入 sitemap
- [x] 给 `/canvas/[id]` 明确 `noindex`
- [x] 给 `/workspace/[id]` 兼容重定向页明确搜索边界
- [x] 为 sitemap 静态页改成真实 `lastModified`，不要每次都用当前时间

### 推荐落点

1. `apps/web/app/[locale]/(landing)/privacy/page.tsx`
2. `apps/web/app/[locale]/(landing)/terms/page.tsx`
3. `apps/web/app/sitemap.ts`
4. `apps/web/app/[locale]/(editor)/canvas/[id]/page.tsx`
5. `apps/web/app/[locale]/(app)/workspace/[id]/page.tsx`

## Phase 1：结构性优化（1 周）

- [x] 为 `/pricing` 添加 `Product / Offer` JSON-LD
- [x] 为 `/explore/[id]` 添加 `CreativeWork` 或更合适的结构化数据
- [x] 为 `/explore/[id]` 补更贴合实体的 OG 表达
- [x] 为公开关键页建立 `BreadcrumbList` 方案
- [x] 明确哪些公开页应该 `index`，哪些公开页虽然可访问但不值得进入搜索结果
- [x] 输出“页面 - 主关键词 - 次关键词 - 支撑词”映射表
- [x] 为关键公开页把关键词策略升级为 locale 感知，并保持 `gpt image` 为最高优先级词

### 推荐落点

1. `apps/web/app/[locale]/(landing)/pricing/page.tsx`
2. `apps/web/app/[locale]/(app)/explore/[id]/page.tsx`
3. `apps/web/lib/seo.ts`
4. 新增关键词映射文档，可并入本文件后续版本

## Phase 2：站外接入与反馈闭环（1 周）

- [x] 在 Google Search Console 添加 `nanobananacanvas.com`
- [x] 用 DNS TXT 或 HTML Meta 完成站点所有权验证
- [x] 提交 `https://nanobananacanvas.com/sitemap.xml`
- [x] 提交 `https://nanobananacanvas.com/zh/sitemap.xml`
- [x] 在 Bing Webmaster Tools 添加并验证站点
- [ ] 决定是否接 GA4；如果接，补文案与实现同步
- [ ] 建立 Search Console / Bing / PageSpeed 的月度复盘动作

## Phase 3：真正建立多语言 SEO（如果要做国际化搜索）

- [x] 把 `localePrefix: 'never'` 改成可索引语言路径策略
- [x] 为 `en` / `zh` 建立真实独立 URL
- [x] 输出 `hreflang` 与 `x-default`
- [x] 让 canonical 与语言 URL 一一对应
- [x] 为不同语言版本做独立 sitemap
- [ ] 把中英文 metadata、schema 文本、法务文本继续做深度本地化校对
      当前状态：首页、about、docs、community、contact、pricing、explore、workflows、explore detail、privacy、terms 等关键公开页已完成关键词与 schema 文本第二轮本地化，法务正文仍可继续深挖

### 推荐落点

1. `apps/web/i18n/routing.ts`
2. `apps/web/middleware.ts`
3. `apps/web/lib/seo.ts`
4. 各公开页 `generateMetadata()`

## Phase 4：增长型 SEO（2-6 周）

- [x] 建立首页、features、models、pricing、explore detail 的关键词地图
- [ ] 为模板详情页设计可承接长尾的正文结构
- [ ] 规划 blog/docs/help 类内容入口，承接问题型搜索
- [ ] 接入 Search Console、Bing Webmaster、PageSpeed Insights 周期复盘
- [ ] 建立“高展示低点击页”与“多 URL 抢词页”的月度复盘机制

---

## 八、站外平台执行清单

### 8.1 Google Search Console

- [x] 添加 `nanobananacanvas.com` 作为 Domain Property
- [x] 优先使用 DNS TXT 验证
- [x] 验证成功后提交 `/sitemap.xml`
- [x] 提交 `/zh/sitemap.xml`
- [ ] 抽查以下 URL：
  - `/`
  - `/features`
  - `/models`
  - `/pricing`
  - `/explore`

### 8.2 Bing Webmaster Tools

- [x] 添加站点
- [x] 完成所有权验证
- [x] 提交 sitemap
- [ ] 对首页 `/` 发起重新抓取 / 重新编入索引，消化首轮 `<h1>` 与 `description` 误报
- [ ] 点开 4 条重复标题、4 条重复描述、3 条描述过短、1 条标题过短的具体 URL 清单，继续逐页收口

### 8.3 GA4

- [ ] 决定是否接入
- [ ] 如果接入，增加 `gtag`
- [ ] 同步更新 cookie / privacy 文案，确保与真实实现一致

### 8.4 验证方式

- [ ] DNS 中可查询到验证记录
- [ ] 或页面源码中存在验证 Meta
- [ ] Search Console 可看到 sitemap 状态
- [ ] URL Inspection 可拉到核心页结果

---

## 九、推荐页面关键词映射（首版）

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
  - gpt image pricing
  - Nano Banana Canvas pricing
  - AI workflow pricing
- 次关键词：
  - AI credits pricing
  - image generation pricing

### `/explore/[id]`

- 主关键词：
  - workflow title 本身
  - gpt image workflow template
  - AI workflow template
- 次关键词：
  - reusable workflow
  - creator workflow
  - image/video prompt chain

### `/explore`

- 主关键词：
  - gpt image templates
  - AI workflow templates
- 次关键词：
  - creator workflow library
  - image generation workflows

### `/workflows`

- 主关键词：
  - gpt image workflow library
  - AI workflow library
- 次关键词：
  - reusable workflow templates
  - creator workflow systems

说明：  
这只是首版方向，不是最终词表。真正上线前最好结合 Search Console 与关键词工具再二次校准。

---

## 十、验证方式

### 7.1 代码侧验证

- [x] 确认所有公开关键页都有独立 metadata
- [x] 确认 `robots.txt`、`sitemap.xml` 可正常生成
- [x] 确认结构化数据 JSON-LD 语法正确
- [x] 确认 canonical 指向真实公开 URL
- [x] 确认不应索引的编辑器/账户/工作区页都已明确 `noindex`

### 7.2 工具侧验证

- [ ] Google Rich Results Test
- [ ] Schema Markup Validator
- [ ] Google Search Console URL Inspection
- [ ] PageSpeed Insights
- [ ] Screaming Frog
- [ ] Bing Webmaster

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

## 十一、补充发现

### 11.1 当前没有 analytics 实装，但文案已预留

这意味着后续如果不接 GA4，也应该把文案口径收紧；  
如果要接，就要把 SEO 与合规一起补齐。

### 11.2 当前缺少更完整的外围品牌资源矩阵

`site.webmanifest` 与 `apple-touch-icon` 已补上。  
当前剩余的外围资产缺口主要是更细粒度的静态 OG 资源矩阵，而不是基础安装入口缺失。

### 11.4 当前站内可编码 SEO 缺口已基本收口

当前剩余高价值事项主要转移到两类：

1. 站外接管与监控闭环
2. 增长型内容 SEO（blog/help/深内容页）

### 11.3 当前 public 里的首屏营销图片体积较大

从静态文件尺寸看，多个 landing 图都在 2MB 左右。  
这更偏性能 SEO，不是收录问题，但会影响：

1. LCP
2. 首屏加载体验
3. 移动端 PageSpeed

建议在后续性能轮里统一压缩或改成更适合 web 的资源规格。

---

## 十二、结案判断

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

## 十三、参考依据

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
