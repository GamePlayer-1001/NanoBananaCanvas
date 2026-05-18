# 使用 Search Console 和 Google Analytics 数据进行搜索引擎优化 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console?hl=zh-cn

---

  # 使用 Search Console 和 Google Analytics 数据进行搜索引擎优化

  将 [Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start?hl=zh-cn) 和 [Google Analytics](https://developers.google.com/analytics?hl=zh-cn) 结合使用，可以让您更全面地了解受众群体如何发现和体验您的网站，从而帮助您在进行网站搜索引擎优化 (SEO) 时做出更明智的决策。本指南介绍了如何使用 [Looker Studio](https://support.google.com/looker-studio/answer/6283323?hl=zh-cn) 监控来自 Search Console 和 Google Analytics 的指标，以图表形式同时查看两种数据，以及排查这两种工具之间存在的数据差异。

## Google Analytics 和 Search Console 简介

  这两种工具相辅相成，可帮助您更好地了解受众群体以及他们在访问网站前后对网站的体验。您可以快速了解网站在 Google 搜索中的表现以及与其他流量来源的关系。

- **Search Console**：提供有关**您的网站在 Google 搜索结果中的表现**的数据，例如您的网站在搜索结果中显示的次数（展示次数）、用户通过 Google 搜索访问您的网站的次数（点击次数）、哪些搜索字词将用户引导至您的网站（查询）等。它侧重于用户通过 Google 搜索访问您的网站之前的活动。
- **Google Analytics**：提供有关**访问者与您网站的互动**的数据，例如他们访问了哪些网页、停留了多长时间以及执行了哪些操作。
  它还会显示有关受众群体来源的数据，这有助于您衡量流量渠道的效果，例如电子邮件、来自其他网站或社交平台的引荐、付费搜索和自然搜索。

刚开始使用？**您需要拥有 Search Console 和 Google Analytics 账号才能开始使用。如果您还没有 Search Console 和 Google Analytics 账号，请了解如何[在 Search Console 中验证您的网站](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)以及[设置 Google Analytics ](https://support.google.com/analytics/answer/9304153?hl=zh-cn)。

### 比较 Google Analytics 和 Search Console 中的数据

  在将转化（例如电子商务交易、简报注册、潜在客户发掘表单填写）归因于 Google 搜索流量时，将 Search Console 效果数据与 Google Analytics 自然流量进行比较特别有用。不过，这些工具使用不同的指标和系统，这意味着数据不会完全匹配，并且您在访问每种工具时都可以访问更多指标。

  为了了解数据的一般模式，我们建议您重点关注以下两个指标，因为它们最具可比性：

        **Search Console 点击次数**

          当用户点击 Google 搜索结果中指向您网站的链接时，就会产生一次*[点击](https://support.google.com/webmasters/answer/7042828?hl=zh-cn#click)*。

        **Google Analytics 会话**

[会话](https://support.google.com/analytics/answer/9191807?hl=zh-cn)**是指用户与您的网站或应用互动的一段时间。

“点击次数”和“会话数”的计算方式不同，这意味着在比较数据时，您可能会看到不同的数字。如需详细了解数字差异的原因，请参阅[了解数据差异](#discrepancies)部分。

## 在 Looker Studio 中监控您的 Google 自然搜索流量

  使用 Looker Studio，您可以在一个视图中直观了解来自 Search Console 和 Google Analytics 的网站自然搜索流量。如需开始使用您自己的数据进行监控，您可以使用我们的 [Looker Studio 信息中心模板](https://lookerstudio.google.com/reporting/408e669d-07d1-4353-a1dc-94f06bde27ef/page/Hqrp/preview?hl=zh-cn)。

### 设置信息中心

首次打开信息中心模板时，您会看到一些错误。出现这种情况是因为您需要先配置自己的数据，然后才能查看图表：

1. 打开[信息中心模板](https://lookerstudio.google.com/reporting/408e669d-07d1-4353-a1dc-94f06bde27ef/page/Hqrp/preview?hl=zh-cn)。
2. 点击**使用我自己的数据**。
3. 配置您的数据源：[连接到 Search Console](https://cloud.google.com/looker/docs/studio/connect-to-search-console?hl=zh-cn)，然后在“表格”面板中选择**网址展示**。
4. [关联到 Google Analytics](https://cloud.google.com/looker/docs/studio/connect-to-google-analytics?hl=zh-cn)。

  继续将每个图表连接到其相关的数据源。

### 了解信息中心

  该信息中心会并排显示 Google Analytics 和 Search Console 数据。为了帮助您识别各个数据源，信息中心会在所有图表中使用橙色表示 Google Analytics 数据，使用蓝色表示 Search Console 数据。

#### 过滤条件和数据控制

  为了更好地关注 Google 自然搜索流量，Google Analytics 数据已过滤，仅包含来自 Session source = google 和 Session medium = organic 的会话。

**高级提示**：如果您想混合或联接数据以查看各个查询的数据，可以使用国家/地区、设备、着陆页维度。最有效的方法是通过 BigQuery 使用 [Search Console 批量导出](https://support.google.com/webmasters/answer/12917675?hl=zh-cn)和 [Google Analytics BigQuery 导出](https://support.google.com/analytics/answer/9358801?hl=zh-cn)功能。
  您还可以使用 [Looker Studio 混合功能](https://support.google.com/looker-studio/answer/9061421?hl=zh-cn)执行此操作。

信息中心包含以下过滤条件和数据控件，可帮助您有效地控制数据：

1. **[数据控件](https://support.google.com/datastudio/answer/7415591?hl=zh-cn)**：选择要分析的 Search Console 和 Google Analytics 资源。如果您有权访问多个账号，并且想要在这些账号之间切换，那么在资源之间切换会特别有用。
2. **国家/地区和设备**：包含或排除国家/地区和设备类别。
    为了进行公平的比较，我们建议您**为这两个数据源选择相同的过滤条件**。因此，如果您在 Search Console 中将过滤条件设为澳大利亚的移动设备，请务必也更改 Google Analytics 过滤条件。
3. **日期范围**：选择您要在信息中心内查看的日期范围。报告的默认时间范围为“过去 28 天”，但 Search Console 数据可能会延迟几天。您可以随时根据需求更改时间范围。

#### 指标

  该信息中心使用五个指标，可让您大致了解网站的自然搜索流量的数量和质量：

      信息中心内的指标

      **1. 会话数**
        **(Google Analytics)

      用户与您的网站互动的一段时间。对于网站来说，当用户查看您网站上的网页或界面，且没有任何会话处于活动状态时（例如，之前的会话已超时），即会发起会话。此报告会显示归因于自然搜索的网站流量。详细了解[会话数的计算方式](https://support.google.com/analytics/answer/9191807?hl=zh-cn)。

      2. 感兴趣的会话占比**
        **(Google Analytics)

          对内容感兴趣的会话所占的百分比。感兴趣的会话是指符合以下任一条件的会话：

- 包含*[关键事件](https://support.google.com/analytics/answer/9355848?hl=zh-cn)*的会话
- 持续时间超过 10 秒的会话
- 发生了至少 2 次网页浏览的会话

          详细了解[感兴趣的会话占比](https://support.google.com/analytics/answer/11109416?hl=zh-cn)。

      3. 回访用户数**
        **
        (Google Analytics [分析])

      之前曾发起过至少一个会话并返回您网站的用户所占的百分比。此指标显示用户是否通过自然搜索回访您的网站。
        详细了解[回访用户数](https://support.google.com/analytics/answer/12253918?hl=zh-cn)。

      4. 点击次数**
        **(Search Console)

      用户从 Google 搜索结果点击并转到您网站的总次数。
        详细了解[点击次数的计算方式](https://support.google.com/webmasters/answer/7042828?hl=zh-cn#click)。

      5. 点击率 (CTR)**
        **
        (Search Console)

      点击次数除以展示次数所得的值。此指标显示的是，在 Google 搜索结果中看到您的网站的用户点击链接访问该网站的频率。

#### 图表

  该信息中心还包含多个图表，可帮助您更好地分析受众群体通过 Google 自然搜索访问您的网站的情况。请注意，橙色表示 Google Analytics 数据，蓝色表示 Search Console 数据。

  这些图表侧重于可帮助您了解某些事件发生时间的模式。信息中心的目标不是深入分析数据，而是快速发现流量变化。

  尽管数据来源不同，但总体趋势和模式应该是相似的。如果您发现图表有显著差异，请仔细阅读[差异部分](#discrepancies)。

1. **一自然搜索会话数和感兴趣的会话占比随时间的变化**：会话数显示您从搜索中获得的流量数量，而感兴趣的会话占比显示流量的质量；这两项指标结合起来可以很好地评估您的自然搜索流量是否表现良好。

- **如果您发现自然搜索流量发生了重大变化**，请前往 Search Console 进行进一步分析。我们有一份文档介绍了[如果您发现流量下降，该怎么做](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=zh-cn)。
- **如果您发现感兴趣的会话占比下降**，请分析您的内容，并尝试了解您是否可以让内容与自然搜索受众群体更相关（例如，确保网页内容与受众群体找到您网站时使用的查询密切相关）。
2. **自然搜索流量占比随时间的变化**：没有好或坏的百分比，因为这取决于您的受众群体和业务。如果趋势发生显著变化，而会话数和互动图表没有变化，请前往 Google Analytics 查看[“流量获取”报告](https://support.google.com/analytics/answer/12923437?hl=zh-cn)。
    也许某些其他流量来源正在大幅增加或减少，这可能会导致自然搜索流量的百分比上升或下降。
3. **点击次数和点击率随时间的变化**：点击次数和点击率显示了您在 Google 搜索中的表现量和质量：它们显示了用户是否在搜索结果中点击了您的网站，以及您的搜索[摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)是否成功吸引用户点击。如果您发现常规模式发生了变化，请检查哪些特定查询和网页[出现了下降](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops?hl=zh-cn)或峰值。
4. **按点击次数和点击率排序的热门网页和查询**：获得点击次数最多的特定网页和查询。此表格和国家/地区表格还包含一些列，用于显示可用指标与在日期范围选择器中所选的上一个时间段相比发生了多大变化。
5. **热门国家/地区表格**：如果您的网站面向多个国家/地区，那么您可能需要更深入地了解这些统计信息。您可以在 Google Analytics 中（使用[报告过滤器](https://support.google.com/analytics/answer/11377859?hl=zh-cn)）或在 Search Console 中（使用[效果过滤器](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#filteringdata)）执行此操作；在过滤数据以仅包含特定国家/地区后，您可以查看网页或查询随时间的变化情况。

## 在 Google Analytics 和 Search Console 中进行更深入的调查

  搜索效果的真实来源始终是 Search Console，而网站内行为的真实来源是 Google Analytics。自然 Google 搜索流量信息中心可帮助您监控搜索流量，但不一定能帮助您调试和解决流量问题（如需调试和解决流量问题，您可以直接访问各个工具）。

  在 Google Analytics 中，以下报告对于深入了解和调查您网站的自然搜索效果特别有用：

- **[流量获取情况报告](https://support.google.com/analytics/answer/12923437?hl=zh-cn)**：调查会话来源。在这里，您可以查看有多少会话源自“自然搜索”渠道和“Google”来源。您可以使用此数据来详细了解您的 Google 搜索流量，例如用户在您的网站上执行了哪些操作，以及他们是否最终进行了购买或订阅了您的内容。
- **[着陆页报告](https://support.google.com/analytics/answer/12931766?hl=zh-cn)，并使用过滤条件仅显示来自 Google 自然搜索的会话**：这有助于您了解该网页对自然流量有多大帮助，以及在提升网站互动度和转化方面表现如何。

  在 Search Console 中，效果报告最适合了解流量波动情况。首先，请查看[效果报告常见任务](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#common_tasks)，了解数据；如有必要，请尝试使用该工具中的[其他可用报告](https://developers.google.com/search/docs/monitor-debug/search-console-start?hl=zh-cn)。

## 了解 Google Analytics 与 Search Console 之间的数据差异

  在比较这些工具之间的数据时，您会发现，即使是最相似的指标（会话和点击次数）也不完全相同。虽然总计数不完全相同，但重要的是，总体趋势具有相同的模式。本部分将介绍差异的原因，以及如何最大限度地减少较大的差异（如果适用）。

- **差异较小**：如果差异较小，您可以忽略这些差异。由于系统不同，数字略有差异是正常现象，您无需修正。
- **差异较大**：如果差异较大，请进一步了解[以下原因](#big-discrepancy)。
    您或许可以尽量缩小差异，或者至少可以找出导致数字出现差异的原因。

### 点击次数和会话数存在巨大差异的主要原因

  查看自然 Google 搜索流量信息中心时，或者将从这些工具导出的数据与会话和点击次数进行比较时，您可能会发现 Google Analytics 数据与 Search Console 数据存在差异。如果您发现数据存在差异，请检查以下任一场景是否适用于您的网站。原因可能不止一个，具体取决于您的网站配置、受众群体和流量组成。

此列表包含最常见的问题，但其中一些原因无法有效调试（由于系统的性质）。不过，了解这些信息有助于您做出**合理的推断**。

      点击次数和会话数存在巨大差异的原因

      在 Google Analytics 中实现**

          Google Analytics 是一款工具，可让您通过在网站或应用中植入代码来收集行为数据，因此这取决于您植入的代码以及植入方式。在 Google Analytics 中，有些实现和配置问题可能会影响数据质量。例如，您的网站上可能缺少 Google Analytics 代码。如需确保 Google Analytics 设置正确无误，请按照[设置指南](https://support.google.com/analytics/answer/9304153?hl=zh-cn)中的步骤操作。

          另一方面，Search Console 是一款工具，可让您访问 Google 搜索数据，Google 会统一处理所有资源的数据。这意味着，您对设置的配置方式对数据的影响较小。

      **Cookie 或跟踪**

          如果您的网站要求用户接受跟踪，而用户选择停用跟踪功能，则可能会导致 Google Analytics 数据出现偏差。请阅读[用户意见征求管理简介](https://support.google.com/analytics/answer/12329599?hl=zh-cn)，详细了解如何从 Google Analytics 角度处理此问题。

      **时区**

          您可以在 Google Analytics 中选择时区，但无法在 Search Console 中自定义时区，因为 Search Console 的[默认时区为太平洋时间 (PT)](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#timezone)。
          如果您在 Google Analytics 中将时区设置为与太平洋标准时区相差较大的地理位置（例如，如果您的网站主要面向澳大利亚的用户），这种情况会尤为明显。

      **归因**

          在 Google Analytics 中，您可以使用[三种归因模型](https://support.google.com/analytics/answer/10596866?hl=zh-cn)，而 Search Console 会统计 Google 搜索中的每一次点击。最接近的可用归因模型是 Google Analytics 中的默认模型。

      **规范网址**

          Search Console[仅针对 Google 搜索规范网址生成报告](https://support.google.com/webmasters/answer/7042828?hl=zh-cn#url)，而 Google Analytics 则针对包含跟踪代码的任何网址生成报告。这意味着，您在 Google Analytics 中看到的网址数量可能会更高。

      **流量细分**

          Search Console 会按网页、图片、视频、新闻和 Google 探索对流量进行细分。这些类别细分在 Google Analytics 中有所不同。

      **非 HTML 网页**

          如果您的网站包含非 HTML 网页（例如 PDF），Search Console 会默认将这些网页纳入统计，前提是这些网页在 Google 搜索中显示或被点击。您的 Google Analytics 可能未配置为衡量这些事件，因此您可以先启用[增强型衡量事件](https://support.google.com/analytics/answer/9216061?hl=zh-cn)。

      **漫游器流量**

          Google Analytics 会自动排除来自已知漫游器和“蜘蛛”程序的流量，而 Search Console 不一定会滤除这些流量。

## 关于如何将 Search Console 与 Google Analytics 搭配使用的资源

  如果您想了解如何通过其他方式结合 Search Console 和 Google Analytics 进行分析和可视化，请参阅以下资源：

- **[将 Search Console 与 Google Analytics 相关联](https://support.google.com/analytics/answer/10737381?hl=zh-cn)**：这样一来，Google Analytics 中就会提供一些 Search Console 报告，如果您想快速访问为您的网站带来 Google 自然搜索流量的查询和着陆页，这些报告会非常有用。
- **[适用于 WordPress 的 Site Kit 插件](https://sitekit.withgoogle.com/documentation/getting-started/connecting-services/)**：如果您的网站采用了 WordPress，您可以在 WordPress 的单个信息中心内查看 Google Analytics 和 Search Console 数据。
- **Search Console 批量数据导出和 Google Analytics 导出到 BigQuery**：为了获得尽可能详细的数据并最大限度地减少数据差异，我们建议[将 Search Console 数据导出到 BigQuery](https://support.google.com/webmasters/answer/12917675?hl=zh-cn)，并将其与 [Google Analytics BigQuery 导出数据](https://support.google.com/analytics/answer/9358801?hl=zh-cn)合并。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。