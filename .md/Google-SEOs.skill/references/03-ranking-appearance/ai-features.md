# AI 功能和您的网站 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/ai-features?hl=zh-cn

---

# AI 功能和您的网站

  本指南从网站所有者的角度介绍了 AI 概览和 AI 模式等 AI 功能在 Google 搜索中的运作方式，以及如何让您的内容纳入这些体验。

  搜索引擎优化 (SEO) 最佳实践仍然适用于 Google 搜索中的 AI 功能（例如 AI 概览和 AI 模式）。**无需满足任何其他要求即可在 AI 概览或 AI 模式中显示，也无需进行其他特殊优化。**不过，查看一下[基本 SEO 最佳实践](https://developers.google.com/search/docs/essentials?hl=zh-cn)总是好的。

## Google 搜索中的 AI 功能的运作方式

  与 Google 搜索整体一样，[AI 概览](https://support.google.com/websearch/answer/14901683?hl=zh-cn)和 [AI 模式](https://support.google.com/websearch/answer/16011537?hl=zh-cn)等 AI 功能会显示相关链接，帮助用户快速可靠地找到所需信息，并帮助他们探索之前可能未发现的内容。这些功能为更多类型的网站提供了独特的展示机会。

  **AI 概览**可帮助用户更快地掌握复杂主题或问题的要点，并提供一个切入点，引导用户探索链接以了解更多信息。它们旨在针对合适的查询内容显示在搜索结果中，进一步增强 Google 搜索，为用户提供额外的好处。在 AI 概览的帮助下，对于较为复杂的问题，用户会访问更为多元化的网站来寻求帮助。

  对于那些需要进一步探索、推理或进行复杂比较的查询，**AI 模式**尤其有帮助。用户可以提出复杂细致的问题，比如探索新概念、比较不同选项等。这些问题过去可能需要多次查找对比才能解决。如今只需一次提问，就能获得全面的 AI 生成回复，并附带相关支持网站链接。

  AI 概览和 AI 模式都可能会使用“查询扇出”技术（在子主题和数据源中发出多项相关搜索）来生成回答。在生成回答时，我们的高级模型会识别出更多支持网页，从而使我们能够**显示与响应相关的更广泛、更丰富的一系列实用链接**（而不是传统网页搜索），从而提供新的探索机会。

  AI 模式和 AI 概览可能会使用不同的模型和技术，因此它们显示的一系列回答和链接也会有所不同。只有当我们的系统确定 AI 概览可以为经典搜索提供补充时，才会显示 AI 概览，因此通常不会触发。

## 如何出现在 AI 功能中

  您可以针对 AI 功能采用与 Google 搜索整体相同的[基础 SEO 最佳实践](https://developers.google.com/search/docs/essentials?hl=zh-cn)：确保网页符合[Google 搜索的技术要求](https://developers.google.com/search/docs/essentials/technical?hl=zh-cn)、遵守[搜索政策](https://support.google.com/websearch/answer/10622781?hl=zh-cn)，并重点关注[关键最佳实践](https://developers.google.com/search/docs/essentials?hl=zh-cn#key-best-practices)，例如[创建实用、可靠、以用户为中心的内容](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=zh-cn)。

### 出现在 AI 功能中的技术要求

  网页必须已编入索引、符合在 Google 搜索中显示摘要的条件，并遵循[搜索技术要求](https://developers.google.com/search/docs/essentials/technical?hl=zh-cn)，才能在 AI 概览或 AI 模式中显示为辅助链接。无其他技术要求。

网页满足所有要求并遵循所有最佳实践和政策，并不表示 Google 一定会抓取其内容、将其编入索引或呈现给用户。我们无法保证一定会编入索引和呈现内容。详细了解 [Google 搜索的运作方式](https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn)。

### SEO 最佳实践

  虽然 AI 概览和 AI 模式不需要进行特定优化，但所有现有的 [SEO 基础知识](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn)仍然很有用，例如：

- 确保 robots.txt 和任何 CDN 或托管基础架构都允许抓取
- 通过网站上的[内部链接](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn#internal-links)让内容更容易被发现
- 为用户提供出色的[网页体验](https://developers.google.com/search/docs/appearance/page-experience?hl=zh-cn)
- 确保重要内容以文字形式提供
- 在适用的情况下，使用优质[图片](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)和[视频](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)来辅助文字内容
- 确保[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)与网页上的可见文本一致
- 检查 [Merchant Center](https://support.google.com/merchants/answer/12159157?hl=zh-cn) 和[商家资料](https://developers.google.com/search/docs/appearance/establish-business-details?hl=zh-cn)信息是否是最新的

您无需创建新的机器可读文件、AI 文本文件或标记，即可在这些功能中显示内容。您也不需要添加任何特殊的 schema.org 结构化数据。

  如需快速发现和诊断潜在的技术问题，请[在 Search Console 中验证您的网站](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)。

## 衡量网站的效果

  与搜索结果页面的其他部分一样，在 AI 功能（例如 AI 概览和 AI 模式）中显示的网站也会计入 [Search Console](https://search.google.com/search-console/about?hl=zh-cn) 中的总体搜索流量。
  具体而言，这些指标会在[效果报告](https://support.google.com/webmasters/answer/7576553?hl=zh-cn)的[“网页”搜索类型](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#by_search_type)中进行报告。
  详细了解 [AI 概览](https://support.google.com/webmasters/answer/7042828?hl=zh-cn#ai-overviews&zippy=,t,ai-overviews)和 [AI 模式](https://support.google.com/webmasters/answer/7042828?hl=zh-cn#ai-mode&zippy=,t,ai-mode)在 Search Console 整体数据中的统计方式、如何[分析总体流量变化](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=zh-cn)以及如何[将 Search Console 数据与 Google Analytics 数据结合使用](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console?hl=zh-cn)。

  除了 Search Console 之外，您还可以在其他工具（例如 Google Analytics）中跟踪转化和在网站上花费的时间。我们发现，当用户在包含 AI 概览的搜索结果页上进行点击时，这些点击的质量更高（也就是说，用户更有可能在该网站上停留更长时间）。

## 控制在 Google 搜索的 AI 功能中显示的内容

  AI 内置于 Google 搜索中，也是 Google 搜索功能不可或缺的一部分，因此，网站所有者可以使用适用于 [Googlebot](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers?hl=zh-cn) 的 robots.txt 指令，管理 Google 搜索抓取其网站的方式。如需限制在 Google 搜索中显示的网页信息，请使用 [nosnippet、data-nosnippet、max-snippet](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn) 或 [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn) 控件。

  如需限制某些其他 Google 系统中的 AI 训练和接地功能，请详细了解 [Google-Extended](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers?hl=zh-cn#google-extended)。

### 对预览控件进行问题排查

  如果您实现了[预览控件](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#nosnippet)，但 Google 搜索的 AI 功能中仍然显示您的内容，请尝试以下步骤：

1. 确保预览控件正确无误，且对 Googlebot 可见。如需测试您的实现是否正确，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)查看 Googlebot 在抓取该网页时收到的 HTML。
2. 请等待一段时间，以便 Google 重新抓取并处理预览控件中的更改。
    请注意，抓取过程可能需要几天到几个月的时间，具体取决于我们的系统确定网页需要刷新的频率。如果您做出了更改，可以[请求 Google 重新抓取您的网页](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。

  如果您在尝试执行问题排查步骤后仍遇到问题，请在 [Google 搜索中心帮助社区](https://support.google.com/webmasters/thread/227739087?hl=zh-cn)中发帖咨询。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。