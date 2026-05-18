# 软件应用 (SoftwareApplication) 架构 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/software-app?hl=zh-cn

---

  # 软件应用 (SoftwareApplication) 结构化数据

在网页的正文中标记软件应用信息，可以更好地在 Google 搜索结果中显示您的应用详情。

      注意**：在 Google 搜索结果中的实际显示效果可能会有不同。您可以使用[富媒体搜索结果测试](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)来预览大多数功能。

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

## 示例

        JSON-LD

下面是一个 JSON-LD 格式的软件应用示例：

       <html>
  <head>
    <title>Angry Birds</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Angry Birds",
      "operatingSystem": "ANDROID",
      "applicationCategory": "GameApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.6,
        "ratingCount": 8864
      },
      "offers": {
        "@type": "Offer",
        "price": 1.00,
        "priceCurrency": "USD"
      }
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
    <title>Angry Birds</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Angry Birds",
      "operatingSystem": "ANDROID",
      "applicationCategory": "GameApplication",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.6,
        "ratingCount": 8864
      },
      "offers": {
        "@type": "Offer",
        "price": 1.00,
        "priceCurrency": "USD"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

        RDFa

下面是一个 RDFa 格式的软件应用示例：

      <div vocab="https://schema.org/" typeof="SoftwareApplication">
  <span property="name">Angry Birds</span> -

  REQUIRES <span property="operatingSystem">ANDROID</span>
  TYPE: <span property="applicationCategory" content="GameApplication">Game</span>

  RATING:
  <div property="aggregateRating" typeof="AggregateRating">
    <span property="ratingValue">4.6</span> (
    <span property="ratingCount">8864</span> ratings )
  </div>

  <div property="offers" typeof="Offer">
    Price: $<span property="price">1.00</span>
    <meta property="priceCurrency" content="USD" />
  </div>
</div>

```
<div vocab="https://schema.org/" typeof="SoftwareApplication">
  <span property="name">Angry Birds</span> -

  REQUIRES <span property="operatingSystem">ANDROID</span>
  TYPE: <span property="applicationCategory" content="GameApplication">Game</span>

  RATING:
  <div property="aggregateRating" typeof="AggregateRating">
    <span property="ratingValue">4.6</span> (
    <span property="ratingCount">8864</span> ratings )
  </div>

  <div property="offers" typeof="Offer">
    Price: $<span property="price">1.00</span>
    <meta property="priceCurrency" content="USD" />
  </div>
</div>

```

        微数据

下面是一个微数据格式的软件应用示例：

      <div itemscope itemtype="https://schema.org/SoftwareApplication">
  <span itemprop="name">Angry Birds</span> -

  REQUIRES <span itemprop="operatingSystem">ANDROID</span>
  TYPE: <span itemprop="applicationCategory" content="GameApplication">Game</span>

  RATING:
  <div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <span itemprop="ratingValue">4.6</span> (
    <span itemprop="ratingCount">8864</span> ratings )
  </div>

  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    Price: $<span itemprop="price">1.00</span>
    <meta itemprop="priceCurrency" content="USD" />
  </div>
</div>

```
<div itemscope itemtype="https://schema.org/SoftwareApplication">
  <span itemprop="name">Angry Birds</span> -

  REQUIRES <span itemprop="operatingSystem">ANDROID</span>
  TYPE: <span itemprop="applicationCategory" content="GameApplication">Game</span>

  RATING:
  <div itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
    <span itemprop="ratingValue">4.6</span> (
    <span itemprop="ratingCount">8864</span> ratings )
  </div>

  <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
    Price: $<span itemprop="price">1.00</span>
    <meta itemprop="priceCurrency" content="USD" />
  </div>
</div>

```

## 指南

要使您的应用能够显示为富媒体搜索结果，您必须遵循以下指南。

    警告**：如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[手动操作](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

## 结构化数据类型定义

若要使您的内容能够显示为富媒体搜索结果，您必须为其添加必要属性。还有一些建议添加的属性，能帮助您添加更多与您的内容相关的信息，进而提供更好的用户体验。

### SoftwareApplication

如需了解 SoftwareApplication 的完整定义，请访问 [schema.org/SoftwareApplication](https://schema.org/SoftwareApplication)。

Google 支持的属性如下：

      必要属性

            name

[Text](https://schema.org/Text)

应用的名称。

            offers.price

[Offer](https://schema.org/Offer)

应用的销售优惠。对于开发者，offers 可表明出售应用的市场。对于市场，offers 可用于表明某个应用实例的具体应用价格。

              如果应用是免费提供的，请将 offers.price 设置为 0。例如：

```
"offers": {
  "@type": "Offer",
  "price": 0
}
```

              如果应用的价格大于 0，我们建议您还添加 offers.priceCurrency 属性（否则 Google 会尝试找到正确的币种）。
              例如：

```
"offers": {
  "@type": "Offer",
  "price": 1.00,
  "priceCurrency": "USD"
}
```

            评分或评价

              应用评分或评价。您必须添加以下属性之一：

                aggregateRating

[AggregateRating](https://schema.org/AggregateRating)

应用的平均评价分数。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看必需和建议的 [AggregateRating 属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregate_rating_type_definitions)列表。

                review

[Review](https://schema.org/Review)

应用的单个评价。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看必需和建议的[评价属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#review-properties)列表。

      建议属性

            applicationCategory

[Text](https://schema.org/Text)

应用类型（例如，BusinessApplication 或 GameApplication）。该值必须是支持的应用类型。

**支持的应用类型列表**

- GameApplication
- SocialNetworkingApplication
- TravelApplication
- ShoppingApplication
- SportsApplication
- LifestyleApplication
- BusinessApplication
- DesignApplication
- DeveloperApplication
- DriverApplication
- EducationalApplication
- HealthApplication
- FinanceApplication
- SecurityApplication
- BrowserApplication
- CommunicationApplication
- DesktopEnhancementApplication
- EntertainmentApplication
- MultimediaApplication
- HomeApplication
- UtilitiesApplication
- ReferenceApplication

            operatingSystem

[Text](https://schema.org/Text)

使用应用所需的操作系统（例如，Windows 7、OSX 10.6、Android 1.6）

### 应用子类型的扩展属性

对于移动应用和 Web 应用，Google 还支持 [MobileApplication](https://schema.org/MobileApplication) 和 [WebApplication
      ](https://schema.org/WebApplication)。

对于只有 [VideoGame](https://schema.org/VideoGame) 类型的软件应用，Google 不会显示富媒体搜索结果。
      为了确保您的软件应用能够显示为富媒体搜索结果，请同时列出 [VideoGame](https://schema.org/VideoGame) 类型与其他类型。例如：

```
{
  "@context": "https://schema.org",
  "@type": ["VideoGame", "MobileApplication"],
  ....
}
```

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