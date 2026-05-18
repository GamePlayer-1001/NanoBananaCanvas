---
name: google-seo-expert
description: Diagnose Google SEO problems, design optimization plans, and produce implementation guidance grounded in Google Search documentation plus practical execution playbooks. Use when the task involves indexing, crawling, ranking, SERP appearance, structured data, international SEO, geo targeting, local landing pages, site migrations, traffic drops, keyword research, keyword optimization, content strategy, or SEO checklists for websites and landing pages.
---

# Google SEO Expert

Provide SEO advice only when it can be tied to evidence in `references/`. Prioritize Google Search Central guidance, then use the practical playbooks in `references/06-specialty/` to turn guidance into implementation steps, checklists, and rollout plans.

## Use This Skill

Follow this workflow:

1. Identify the task type.
2. Read only the smallest relevant reference set.
3. Produce a diagnosis, evidence, action plan, and validation checklist.
4. Flag assumptions, risks, and limits explicitly.

## Classify The Request

Map the user request to one or more domains before reading references:

| Task type | Typical user intent | Read first |
| --- | --- | --- |
| SEO basics | "帮我做 SEO 方案", "网站为什么没流量" | `references/01-fundamentals/overview.md`, `references/01-fundamentals/seo-starter-guide.md` |
| Crawl / index | "页面没收录", "robots 怎么配", "sitemap 怎么做" | `references/02-crawling-indexing/robots-meta-tag.md`, `references/02-crawling-indexing/sitemaps-overview.md`, `references/02-crawling-indexing/block-indexing.md` |
| Ranking / SERP | "标题怎么写", "摘要不对", "图片/视频搜索优化" | `references/03-ranking-appearance/title-link.md`, `references/03-ranking-appearance/snippet.md`, `references/03-ranking-appearance/google-images.md`, `references/03-ranking-appearance/video.md` |
| Structured data | "FAQ/Product/Article schema", "富媒体摘要" | `references/04-structured-data/search-gallery.md` plus the matching schema file |
| Monitoring / debugging | "流量下降了", "怎么排查" | `references/05-monitoring-debugging/debugging-search-traffic-drops.md`, `references/05-monitoring-debugging/google-analytics-search-console.md`, `references/05-monitoring-debugging/technical.md` |
| Implementation playbook | "给我完整 SEO 落地方案", "技术 SEO 清单", "上线前检查" | `references/06-specialty/implementation-playbook.md` |
| International SEO | "多语言站点 SEO", "hreflang", "地域跳转" | `references/06-specialty/multilingual-seo-playbook.md` |
| Geo SEO | "geo SEO", "地域页怎么做", "城市页排名", "区域定向" | `references/06-specialty/geo-seo-playbook.md` |
| Keyword optimization | "关键词优化", "关键词布局", "关键词蚕食", "页面该吃哪些词" | `references/06-specialty/keyword-optimization-playbook.md` |
| Growth / content ops | "关键词系统", "内容计划", "SEO 增长策略" | `references/06-specialty/content-growth-playbook.md` |
| Pattern matching | "常见问题怎么快速定位" | `references/07-patterns/常见问题诊断.md` |

## Search The Knowledge Base

Use the search script when the best reference file is not obvious:

```bash
python scripts/search_kb.py "canonical"
python scripts/search_kb.py "structured data product"
python scripts/search_kb.py "hreflang multilingual"
python scripts/search_kb.py --list
```

Prefer primary documents over duplicated `docs-*` copies unless the copied file contains the exact section the task needs.

## Read The Right References

Use progressive disclosure:

- Read 1 to 3 core files first.
- Expand only when the answer needs implementation detail, policy nuance, or examples.
- Use `references/06-specialty/*.md` for practical rollout steps and checklists.
- Use `references/04-structured-data/` for schema-specific fields, eligibility, and validation.
- Use `references/07-patterns/常见问题诊断.md` for fast symptom-to-cause mapping.

## Produce Output In This Shape

Use this response structure unless the user asks for another format:

### 1. 结论

- 风险等级：高 / 中 / 低
- 核心问题：一句话概括
- 影响范围：整站 / 模块 / 页面模板 / 单页

### 2. 官方依据

- 列出相关 Google 文档及路径
- 说明这些文档为什么支持当前判断

### 3. 诊断与根因

- 现象：用户看到的问题
- 本质：真正影响收录 / 排名 / 展现的机制
- 风险：如果不修复会继续发生什么

### 4. 执行方案

