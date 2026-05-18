# 了解 Google 活动架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/event?hl=zh-cn

---

  # 活动 (Event) 结构化数据

您可以利用 Google 上的活动搜索服务，让用户可通过 Google 搜索结果和其他 Google 产品（如 Google 地图）找到并参加这些活动。该功能的优势如下：

- **更具互动性的搜索结果**：您的活动能够显示在 Google 上的活动搜索结果中，同时还会显示徽标和活动说明等信息。
- **曝光和转化几率增加**：用户将可以通过新的方式与您的活动信息互动，并点击进入您的网站。了解 [Eventbrite 如何顺利通过 Google 搜索使典型流量年同比增长 1 倍](https://developers.google.com/search/case-studies/eventbrite-case-study?hl=zh-cn)。

*

  您可以通过以下三种方式使您的活动显示在 Google 上：

- **如果您通过第三方网站（例如票务网站或社交平台）发布活动**，请检查活动发布商是否已参与 Google 的活动搜索服务。如果活动发布商已经与 Google 集成，那么您可以继续在第三方网站上发布活动，无需再继续阅读下文。
- **如果您使用 CMS（如 WordPress）且无权修改 HTML**，请查看该 CMS 是否有可向您的网站添加结构化数据的插件。
        或者，您也可以使用[数据标注工具](https://support.google.com/webmasters/answer/2774099?hl=zh-cn)在不修改网站 HTML 的情况下将活动信息提供给 Google。
- **如果您有能力修改 HTML**，可以[使用结构化数据直接与 Google 集成](#add-structured-data)。您将需要修改活动网页的 HTML。

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

### 
  标准活动

下面是一个 JSON-LD 格式的标准 Event 示例。标准活动表示活动仅在实地按计划举办。您也可以使用微数据或 RDFa 语法。

<html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 
  带有状态更新的活动

  设置活动状态的方法有多种。下面是一些状态更新的活动的常见示例。有关详情，请参阅 [eventStatus](#eventstatus) 属性。

#### 
      已取消

      下面是一个已取消的活动示例。

    <html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventCancelled",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventCancelled",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

#### 
      已改期

      下面是一个已重新安排的活动示例。

    <html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventRescheduled",
      "previousStartDate": "2025-03-21T19:00-05:00",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>The Adventures of Kira and Morrison</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "The Adventures of Kira and Morrison",
      "startDate": "2025-07-21T19:00-05:00",
      "endDate": "2025-07-21T23:00-05:00",
      "eventStatus": "https://schema.org/EventRescheduled",
      "previousStartDate": "2025-03-21T19:00-05:00",
      "location": {
        "@type": "Place",
        "name": "Snickerpark Stadium",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "100 West Snickerpark Dr",
          "addressLocality": "Snickertown",
          "postalCode": "19019",
          "addressRegion": "PA",
          "addressCountry": "US"
        }
      },
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance.",
      "offers": {
        "@type": "Offer",
        "url": "https://www.example.com/event_offer/12345_202403180430",
        "price": 30,
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "validFrom": "2024-05-21T12:00"
      },
      "performer": {
        "@type": "PerformingGroup",
        "name": "Kira and Morrison"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Kira and Morrison Music",
        "url": "https://kiraandmorrisonmusic.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 推出地区和支持的语言

我们非常高兴能够面向全球更多地区推出 Google 上的活动搜索服务。我们已在以下地区推出该服务，并在右侧列出了支持的语言。

    区域
    支持的语言

      澳大利亚

      英语

      巴西

      葡萄牙语

      加拿大

      英语

    德国
    德语

      印度

      英语

    拉丁美洲

      西班牙语

    西班牙

      西班牙语

      英国

      英语

      美国

      英语

## 指南

您的活动必须遵循以下指南，才能显示在 Google 上的活动搜索服务中。

警告：**如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [技术指南](#technical-guidelines)
- [内容指南](#content-guidelines)
- [日期和时间指南](#date-time-best-guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 技术指南

- 目标网页必须包含 [schema.org 上活动类型](https://schema.org/Event)的结构化数据项。
- 每个活动都必须具有唯一的网址（叶级页）并对该网址添加标记。
- Google 上的活动搜索服务仅支持侧重于单个活动的网页。我们建议您重点为活动信息网页（而非列有日程表或多个活动的网页）添加标记。
- **正确标记举办多日的活动：**

          如果您的活动信息或门票信息针对的是举办时间为多天的活动，请指定该活动的开始日期和结束日期。
- 如果在不同的几天里有几场不同的表演，并且每场表演有单独的门票，请为每场表演添加一个单独的 Event 元素。

### 内容指南

- 每个活动都必须准确地描述活动名称、开始日期和举办地点。
- **避免将非活动内容标记为活动：**

          不要将非活动产品或服务（例如“旅行套餐：圣地亚哥/洛杉矶之旅，7 晚”）作为活动宣传。
- 不要添加短期折扣或购买机会，例如：“音乐会 - 立即订票”或“音乐会 - 周六前订票可享受五折优惠”。
- 不要将营业时间标记为活动，例如：“冒险乐园上午 8 点至下午 5 点开放”。
- 不要将优惠券或代金券标记为活动，例如：“首次订购可享受九五折优惠”。

  活动必须可供公众预订。需要先成为会员或受邀才能购买门票或参加活动的活动不符合活动体验的条件。

  如果观看者活动的主要参与者和观众为未成年人，且活动在学校内举办，则不符合活动体验的条件。例如，在校园内举办的学生活动。
  不支持宣传不含现实世界元素的虚拟体验。活动必须在实际地点举行。

### 
  日期和时间指南

  在实施 [startDate](#startdate)、[endDate](#enddate) 和 [previousStartDate](#previous-start-date) 属性时，请遵循以下日期和时间指南。

#### 如何指定时区

通过添加 UTC 或 GMT 时区设定来指定时区。如果活动于 9 月 5 日晚上 7 点在纽约开始，在采用标准时间期间 startDate 值为 GMT/UTC-5；在采用夏令时期间为 GMT/UTC-4。如果采用标准时间，startDate 值分别为 "2019-09-05T19:00:00-05:00" 或 "2019-09-05T19:00:00-04:00"。如果未提供时区，Google 会使用 location 中指定的活动地点的时区。

#### 最佳做法

- **活动持续一段日期**：如果活动持续多天，请同时指明开始日期和结束日期。如果您不知道时间，请不要指明时间。

**建议**

```
"startDate": "2019-07-01T10:00:00-05:00",
"endDate": "2019-07-26T17:00:00-05:00"
```

**建议**

```
"startDate": "2019-07-01",
"endDate": "2019-07-26"
```

**不建议**

```
"startDate": "2019-07-01T00:00:00+00:00",
"endDate": "2019-07-26T23:59:59+00:00"
```
- **活动从特定时间开始**：如果活动从特定时间开始，例如本地下午 5 点，请使用 2019-07-20T17:00:00。添加相应的 UTC 时差（例如，如果活动在加利福尼亚州发生，请使用 2019-07-20T17:00:00-07:00）。
- **活动持续一整天**：如果活动全天发生，请不要指定开始日期的具体时间。例如，您可以使用 2019-08-15 同时作为持续一整天活动的 startDate 和 endDate。
- **活动开始时间未知**：如果您不知道活动的开始时间，请不要指定具体时间。例如，您可以使用 2019-08-15 同时作为活动的 startDate 和 endDate。

**建议**："startDate": "2025-07-21"

**不建议**："startDate": "2019-08-15T00:00:00+00:00"

**不建议**："startDate": "2019-07-20T00:00:00"

#### Google 如何解读日期的示例

  下面是一些说明 Google 如何解读开始日期和时间的示例：

      开始日期和时间解读

      2019-08-15T00:00:00+00:00

              Google 将 startTime 解读为 2019-08-14T17:00:00-07:00（如果 location 设为加利福尼亚州）或 2019-08-15T09:00:00（如果 location 设为韩国）。

      2019-08-15T23:59:59+00:00
      除非活动发生在 GMT 时区，否则这并不意味着 2019-08-15 的结束。
              Google 将 startTime 解读为 2019-08-15T16:59:59-07:00（如果 location 设为加利福尼亚州）或 2019-08-16T08:59:59（如果 location 设为韩国）。

      2019-07-10
      这表示日期，不考虑时区。在 startDate 中使用时，表示活动从当天的某个时间在 location 开始。在 endDate 中使用时，表示活动在当天的某个时间在 location 结束。

      2019-07-20T00:00:00
      这表示活动发生的时区的 2019-07-20 午夜。除非活动原定于午夜开始，否则该时间也可能是错误的。

## 结构化数据类型定义

如需了解 Event 的完整定义，请访问 [schema.org/Event](https://schema.org/Event)。

若要让您的内容显示在增强的搜索结果中，必须添加必需的属性。还有一些建议添加的属性，能帮助您添加更多与您的内容相关的信息，进而提供更好的用户体验。

    必要属性

        location

[Place](https://schema.org/Place)

活动的地点。将 @type 设置为 Place。并添加 [location.address](#location-address) 和 [location.name](#location-name) 属性。

          location.address

[PostalAddress](https://schema.org/PostalAddress)

举办场所的详细街道地址。

**不建议**：北京

**建议**：中国北京朝阳区朝外大街 20 号

**美国示例**

```
"location": {
  "@type": "Place",
  "name": "Snickerpark Stadium",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "100 West Snickerpark Dr",
    "addressLocality": "Snickertown",
    "postalCode": "19019",
    "addressRegion": "PA",
    "addressCountry": "US"
  }
}
```

**日本示例**

              您可以通过其他方式写日本地址，Google 仍可理解该地址。下面是一个在不同字段中显示街道地址、市行政区和国家/地区的示例。

```
"location": {
  "@type": "Place",
  "name": "ダイバーシティ東京",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "江東区青海1-10",
    "addressLocality": "東京",
    "addressCountry": "日本"
  }
}
```

              下面是一个在不同字段中显示街道地址和地址国家/地区的示例。

```
"location": {
  "@type": "Place",
  "name": "ダイバーシティ東京",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "東京都江東区青海1-10",
    "addressCountry": "日本"
  }
}
```

下面是一个在一行中显示整个地址的示例。

```
"location": {
  "@type": "Place",
  "name": "ダイバーシティ東京",
  "address": {
    "@type": "PostalAddress",
    "name": "東京都江東区青海 1-1-10 ダイバーシティ東京プラザ"
   }
}
```

**地址最佳做法**：

- 如果活动是在多条街道举办，请定义一个起始地点，并在说明中提供详细的信息。
- 如果举办的活动没有明确定义的地点，请使用城市名称或最具代表性的地点。
- 如果同时在多个地点举办活动，请为每个地点创建不同的活动。

          name

[Text](https://schema.org/Text)

活动的全称。

          请勿输入活动地点的名称，而应使用 [location.name](#location-name) 指定活动举办地点的名称。

**不建议**：北京

**不建议**：**限时销售 - 王菲演唱会 - 500 元**

**建议**：王菲“幻乐一场”上海演唱会

**建议**：王菲见面会

**最佳做法**：

- 请勿将活动类型用作活动名称。例如，“音乐会”不是活动的描述性名称。
- 请勿添加网址、价格或表演者等无关信息，而应在相应的属性中添加这些值。
- 在标题中突出活动的独特方面。这有助于用户更快地做出决定（例如，“艺术家专题问答”）。
- 不要添加短期宣传（例如，“立即订票”）。

        startDate

[DateTime](https://schema.org/DateTime)

活动的开始日期和开始时间，采用 [ISO-8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。
            请同时添加日期和时间，以便用户找到适合其时间安排的活动。

            请务必遵循[日期和时间指南](#date-time-best-guidelines)。

```
"startDate": "2025-07-21T19:00"
```

      建议属性

          description

[Text](https://schema.org/Text)

活动的说明。对活动的所有详情加以说明，以便用户更容易了解和参加活动。

            **最佳做法**：

- 为具体活动添加简明扼要的说明。
- 重点说明活动详情，而不是网站的功能。
- 不要重复日期和地点等其他信息；请改为将这些信息添加到相应的属性中。

```
"description": "The Adventures of Kira and Morrison is coming to Snickertown in a can't miss performance."
```

          Google 仅显示完整说明的摘要。

          endDate

[DateTime](https://schema.org/DateTime)

活动的结束日期和结束时间，采用 [ISO-8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。格式与 [startDate](#startdate) 相同。请同时添加日期和时间，以便用户找到适合其时间安排的活动。

            请务必遵循[日期和时间指南](#date-time-best-guidelines)。

```
"endDate": "2025-07-21T23:00"
```

      eventStatus

      [EventStatusType](https://schema.org/EventStatusType)
        **警告**：如果活动状态发生变化，请**不要**移除 [startDate](#startdate)。startDate 属性是必要属性，可以帮助识别唯一的活动。

          活动的状态。如果您不使用此字段，Google 会将 eventStatus 理解为 EventScheduled。如果适用的话，您可以使用多种状态。下面列出了一些支持的值。

          [EventCancelled](https://schema.org/EventCancelled)

              活动已取消。

              请不要移除或更改其他属性（例如，不要移除 startDate 或 location）；而应将所有值保持为与取消前相同的值，并将 eventStatus 更新为 EventCancelled。**

                原因？**startDate 和 location 等属性可以帮助标识唯一活动，并确保用户了解活动的新状态。

```
{
  "@context": "https://schema.org",
  "@type": "Event",
  "eventStatus": "https://schema.org/EventCancelled",
  "startDate": "2020-07-21T19:00"
}
```

          [EventPostponed](https://schema.org/EventPostponed)

              活动已推迟到未来的某个日期，但具体日期未知。保留活动的 [startDate](#startdate) 中的原定日期，直到您知道活动的举办时间时再更改。获知新的日期信息后，请将 eventStatus 更改为 EventRescheduled，并根据新的日期信息更新 [startDate](#startdate) 和 [endDate](#enddate)。

              请不要移除或更改其他属性（例如，不要移除 startDate 或 location）；而应将所有值保持为与推迟前相同的值，并将 eventStatus 更新为 EventPostponed。**

                原因？**startDate 和 location 等属性可以帮助标识唯一活动，并确保用户了解活动的新状态。

```
{
  "@context": "https://schema.org",
  "@type": "Event",
  "eventStatus": "https://schema.org/EventPostponed",
  "startDate": "2020-07-21T19:00"
}
```

          [EventRescheduled](https://schema.org/EventRescheduled)

              活动已重新安排到未来的某个日期。使用相关的新日期更新 [startDate](#startdate) 和 [endDate](#enddate)。您也可以将 eventStatus 字段标记为已重新安排并添加 [previousStartDate](#previous-start-date)。

```
{
  "@context": "https://schema.org",
  "@type": "Event",
  "eventStatus": "https://schema.org/EventRescheduled",
  "startDate": "2020-07-21T19:00",
  "endDate": "2025-07-21T23:00",
  "previousStartDate": "2025-03-21T19:00"
}
```

          [EventScheduled](https://schema.org/EventScheduled)

              活动按计划举办。此值是活动的默认状态。如果您未设置 eventStatus，Google 会认为该活动将按计划举办。

```
{
  "@context": "https://schema.org",
  "@type": "Event",
  "eventStatus": "https://schema.org/EventScheduled",
  "startDate": "2020-07-21T19:00"
}
```

          image

重复的 [ImageObject](https://schema.org/ImageObject) 或 [URL](https://schema.org/URL)

活动或巡演的图片或徽标网址。添加图片有助于用户了解您的活动并与之互动。建议的图片宽度为 1920 像素（最小宽度为 720 像素）。

其他的图片指南：

- 每个网页必须包含至少 1 张图片（无论您是否添加了标记）。Google 将根据宽高比和分辨率挑选最合适的图片显示在搜索结果中。
- 图片网址必须可抓取且可编入索引。如需检查 Google 能否访问您的网址，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)。
- 图片必须代表标记的内容。
- 图片必须采用[受 Google 图片支持](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#supported-image-formats)的文件格式。
- 为取得最佳效果，建议您提供具有以下宽高比的多个高分辨率图片（宽度乘以高度至少为 50K 像素）：16x9、4x3 和 1x1。

例如：

```
"image": [
  "https://example.com/photos/1x1/photo.jpg",
  "https://example.com/photos/4x3/photo.jpg",
  "https://example.com/photos/16x9/photo.jpg"
]
```

          location.name

[Text](https://schema.org/Text)

活动举办地点或场地的详细名称。仅当活动是在实地举办时，此属性才是建议的属性。

          请勿在此字段中输入活动的标题，而应使用 [name](#event-name) 指定活动的名称。

**不建议**：北京

**建议**：人民艺术剧院

              **最佳做法**：

- 除非是全市范围的活动，否则请勿添加城市名称。
- location.name 属性必须是举办场地或地点的名称，不能与活动标题重复。如果您不知道举办地点的名称，请勿使用此属性。

          offers

[Offer](https://schema.org/Offer)

          嵌套的 [Offer](https://schema.org/Offer)，每种门票类型分别对应一个。

          offers.availability

[Text](https://schema.org/Text)

请选择以下某个值：

- [InStock](https://schema.org/InStock)：活动门票有售。
- [SoldOut](https://schema.org/SoldOut)：活动门票售罄。
- [PreOrder](https://schema.org/PreOrder)：活动门票开放预订。

```
"offers": {
  "@type": "Offer",
  "availability": "https://schema.org/InStock"
}
```

          **注意：**如果门票还没有向公众发售，您可以省略门票发售信息，并指定 validFrom。

          offers.price

[Number](https://schema.org/Number)

门票的最低价格，包括服务费和手续费。当价格发生变动或门票售罄时，请务必更新此值。

            如果活动免费、无需手续费或服务费，请将 price 设置为 0。

```
"offers": {
  "@type": "Offer",
  "price": 30
}
```

        offers.priceCurrency

[Text](https://schema.org/Text)

由 3 个字母表示的 ISO 4217 货币代码。

```
"offers": {
  "@type": "Offer",
  "priceCurrency": "USD"
}
```

          offers.validFrom

[DateTime](https://schema.org/DateTime)

开始售票的日期和时间（只需为限定日期的活动指定此属性），采用 [ISO-8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。

```
"offers": {
  "@type": "Offer",
  "validFrom": "2024-05-21T12:00"
}
```

          offers.url

[网址](https://schema.org/URL)

售票网页的网址。

```
"offers": {
  "@type": "Offer",
  "url": "https://www.example.com/event_offer/12345_201803180430"
}
```

此网址必须符合以下要求：

- 定向到一个着陆页，该页以清晰醒目的方式为公众提供购票的机会，让任何用户都有机会入场参加相应活动。
- 用户点击后定向到包含相应活动的网页的链接。
- 可供 Googlebot 抓取（未被 robots.txt 屏蔽）。

          organizer

[Organization](https://schema.org/Organization) 或 [Person](https://schema.org/Person)

举办活动的人员或组织。如果您添加了 organizer，我们建议您添加以下属性：

- [organizer.name](#organizer-name)
- [organizer.url](#organizer-url)

          organizer.name

[Text](https://schema.org/Text)

举办活动的人员或组织的名称。

          organizer.url

[URL](https://schema.org/URL)

活动主办单位的域名网址。

          performer

[Person](https://schema.org/Person)

参加活动的表演者，如音乐人和喜剧演员。请为每个表演者分别使用一个嵌套的 [PerformingGroup](https://schema.org/PerformingGroup) 或 [Person](https://schema.org/Person)。

          performer.name

[文本](https://schema.org/Text)

活动表演者的姓名，如音乐人和喜剧演员的姓名。

```
"performer": {
  "@type": "PerformingGroup",
  "name": "Kira and Morrison"
}
```

          previousStartDate

[DateTime](https://schema.org/DateTime)

如果活动已重新安排，是指之前安排的活动开始日期。如果您添加了 previousStartDate，您还必须添加 [eventStatus](#eventstatus) 属性，并将 eventStatus 设置为 EventRescheduled。不要使用其他活动状态。

            请务必遵循[日期和时间指南](#date-time-best-guidelines)。

            对于重新安排的活动，[startDate](#startdate) 属性只能用于新安排的开始日期。在非常罕见的情形下，活动会多次推迟并重新安排，此字段可以重复添加。

```
{
  "@context": "https://schema.org",
  "@type": "Event",
  "previousStartDate": ["2020-03-21T19:00-05:00", "2020-03-20T19:00-05:00", "2020-03-21T19:00-05:00"],
  "eventStatus": "https://schema.org/EventRescheduled",
  "startDate": "2020-07-21T19:00-05:00"
}
```

## 使用 Search Console 监控富媒体搜索结果

   Search Console 是一款工具，可帮助您监控网页在 Google 搜索结果中的显示效果。即使没有注册 Search Console，您的网页也可能会显示在 Google 搜索结果中，但注册 Search Console 能够帮助您了解 Google 如何查看您的网站并做出相应的改进。建议您在以下情况下查看 Search Console：

1. [首次部署结构化数据后](#after-deploying)
2. [发布新模板或更新代码后](#after-releasing)
3. [定期分析流量时](#analyzing-periodically)

### 
    首次部署结构化数据后

    等 Google 将网页编入索引后，请在相关的[富媒体搜索结果状态报告](https://support.google.com/webmasters/answer/7552505?hl=zh-cn)中查看是否存在问题。
    理想情况下，有效项目数量会增加，而无效项目数量不会增加。如果您发现结构化数据存在问题，请执行以下操作：

1. [修正无效项目](#troubleshooting)。
2. [检查实际网址](https://support.google.com/webmasters/answer/9012289?hl=zh-cn#test_live_page)，核实问题是否仍然存在。
3. 使用状态报告[请求验证](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#validation)。

### 
    发布新模板或更新代码后

     如果对网站进行重大更改，请监控结构化数据无效项目的增幅。

- 如果您发现**无效项目增多了**，可能是因为您推出的某个新模板无法正常工作，或者您的网站以一种新的错误方式与现有模板交互。
- 如果您发现**有效项目减少了**（但无效项目的增加情况并不对应），可能是因为您的网页中未再嵌入结构化数据。请通过[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)了解导致此问题的原因。

  **警告**：请勿使用[缓存链接](https://support.google.com/websearch/answer/1687222?hl=zh-cn)调试网页。建议改用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)，因为该工具会检查网页的最新版本。

### 
    定期分析流量时

    请使用[效果报告](https://support.google.com/webmasters/answer/7576553?hl=zh-cn)分析您的 Google 搜索流量。数据将显示您的网页在 Google 搜索结果中显示为富媒体搜索结果的频率、用户点击该网页的频率以及网页在搜索结果中的平均排名。您还可以使用 [Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/search_analytics?hl=zh-cn) 自动提取这些结果。

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

      如果您的活动无法显示在 Google 上的活动搜索服务中，或者您在 Search Console 中收到关于您的网站因存在[垃圾结构化标记](https://support.google.com/webmasters/answer/3498001?ref_topic=6003164&hl=zh-cn)而遭受人工处置措施的警告，请尝试解决最常见的问题并[查看我们的指南](#guidelines)。如果您仍然遇到问题，请查看[活动常见问题解答](https://support.google.com/webmasters/thread/10549347?hl=zh-cn)或在 [Google 搜索中心论坛](https://support.google.com/webmasters/community?hl=zh-cn)中发帖提问。

    **Google 不能保证您的结构化数据一定会显示在搜索结果中**，即使[富媒体搜索结果测试工具](https://search.google.com/test/rich-results?hl=zh-cn)显示您的网页已正确地添加标记。如需查看导致 Google 无法将您的结构化数据显示在搜索结果中的各种常见原因，请参阅[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。

### 活动地点缺失或不正确

      error* **导致问题的原因**：Google 无法理解您为 eventLocation、addressLocality 或 addressRegion 属性提供的值。Google 尝试将活动地点信息与实际地点进行匹配，但您没有提供活动地点或提供的活动地点不正确。

*done* **解决问题**

1. 确保结构化数据包含 eventLocation、addressLocality 或 addressRegion 的值（取决于活动地点，因为并非所有活动地点属性都适用）。
2. 检查 location.name 字段是否使用活动地点名称，或者留空（如果没有活动地点名称）。常见问题是意外地将活动名称放置在 location.name 字段中。
3. 验证修正措施：

          打开[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)。
4. 在**抓取网址**框中输入活动信息网址。
5. 点击**验证**。
6. 点击**预览**。

**成功**：富媒体搜索结果测试在 Google 搜索预览工具中显示正确的 eventLocation。

            **重试**：富媒体搜索结果测试在 Google 搜索预览工具中针对活动地点显示“false”。确保活动地点为真实地点。

### 我的网站未显示为购票的选项

*error* **导致问题的原因**：[offers.url](#offers-url) 属性缺失或不符合[网址要求](#url-requirements)。

*done* **解决问题**

1. 确保您的结构化数据包含 [offers.url](#offers-url) 属性。
2. 确保您的网址符合 offers.url 的 [网址要求](#url-requirements)。
3. 请求 Google [重新抓取您的网站](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
4. 提交[（重新）评估请求](https://docs.google.com/forms/d/e/1FAIpQLSeoRYNFmYPdoj81jJAl9wS_0RsU-y8b9rVjHgZ1hZzCFXJ8hw/viewform?hl=zh-cn)。

### 时间或日期不正确

*error* **导致问题的原因**：时间或日期不正确。常见错误包括未针对时区提供时差或指定错误的开始时间（例如，将午夜作为开始时间）。

*done* **解决问题**

1. **指定正确的本地时区设定**。例如，如果您的活动是在纽约时间晚上 7 点 (UTC - 5) 开始，晚上 9 点结束，那么 startDate 的值为 2019-08-15T19:00:00-05:00，endDate 的值为 2019-08-15T21:00:00-05:00。如果您无法填写活动的时差，请不要设定时差（例如，使用 2019-08-15T19:00:00）。
2. **确保开始时间或结束时间准确**。一个常见错误是将活动设置为从午夜开始，而实际上活动并非从午夜开始。如果活动持续一整天，或者开始时间尚未公布，则只需指定日期。例如：

**建议**：2019-07-20

**不建议**：2019-07-20T00:00:00

**不建议**：2019-08-15T00:00:01+00:00

**不建议**：2019-08-15T00:00:00+00:00

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。