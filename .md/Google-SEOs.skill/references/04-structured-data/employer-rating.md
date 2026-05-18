# 雇主评分 (EmployerAggregateRating) 结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/employer-rating?hl=zh-cn

---

  # 雇主总体评分 (EmployerAggregateRating) 结构化数据

      如果您的网站发布由用户给出的招聘单位评分，请向网站中添加 EmployerAggregateRating 结构化数据。EmployerAggregateRating 是对招聘单位进行的一项评估，其中汇总了众多用户的意见。添加 EmployerAggregateRating 不仅可以为求职者提供招聘单位评分，有助于他们选择工作，而且还能让品牌醒目地显示在 Google 招聘信息丰富搜索结果中。

    在 Beta 版测试阶段，我们曾建议添加[评价摘要结构化数据](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn)，以便网页能够显示在招聘信息丰富搜索结果中。如果您的网站中目前有评价摘要结构化数据，建议您尽快将其转换为 EmployerAggregateRating 结构化数据。

      您的网站是否提供招聘信息？**如果是，请考虑添加 [JobPosting 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/job-posting?hl=zh-cn)。

      **注意**：在 Google 搜索结果中的实际显示效果可能会有不同。您可以使用[富媒体搜索结果测试](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)来预览大多数功能。

## 示例

下面是一个使用 JSON-LD 代码的 EmployerAggregateRating 示例。

<html>
  <head>
    <title>World's Best Coffee Shop</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type": "EmployerAggregateRating",
      "itemReviewed": {
        "@type": "Organization",
        "name" : "World's Best Coffee Shop",
        "sameAs" : "https://example.com"
      },
      "ratingValue": 91,
      "bestRating": 100,
      "worstRating": 1,
      "ratingCount" : "10561"
    }
    </script>
  </head>
  <body>
  </body>
</html>
    **

