# 使内容出现在 Google 探索中 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/google-discover?hl=zh-cn

---

# Google 探索和您的网站

[Google 探索](https://support.google.com/websearch/answer/2819496?hl=zh-cn)是 Google 搜索的一部分，可根据用户的[网络与应用活动记录](https://support.google.com/websearch/answer/54068?hl=zh-cn)向用户显示其感兴趣的内容。本页详细介绍了内容在 Google 探索中可能会如何呈现，以及可供网站所有者参考的最佳做法。

## 内容如何显示在 Google 探索中

任何[被 Google 编入索引](https://developers.google.com/search/docs/essentials/technical?hl=zh-cn)并符合 Google 探索[内容政策](https://support.google.com/websearch/answer/9982767?hl=zh-cn)的内容自动有资格显示在 Google 探索中，无需包含任何特殊标记或结构化数据。请注意，有资格显示在 Google 探索中并不保证一定会显示。

Google 探索中可能会显示的内容涵盖了符合用户兴趣的各种主题。只要旧内容对个人有帮助并能令其感兴趣，系统便有可能会显示此类内容。

如果您的网站违反了一项或多项 Google 探索内容政策，Search Console 中的“安全问题和人工处置措施”下方可能会显示针对 Google 探索的人工处置措施。详细了解[违规类型以及如何解决违规问题](https://support.google.com/webmasters/answer/9044175?hl=zh-cn#news_discover&zippy=,news-and-discover-policy-violations)。

  作为 Google 搜索的一部分，Google 探索会利用 Google 搜索所用的许多信号和[系统](https://developers.google.com/search/docs/appearance/ranking-systems-guide?hl=zh-cn)来确定哪些是实用且以用户为中心的内容。因此，希望通过 Google 探索取得成功的用户应该查看我们关于[创建实用、可靠且以用户为中心的内容](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=zh-cn)方面的建议。

为了提高您的内容出现在 Google 探索中的可能性，我们建议您采取以下措施：

- 切勿使用“点击诱饵”或类似手段，通过在预览内容（标题、摘要或图片）中使用误导性或夸大的细节来吸引眼球，或故意隐瞒理解内容要旨所需的关键信息，从而人为地虚增互动度。
- 使用能够反映内容精髓的网页标题和新闻标题。
- 切勿为了迎合病态的好奇心、刺激感或煽动愤怒情绪，而使用哗众取宠的手段来操纵内容的吸引力。
- 内容及时契合当前用户兴趣、行文引人入胜或能提供独特见解。
- 在内容中加入引人注目的高品质相关图片，尤其是大幅图片，更有可能吸引用户通过 Google 探索访问您的内容。我们建议您使用符合以下规范的图片：

      宽度至少为 1200 像素
- 总像素数超过 30 万的高分辨率图片（例如，一张 16:9 的 1280x720 像素图片，总像素数达到 921,600，完全符合这项要求）
- 16x9 宽高比

          Google 会尝试自动剪裁图片，以便在 Google 探索中使用。如果您选择自行裁剪图片，请务必确保图片裁剪得当，并已调整好位置，以适应横向显示，同时避免自动应用宽高比。例如，如果您将竖向图片裁剪为 16x9 宽高比，请务必确保重要细节包含在您在 og:image meta 标记中指定的裁剪版本中。
- 通过 [max-image-preview:large 设置](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#max-image-preview)或使用 [AMP](https://www.ampproject.org/) 启用

  使用 [schema.org 标记](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#schema-primary-image-of-page)或 og:image meta 标记指定与网页相关且具有代表性的大图片，因为这会影响在 Google 探索中选择的缩略图。详细了解[如何指定首选图片](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#specify-preferred-image)。

- 避免在 schema.org 标记或 og:image meta 标记中使用通用图片（例如网站徽标）。
- 为获得最佳效果，请避免在 schema.org 标记或 og:image meta 标记中使用包含大量文字的图片。

  提供总体出色的网页体验。如需更多建议，请查阅我们的帮助页面，[深入了解 Google 搜索结果中的网页体验](https://developers.google.com/search/docs/appearance/page-experience?hl=zh-cn)。

为了提供良好的用户体验，Google 探索会尽量提供适合基于兴趣的信息流的内容，例如文章和视频，并滤除不需要或可能会使用户感到困惑的内容。例如，Google 探索可能不会推荐无任何背景信息的职位申请、请愿书、表单、代码库或讽刺性内容。Google 探索使用[SafeSearch](https://developers.google.com/search/docs/crawling-indexing/safesearch?hl=zh-cn)功能，但除此之外，还过滤掉了可能被视为惊吓或意外的内容。

## 为什么 Google 探索流量可能会随着时间的推移发生变化

  与由关键字驱动的搜索访问相比，Google 探索带来的流量有些不可预测或不太可靠。鉴于 Google 探索显示的内容具有不确定性，您应该将 Google 探索带来的流量视为对由关键字驱动的搜索流量的补充。以下是导致 Google 探索流量出现波动的一些原因：

- **改变兴趣**：Google 探索经过精心设计并在不断改进，能够根据用户的兴趣显示相应的内容，而这在一定程度上取决于用户的搜索活动。如果用户对某个主题不再感兴趣（或许这体现在搜索量下降上），则 Google 探索信息流可能会显示他们更感兴趣的其他内容，进而可能导致发布商的流量发生变化。
- **内容类型**：Google 探索会持续调整信息流中可能会显示的内容类型，以便更好地契合用户要寻找的内容。Google 探索会定期显示开放网络中提供的内容，包括但不限于运动、健康、娱乐和时尚生活类内容。
- **Google 搜索更新**：我们还会定期[更新 Google 搜索](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history?hl=zh-cn)，以便更好地为用户提供指向实用内容的链接。由于 Google 探索是对 Google 搜索的扩展，因此更新有时可能会造成流量变化。如果您发现网站在更新后的表现发生了变化，不妨查看有关 [Google 搜索的核心更新与您的网站之间的关系](https://developers.google.com/search/docs/appearance/core-updates?hl=zh-cn)的文档。

      不过，您也可能在更新后无需执行任何操作。我们在不断改善 Google 探索的用户体验，因此网站的流量可能会出现变化，这与它们的内容质量或发布频率无关。

## 监控您的内容在 Google 探索中的表现

  如果您的内容显示在 Google 探索中，您可以使用[ Google 探索效果报告](https://support.google.com/webmasters/answer/9216516?hl=zh-cn)监测内容的表现。只要您的数据在 Google 探索中的展示次数达到最低阈值，这份报告就会显示在过去 16 个月内您的任何 Google 探索内容的展示次数、点击次数和点击率。Google 探索效果报告[包含来自 Chrome 的流量](https://developers.google.com/search/blog/2021/02/search-console-performance-discover-chrome?hl=zh-cn)，还可全面跟踪用户与 Google 探索互动过的所有平台上的 Google 探索网站流量。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。