# 向 Google 搜索结果添加署名日期 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/publication-dates?hl=zh-cn

---

# 影响您在 Google 搜索中的署名日期

**署名日期是指 Google 估计的网页更新或发布日期。
      如果 Google 能确定您的网页或视频的署名日期，并且认为这些信息对用户有用，就会在 Google 搜索结果中显示这些信息。您可以提供相关信息，帮助 Google 确定署名日期。

        该插图展示了 Google 搜索中的一条文字搜索结果，其中用突出显示的方框圈出了署名日期部分

Curious Panda

[树懒为什么这么慢？](https://wikipedia.org/wiki/Sloth)

2023 年 8 月 25 日

Google 不会仅依赖 1 种因素来确定日期，因为所有因素都可能会出现问题。因此，我们的系统会综合考虑多种因素，确定与网页发布时间或大幅更新时间最接近的估算值。

## 如何向 Google 提供日期信息

若要向 Google 提供日期信息，请按以下步骤操作：

1. 遵循[影响署名日期的最佳实践](#guidelines)。
2. 在网页中添加用户可见的日期，并在醒目位置突出显示该日期。使用“发布”或“上次更新日期”等文字适当标记日期。下面这些示例展示了如何突出显示网页的日期信息：

- **发布日期：2019 年 2 月 4 日**
- **发布时间：2019 年 2 月 4 日**
- **上次更新日期：2018 年 2 月 14 日**
- **更新时间：2019 年 2 月 14 日晚上 8 点（美国东部时间）**

        您可以提供发布日期和/或上次更新日期。

```

    Analyzing Google Search traffic drops

      Posted Tuesday, July 20, 2021

      Suppose you open Search Console and find out that your Google Search traffic dropped. What should you do?

```
3. 使用[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)指明日期。我们建议您添加 [CreativeWork](https://schema.org/CreativeWork) 的子类型（例如 [Article](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn)、[BlogPosting](https://schema.org/BlogPosting) 或 [VideoObject](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn)），并指定 datePublished 和/或 dateModified 字段。
        请[务必遵循 Google 的结构化数据指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)，以便我们的抓取工具了解文章的日期信息。
```

    Analyzing Google Search traffic drops

    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Analyzing Google Search traffic drops",
      "datePublished": "2021-07-20T08:00:00+08:00",
      "dateModified": "2021-07-20T09:20:00+08:00"
    }

      Posted Tuesday, July 20, 2021

      Suppose you open Search Console and find out that your Google Search traffic dropped. What should you do?

```

## 
      影响署名日期的最佳实践

    虽然 Google 无法保证某个署名日期（无论是可见日期还是结构化数据中的日期）一定会显示在搜索结果中，但遵循这些指南确实有助于我们的算法找到并处理相关信息。

- **必须指明日期，但无需指明时间**：但是，我们建议您在标记中提供时间和时区，以提高精确度。
- **如果您选择指明时区**，请提供[正确的时区](https://en.wikipedia.org/wiki/ISO_8601#Time_zone_designators)，并视情况考虑[夏令时](https://en.wikipedia.org/wiki/Daylight_saving_time)的影响。
- **确保日期和时间一致。**确保相对应的用户可见值和结构化值中的日期（以及可选的时间和时区）一致。但即使结构化数据中提供了时间和时区，您仍可以选择在用户可见的数据中不提供这些信息。
- **所指明的日期不能是未来的日期，也不能是和网页上所述操作有关的日期。**
        提供的日期必须描述的是网页的发布或更新日期，而不是网页中所述故事或活动的发布或更新日期。您可以视需要向网页添加[活动标记](https://developers.google.com/search/docs/appearance/structured-data/event?hl=zh-cn)，以描述网页上列出的活动。
- **尽可能减少网页中显示的其他日期**：如果您已遵守了最佳实践，但仍发现系统选择了不正确的日期，请考虑移除网页中显示的部分或所有其他日期。
- **如果您有意让自己的网页出现在 Google 新闻的搜索结果中**，请遵循[这些额外的指南](https://support.google.com/news/publisher-center/answer/9607104?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。