```
<html>
  <head>
    <title>World's Best Coffee Shop</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type": "EmployerAggregateRating",
      "itemReviewed": {
        "@type": "Organization",
        "name" : "World's Best Coffee Shop",
        "sameAs" : "https://example.com"
      },
      "ratingValue": 91,
      "bestRating": 100,
      "worstRating": 1,
      "ratingCount" : "10561"
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 
    如何添加结构化数据

    结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

    下面概述了如何构建、测试和发布结构化数据。如需获得向网页添加结构化数据的分步指南，请查看[结构化数据 Codelab](https://codelabs.developers.google.com/codelabs/structured-data/index.html?hl=zh-cn)。

1. 添加[必要属性](#structured-data-type-definitions)。根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
      **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
2. 遵循[指南](#guidelines)。
3. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码，并修复所有严重错误。此外，您还可以考虑修正该工具中可能会标记的任何非严重问题，因为这些这样有助于提升结构化数据的质量（不过，要使内容能够显示为富媒体搜索结果，并非必须这么做）。
4. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
    **注意**：Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
5. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/v1/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 指南

您的招聘信息必须遵循以下指南，才能显示在 Google 招聘信息搜索结果中。

    警告**：如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [技术指南](#technical-guidelines)
- [内容指南](#content-guidelines)
- [丰富搜索质量指南](https://developers.google.com/search/docs/appearance/enriched-search-results?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 技术指南

- 确保用户可以在您添加了 EmployerAggregateRating 结构化数据的网页中查看评分。必须确保用户能够一目了然地发现网页中包含评分内容。
- 提供与具体招聘单位（而非类别或内容列表）有关的评分信息。例如，“十大最佳工作场所”和“科技公司”就不是具体招聘单位。
- 默认情况下，Google 假定您的网站使用的是 5 分制，其中 5 是最高评分，1 是最低评分，但您也可以使用其他任何分制。如果您使用其他分制，则可以指定最高和最低评分，然后 Google 会将其调整为 5 星评分制。

### 内容指南

- 用户必须能够在您的网站上发布自己的评分，并且您的网站必须托管这些用户评分。
- 评分数量必须反映用户给出的实际评分数。
- 必须根据用户给出的评分准确计算总体评分。

## 结构化数据类型定义

本部分介绍了与雇主总体评分相关的结构化数据类型。为了让您的内容能够显示在增强的搜索结果中，您必须为其添加必要属性。

### EmployerAggregateRating

如需了解 EmployerAggregateRating 的完整定义，请访问 [schema.org/EmployerAggregateRating](https://schema.org/EmployerAggregateRating)。

Google 支持的属性如下：

      必要属性

      itemReviewed

[Organization](https://schema.org/Organization)

被评单位。itemReviewed 属性必须指向代表被评公司的 [schema.org/Organization](https://schema.org/Organization)。
          例如：

```
{
  "@context" : "https://schema.org/",
  "@type": "EmployerAggregateRating",
  "itemReviewed": {
    "@type": "Organization",
    "name" : "World's Best Coffee Shop",
    "sameAs" : "https://www.worlds-best-coffee-shop.example.com"
  }
}
```

      ratingCount

[Number](https://schema.org/Number)

相应单位在您的网站上获得的评分总数量。至少需要 ratingCount 和 reviewCount 其中之一。

      ratingValue

[Number](https://schema.org/Number) 或 [Text](https://schema.org/Text)

相应项的质量评分（以数字表示），可以是数字、分数或百分比（例如，“4”、“60%”或“6/10”）。
            Google 了解分数和百分比的分制，因为该分制隐含在分数本身或百分比中。数字的默认分制为 5 分制，1 为最低值，5 为最高值。如需采用其他分制，请使用 bestRating 和 worstRating。

        reviewCount

[Number](https://schema.org/Number)

指定给出评价的人数，无论是否附有评分。至少需要 ratingCount 和 reviewCount 其中之一。

      建议属性

      bestRating

[Number](https://schema.org/Number)

相应评分制中允许的最高值。如果省略 bestRating，系统会假定最高评分为 5 分。

      worstRating

[Number](https://schema.org/Number)

相应评分制中允许的最低值。如果省略 worstRating，系统会假定最低评分为 1 分。

## 问题排查

    如果您在实施或调试结构化数据时遇到问题，请查看下面列出的一些实用资源。

- 如果您使用了内容管理系统 (CMS) 或其他人负责管理您的网站，请向其寻求帮助。请务必向其转发列明问题细节的任何 Search Console 消息。
- Google 不能保证使用结构化数据的功能一定会显示在搜索结果中。如需查看导致 Google 无法将您的内容显示为富媒体搜索结果的各种常见原因，请参阅[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。
- 您的结构化数据可能存在错误。请参阅[结构化数据错误列表](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#error_list)。
- 如果您的网页受到结构化数据手动操作的影响，其中的结构化数据将会被忽略（但该网页仍可能会出现在 Google 搜索结果中）。如需修正[结构化数据问题](https://support.google.com/webmasters/answer/9044175?hl=zh-cn#zippy=,structured-data-issue)，请使用[“人工处置措施”报告](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)。
- 再次查看相关[指南](#guidelines)，确认您的内容是否未遵循指南。问题可能是因为出现垃圾内容或使用垃圾标记导致的。不过，问题可能不是语法问题，因此富媒体搜索结果测试无法识别这些问题。
- [针对富媒体搜索结果缺失/富媒体搜索结果总数下降进行问题排查](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#missing-jobs)。
- 请等待一段时间，以便 Google 重新抓取您的网页并重新将其编入索引。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。有关抓取和索引编制的常见问题，请参阅 [Google 搜索抓取和索引编制常见问题解答](https://developers.google.com/search/help/crawling-index-faq?hl=zh-cn)。
- 在 [Google 搜索中心论坛](https://support.google.com/webmasters/community?hl=zh-cn)中发帖提问。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。