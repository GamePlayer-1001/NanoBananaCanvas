# 如何创建 Search Console 气泡图 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/monitor-debug/bubble-chart-analysis?hl=zh-cn

---

# 利用 Search Console 气泡图改进搜索引擎优化 (SEO) 效果

  分析搜索效果数据始终是一项挑战，存在可视化和理解难度更大的大量长尾查询时，更是如此。[气泡图](https://support.google.com/datastudio/answer/7207785?hl=zh-cn)可以帮助您了解，对于您的网站来说，哪些查询的效果比较好，哪些查询的效果有待改进。

  如果您想要测试这里讨论的方法，可以[将数据关联到 Looker Studio](https://datastudio.google.com/reporting/1e5b5f6a-38d7-4547-a54b-69594681a09b/page/xFbeC/preview?hl=zh-cn)，然后调整图表设置。

  如果您尚未阅读[将 Search Console 关联到 Looker Studio](https://developers.google.com/search/blog/2022/03/connecting-data-studio?hl=zh-cn) 和[使用 Looker Studio 实现 Google 搜索流量监控](https://developers.google.com/search/blog/2022/03/monitoring-dashboard?hl=zh-cn)，不妨阅读这些内容，以便深入了解在 Looker Studio 中可以利用 Search Console 做些什么。

## 解读图表

  存在多个指标和维度时，气泡图是一种较直观的可视化图表，因为它可以让您更高效地发现数据中的关系和模式。在此处显示的示例中，您可以在一个视图中查看相应查询和设备维度的[点击率](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#choosingmetrics) (CTR)、平均排名以及点击次数。

  本部分详细介绍了部分图表元素，以阐明图表显示哪些内容，以及不显示哪些内容。

### 数据源

  此页中显示的气泡图使用的是通过 [Search Console 数据源](https://support.google.com/datastudio/answer/7314895?hl=zh-cn)获得的网站展示次数表，其中包括按网站和查询汇总的[搜索效果数据](https://support.google.com/webmasters/answer/7576553?hl=zh-cn)。

### 过滤条件和数据控制

  为帮助您有效控制数据，图表中提供了五个自定义选项：

1. **[数据控制](https://support.google.com/datastudio/answer/7415591?hl=zh-cn)**：选择要分析的 Search Console 资源。
2. **日期范围**：选择您要在报告中查看的日期范围；默认情况下，您会看到过去 28 天的数据。
3. **查询**：包含或排除要重点关注的查询。您可以[过滤数据](https://developers.google.com/search/blog/2021/06/regex-negative-match?hl=zh-cn)，方法与在 Search Console 中过滤数据类似。
4. **国家/地区**：包含或排除国家/地区。
5. **设备**：包含或排除设备类别。

### 坐标轴

  图表中的坐标轴是平均排名（y 轴）和网站点击率（x 轴）。坐标轴中存在 3 项重要转换：

1. **逆转 y 轴方向**：由于 y 轴显示平均排名，逆转该轴意味着 1 位于顶部。对于大多数图表而言，最佳位置是右上角，因此使用 y 轴显示平均排名时，逆转其方向会更符合直觉。
2. **对数刻度**：对两个轴都使用[对数刻度](https://en.wikipedia.org/wiki/Logarithmic_scale)时，您可以更好地了解图表中存在极端情况的查询（点击率非常低、平均排名非常低或两者都非常低）。
3. **[参考行](https://support.google.com/datastudio/answer/9921462?hl=zh-cn)**：参考行非常有助于突出显示高于或低于特定阈值的值。查看平均值、中位数或特定百分位数可以让您注意到偏离特定模式的情况。

### 气泡

  图表中的每个气泡都表示单个查询，并具有以下[样式属性](https://support.google.com/datastudio/answer/7207785?hl=zh-cn#style-properties)：

- **大小**：用气泡大小代表点击次数，有助于您一目了然地看出哪些查询带来了大部分流量：气泡越大，查询产生的流量越多。
- **颜色**：用气泡颜色代表不同设备类别，有助于您了解网站在移动设备上与桌面设备上的 Google 搜索表现的差异。您可以使用颜色区分各维度，但随着值数量的增加，识别模式的难度会随之增大。

## 分析数据

  这种可视化方式的目标是帮助发现查询优化机会。该图表显示了查询效果，其中 y 轴表示平均排名，x 轴表示点击率，气泡大小表示总点击次数，气泡颜色表示设备类别。

  红色“平均值”参考虚线显示了每个轴的平均值，这两条虚线将图表分为四个象限，以显示四种类型的查询效果。您的象限划分情况可能与这篇博文中显示的有所不同；具体取决于您的网站查询的分布情况。

  该图表显示了四组查询，您可以对其进行分析，以确定优化您的 Google 搜索效果时要在哪些方面投入时间。

1. **高排名，高点击率**：您无需针对这些查询采取任何行动；现在的效果很理想。
2. **低排名，高点击率**：此类查询似乎与用户相关；即使这些查询的排名低于您网站的平均查询排名，也会获得较高的点击率。如果查询的平均排名上升，可能会对效果产生显著影响，请重点改进这些查询的搜索引擎优化 (SEO) 效果。例如，某园艺网站第 2 象限中的热门查询可能是“how to build a wooden shed”（如何制作木棚）。请检查您是否已有与此相关的网页，并通过以下两种方式继续操作：

- 如果您没有相关网页，不妨考虑创建一个，以便将您的网站上与该主题相关的所有信息集中到一处。
- 如果您有相关网页，不妨考虑添加此类内容，以便更好地满足用户需求。
3. **低排名，低点击率**：查看点击率较低的查询（无论排名高低）时，非常有趣的是，查看气泡大小，了解哪些查询虽然点击率较低，但仍带来了大量流量。尽管此象限中的查询可能看似不值得您投入精力进行优化，但它们可以分为两大类：

- **相关查询**：如果相应查询对您来说非常重要，确保它已经显示在 Google 搜索中是个很好的开始。请优先优化这些查询而非完全不会出现在搜索结果中的查询，因为这类查询更容易优化。
- **不相关查询**：如果您的网站未涵盖与这类查询相关的内容，不妨优化您的内容或侧重于可带来相关流量的查询。
4. **高排名，低点击率**：这些查询可能会因各种原因而点击率较低。查看较大的气泡，看看是否存在以下迹象：

- 您的竞争对手可能使用了[结构化数据标记](https://developers.google.com/search/docs/appearance/search-result-features?hl=zh-cn)，且展示的是富媒体搜索结果，这可能会吸引用户点击竞争对手的结果而非您的结果。请考虑针对 [Google 搜索结果中最常见的视觉元素](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn)进行优化。
- 您已进行针对性优化或“意外”获得排名，但所针对的查询可能与您的网站相关但用户不感兴趣。如果您没有遇到此类问题，可以忽略这些查询。如果您不希望用户通过这些查询找到您（例如，这些查询包含令人反感的字词），请尝试微调您的内容，并针对这类会带来流量的查询，移除可能被视为其同义词或相关查询的提及内容。
- 用户可能已找到所需信息，如贵公司的营业时间、地址或电话号码。请查看用户使用的查询以及包含相关信息的网址。如果您的网站目标之一是吸引用户光顾您的实体店，那么这如您所期；如果您认为用户应该访问您的网站以获取更多信息，则可以尝试优化标题和说明，明确体现这一点。如需了解详情，请参阅下一部分。

  我们没有提及设备类别，因为它们可以作为衡量查询效果的额外指标。例如，假设当用户在街道中导航以查找某个地点时，某些查询的相关性更高；在这种情况下，相应查询在移动设备上的效果可能会非常出色，但在桌面设备上的效果则不佳。

## 针对特定查询改进搜索引擎优化 (SEO) 效果

  当您找到值得投入时间和精力进行优化的查询后，请务必针对这些查询来优化或制作网页。

  使用本页中显示的可视化图表找到相应查询后，您可以使用 Search Console 界面为特定查询[创建查询过滤条件](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#filteringdata)，或使用 Looker Studio 创建[数据透视表](https://support.google.com/looker-studio/answer/7516660?hl=zh-cn)；无论是哪种情况，您都可以查看由特定查询带来流量的所有网页。在确定要优化的查询及其相关网址后，请参阅 [SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn)来优化您的内容。以下是一些建议：

- 确保[标题](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn#page-titles)元素、[描述元标记](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#meta-descriptions)以及 Alt 属性具有描述性、具体且准确。
- 使用标题元素强调重要文字，为您的内容创建层次结构，便于用户和搜索引擎更轻松地浏览您的文档。
- 想一想用户为了找到您的某些内容而可能搜索的其他字词，例如同义词和相关查询。您可以借助由 Google Ads 提供的[关键字规划工具](https://ads.google.com/home/tools/keyword-planner/?hl=zh-cn)来发现新关键字变体，并了解每个关键字的大概搜索量。您还可以使用 [Google 趋势](https://developers.google.com/search/docs/monitor-debug/google-trends?hl=zh-cn)，从与您的网站相关的热门主题和查询中寻找优化灵感。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。