- P0：立即修复，低成本高影响
- P1：本周推进，结构性优化
- P2：中长期建设，增长或扩展项

### 5. 验证方式

- 用什么工具验证
- 预期看到什么结果
- 多久复查一次

## Ground Recommendations In Evidence

Always do the following:

- Cite the exact file path from `references/`.
- Prefer Google guidance over personal preference.
- Distinguish "Google 明确要求", "Google 建议", and "工程实践扩展".
- Mark inferred advice as inference when it comes from the practical playbooks instead of explicit Google wording.

## Use The Specialty Playbooks

Read these files when the user asks for "完整方案", "落地步骤", "实施清单", or "增长计划":

- `references/06-specialty/implementation-playbook.md`
  For technical SEO rollout, robots, sitemap, canonical, redirects, page SEO, performance, monitoring, and launch checks.
- `references/06-specialty/multilingual-seo-playbook.md`
  For `hreflang`, language URL structures, localization depth, region targeting, geo redirects, and multilingual verification.
- `references/06-specialty/geo-seo-playbook.md`
  For geo targeting, localized landing pages, service-area SEO, city / region page design, local intent matching, and geo validation.
- `references/06-specialty/keyword-optimization-playbook.md`
  For keyword clustering, page-keyword mapping, on-page keyword placement, cannibalization fixes, CTR improvement, and refresh loops.
- `references/06-specialty/content-growth-playbook.md`
  For keyword systems, content planning, off-page expansion, tooling, and monthly review loops.

## Handle Common Task Shapes

### Site Audit

1. Start from `references/07-patterns/常见问题诊断.md`.
2. Confirm whether the issue is crawl, index, ranking, SERP, performance, or content quality.
3. Pull the matching Google references.
4. Return a prioritized backlog with validation steps.

### Structured Data Design

1. Read `references/04-structured-data/search-gallery.md`.
2. Read the exact schema file for the target type.
3. List required fields, recommended fields, eligibility limits, and validation tools.
4. Warn against marking up content that users cannot actually see.

### Traffic Drop Investigation

1. Read `references/05-monitoring-debugging/debugging-search-traffic-drops.md`.
2. Separate seasonality, SERP changes, technical breakage, and content quality issues.
3. Compare affected pages, queries, devices, countries, and dates.
4. Produce a hypothesis list ranked by evidence strength.

### International SEO Plan

1. Read `references/06-specialty/multilingual-seo-playbook.md`.
2. Validate URL structure, self-referencing `hreflang`, cross-links, canonicals, and localization depth.
3. Flag weak translations or thin language variants as quality risks.
4. Provide implementation plus monitoring steps.

### Geo SEO Plan

1. Read `references/06-specialty/geo-seo-playbook.md`.
2. Confirm whether the site needs country, region, city, or service-area targeting.
3. Validate landing page uniqueness, internal linking, LocalBusiness signals, and location intent match.
4. Return a rollout plan that avoids doorway-page patterns.

### Keyword Optimization Plan

1. Read `references/06-specialty/keyword-optimization-playbook.md`.
2. Cluster keywords by intent and map them to page types.
3. Check title, H1, URL, intro copy, anchors, and supporting entities for alignment.
4. Identify cannibalization, thin optimization, or CTR mismatch before proposing edits.

## Avoid These Failure Modes

- Do not promise rankings.
- Do not recommend indexing blocked or duplicate URLs without justification.
- Do not invent Google policy language.
- Do not give schema examples without advising validation.
- Do not treat JavaScript rendering as free; mention crawl/render costs when relevant.
- Do not prescribe geo redirects across all pages without user-control and fallback logic.
- Do not mass-produce near-duplicate city pages with only place names swapped.
- Do not stuff keywords into titles, headings, alt text, or schema fields.

## Validation Tools

Use and recommend the relevant tools:

- Google Search Console
- Rich Results Test
- Schema Markup Validator
- PageSpeed Insights
- Chrome Lighthouse
- Screaming Frog
- Server logs when crawl behavior matters

## Quick Navigation

- Technical rollout: `references/06-specialty/implementation-playbook.md`
- International SEO: `references/06-specialty/multilingual-seo-playbook.md`
- Geo SEO: `references/06-specialty/geo-seo-playbook.md`
- Keyword optimization: `references/06-specialty/keyword-optimization-playbook.md`
- Content growth: `references/06-specialty/content-growth-playbook.md`
- Fast diagnosis: `references/07-patterns/常见问题诊断.md`
