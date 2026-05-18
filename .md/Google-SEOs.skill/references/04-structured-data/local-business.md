# 本地商家 (LocalBusiness) 结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn

---

  # 本地商家 (LocalBusiness) 结构化数据

当用户在 Google 搜索或 Google 地图上搜索商家时，搜索结果中可能会显示一个醒目的 Google 知识面板，其中包含符合查询条件的商家的详情。当用户搜索某种类型的商家（例如，“北京最棒的餐馆”）时，他们可能会看到与查询相关的商家信息轮播界面。通过本地商家结构化数据，您可以让 Google 知道营业时间、商家内的不同部门以及评价（如果您的网站收集有关其他商家的评价）等。如果您想帮助用户直接在搜索结果中进行预订或下订单，您可以使用 [Maps Booking API](https://developers.google.com/maps-booking/guides/starter-integration/overview?hl=zh-cn) 启用预订、付款和其他操作。

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
      简单的本地商家信息

下面是一个 JSON-LD 格式的本地商家信息示例。

      注意**：在 Google 搜索结果中的实际显示效果可能会有不同。您可以使用[富媒体搜索结果测试](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)来预览大多数功能。

    <html>
  <head>
    <title>Dave's Steak House</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "name": "Dave's Steak House",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "148 W 51st St",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "postalCode": "10019",
        "addressCountry": "US"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Lillian Ruiz"
        }
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.761293,
        "longitude": -73.982294
      },
      "url": "https://www.example.com/restaurant-locations/manhattan",
      "telephone": "+12122459600",
      "servesCuisine": "American",
      "priceRange": "$$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday"
          ],
          "opens": "11:30",
          "closes": "22:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Wednesday",
            "Thursday",
            "Friday"
          ],
          "opens": "11:30",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "16:00",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "16:00",
          "closes": "22:00"
        }
      ],
      "menu": "https://www.example.com/menu"
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
    <title>Dave's Steak House</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "name": "Dave's Steak House",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "148 W 51st St",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "postalCode": "10019",
        "addressCountry": "US"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Lillian Ruiz"
        }
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 40.761293,
        "longitude": -73.982294
      },
      "url": "https://www.example.com/restaurant-locations/manhattan",
      "telephone": "+12122459600",
      "servesCuisine": "American",
      "priceRange": "$$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday"
          ],
          "opens": "11:30",
          "closes": "22:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Wednesday",
            "Thursday",
            "Friday"
          ],
          "opens": "11:30",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Saturday",
          "opens": "16:00",
          "closes": "23:00"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "16:00",
          "closes": "22:00"
        }
      ],
      "menu": "https://www.example.com/menu"
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 
      餐馆轮播界面（仅面向部分提供商）

      下面是一个符合[详情页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#details-page)要求的餐馆示例（假设还有一个包含轮播界面标记的[摘要页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#summary-page)）。餐馆轮播界面仅面向一小部分餐馆提供商。如果您想参与进来，请提交[注册表单](https://docs.google.com/a/google.com/forms/d/e/1FAIpQLSdZCJXAe2TtpiBe8Lx2dWR6LatLcCbFq7SZsyWqH6xJ7ulbaQ/viewform?hl=zh-cn)。

    <html>
  <head>
    <title>Trattoria Luigi</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Restaurant",
      "name": "Trattoria Luigi",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
       "priceRange": "$$$",
       "servesCuisine": "Italian",
       "telephone": "+12125557234",
       "address": {
         "@type": "PostalAddress",
         "streetAddress": "148 W 51st St",
         "addressLocality": "New York",
         "addressRegion": "NY",
         "postalCode": "10019",
         "addressCountry": "US"
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
    <title>Trattoria Luigi</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Restaurant",
      "name": "Trattoria Luigi",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
       "priceRange": "$$$",
       "servesCuisine": "Italian",
       "telephone": "+12125557234",
       "address": {
         "@type": "PostalAddress",
         "streetAddress": "148 W 51st St",
         "addressLocality": "New York",
         "addressRegion": "NY",
         "postalCode": "10019",
         "addressCountry": "US"
       }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 营业时间

以下示例演示了如何标记不同类型的营业时间。

  我们既接受使用官方 schema.org 表示法指明 [dayOfWeek](https://schema.org/OpeningHoursSpecification)（表示星期一、星期二等的规范网址），也接受 schema.org 社区中正在讨论的一种较短的形式。我们预计将更新此文档以反映这些讨论的最终结果，并将继续接受这两种形式，以实现向后兼容性。

        标准营业时间

排除 validFrom 和 validThrough 属性表示营业时间全年有效。以下示例将某个商家的营业时间定义为工作日上午 9 点到晚上 9 点，周末上午 10 点到晚上 11 点。

```
"openingHoursSpecification": [
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday"
    ],
    "opens": "09:00",
    "closes": "21:00"
  },
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Saturday",
      "Sunday"
    ],
    "opens": "10:00",
    "closes": "23:00"
  }
]
```

        深夜营业时间

对于午夜后的时间，您可以使用单个 OpeningHoursSpecification 属性来定义营业时间和非营业时间。以下示例将营业时间定义为星期六下午 6 点到星期日凌晨 3 点。

```
"openingHoursSpecification": {
  "@type": "OpeningHoursSpecification",
  "dayOfWeek": "Saturday",
  "opens": "18:00",
  "closes": "03:00"
}
```

        全天营业时间

要将某个商家显示为每天 24 小时营业，请将 open 属性设为“00:00”，并将 closes 属性设为“23:59”。要将某个商家显示为全天歇业，请将 opens 和 closes 属性都设为“00:00”。以下示例显示了某个商家星期六全天营业，星期日全天歇业。

```
"openingHoursSpecification": [
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": "Saturday",
    "opens": "00:00",
    "closes": "23:59"
  },
  {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": "Sunday",
    "opens": "00:00",
    "closes": "00:00"
  }
]
```

        季节性营业时间

您可以使用 validFrom 和 validThrough 属性定义季节性营业时间。以下示例显示了某个商家寒假期间歇业。

```
"openingHoursSpecification": {
  "@type": "OpeningHoursSpecification",
  "opens": "00:00",
  "closes": "00:00",
  "validFrom": "2015-12-23",
  "validThrough": "2016-01-05"
}
```

### 多个部门

如果商家设有多个部门，并且每个部门都有自己的独特属性（如营业时间或电话号码），您可以针对每个部门使用一个元素来标记 department 属性。在每个相应的部门元素中分别定义与总店不同的属性。

  <html>
  <head>
    <title>Dave's Department Store</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "name": "Dave's Department Store",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Saratoga Ave",
        "addressLocality": "San Jose",
        "addressRegion": "CA",
        "postalCode": "95129",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.293058,
        "longitude": -121.988331
      },
      "url": "https://www.example.com/store-locator/sl/San-Jose-Westgate-Store/1427",
      "priceRange": "$$$",
      "telephone": "+14088717984",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "08:00",
          "closes": "23:59"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "08:00",
          "closes": "23:00"
        }
      ],
      "department": [
        {
          "@type": "Pharmacy",
          "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
          "name": "Dave's Pharmacy",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1600 Saratoga Ave",
            "addressLocality": "San Jose",
            "addressRegion": "CA",
            "postalCode": "95129",
            "addressCountry": "US"
          },
          "priceRange": "$",
          "telephone": "+14088719385",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ],
              "opens": "09:00",
              "closes": "19:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "17:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Sunday",
              "opens": "11:00",
              "closes": "17:00"
            }
          ]
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Dave's Department Store</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "name": "Dave's Department Store",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Saratoga Ave",
        "addressLocality": "San Jose",
        "addressRegion": "CA",
        "postalCode": "95129",
        "addressCountry": "US"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 37.293058,
        "longitude": -121.988331
      },
      "url": "https://www.example.com/store-locator/sl/San-Jose-Westgate-Store/1427",
      "priceRange": "$$$",
      "telephone": "+14088717984",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
          ],
          "opens": "08:00",
          "closes": "23:59"
        },
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": "Sunday",
          "opens": "08:00",
          "closes": "23:00"
        }
      ],
      "department": [
        {
          "@type": "Pharmacy",
          "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
          "name": "Dave's Pharmacy",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "1600 Saratoga Ave",
            "addressLocality": "San Jose",
            "addressRegion": "CA",
            "postalCode": "95129",
            "addressCountry": "US"
          },
          "priceRange": "$",
          "telephone": "+14088719385",
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ],
              "opens": "09:00",
              "closes": "19:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Saturday",
              "opens": "09:00",
              "closes": "17:00"
            },
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": "Sunday",
              "opens": "11:00",
              "closes": "17:00"
            }
          ]
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 指南

商家必须遵循以下指南，才能出现在本地商家富媒体搜索结果中。

    警告**：如果您的网站违反了以下一项或多项准则，Google 可能会对您的网站执行[手动操作](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [轮播界面指南](https://developers.google.com/search/docs/guides/mark-up-listings?hl=zh-cn)（如果适用）。餐馆轮播界面目前仅面向一小部分餐馆提供商。如果您想参与进来，请提交[注册表单](https://docs.google.com/a/google.com/forms/d/e/1FAIpQLSdZCJXAe2TtpiBe8Lx2dWR6LatLcCbFq7SZsyWqH6xJ7ulbaQ/viewform?hl=zh-cn)。

## 结构化数据类型定义

下表根据 [schema.org/LocalBusiness](https://schema.org/LocalBusiness) 中的完整定义列出了本地商家和商家操作类型的属性和用法。

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需的属性。还有一些建议添加的属性，能帮助您添加更多与您的内容相关的信息，进而提供更好的用户体验。

您可以向网站上的任何网页添加 LocalBusiness 结构化数据，但将该数据放在包含您商家信息的网页上可能更合理。

### LocalBusiness

如需了解 LocalBusiness 的完整定义，请访问 [schema.org/LocalBusiness](https://schema.org/LocalBusiness)。请将每个本地商家营业地点指定为 [LocalBusiness](https://schema.org/LocalBusiness) 类型。请尽可能使用[最具体的 LocalBusiness 子类型](https://schema.org/LocalBusiness#subtypes)；例如 [Restaurant](https://schema.org/Restaurant)、[DaySpa](https://schema.org/DaySpa)、[HealthClub](https://schema.org/HealthClub) 等等。

      由于 [LocalBusiness](https://schema.org/LocalBusiness) 是 [Organization](https://schema.org/Organization) 的子类型，因此除了下方的必需和建议字段，建议您参考[组织](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn)字段。

    如果您有多个类型，请将它们指定为数组（不支持 additionalType）。例如，假设您的商家提供多项服务：

```
{
  "@context": "https://schema.org",
  "@type": ["Electrician", "Plumber", "Locksmith"],
  ....
}
```

Google 支持的属性如下：

      必要属性

      address

[PostalAddress](https://schema.org/PostalAddress)

商家的实际位置。请添加尽可能多的属性。提供的属性越多，搜索结果对用户来说就质量越高。例如：

```
"address": {
  "@type": "PostalAddress",
  "streetAddress": "148 W 51st St Suit 42 Unit 7",
  "addressLocality": "New York",
  "addressRegion": "NY",
  "postalCode": "10019",
  "addressCountry": "US"
}
```

      name

[Text](https://schema.org/Text)

商家的名称。

      建议属性

      aggregateRating

[AggregateRating](https://schema.org/AggregateRating)

**只有在网站收集有关其他本地商家的评价时才建议使用此属性**：根据多个评分或评价得出的本地商家的平均评分。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看[总体评分属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregated-rating-type-definition)的必要属性和建议属性列表。

      department

[LocalBusiness](https://schema.org/LocalBusiness)

单个部门的嵌套项。您可以为部门定义此表中的任何属性。

            其他指南：

- 按以下格式添加商店名称和部门名称：{store name} {department name}。例如，gMart 和 gMart Pharmacy。
- 如果部门有明确的品牌名称，请单独指定部门名称。例如：Best Buy 和 Geek Squad。

      geo

[GeoCoordinates](https://schema.org/GeoCoordinates)

商家的地理坐标。

      geo.latitude

[Number](https://schema.org/Number)

营业地点的纬度。精度必须至少为 5 位小数。

      geo.longitude

[Number](https://schema.org/Number)

营业地点的经度。精度必须至少为 5 位小数。

      menu

[URL](https://schema.org/URL) 

对于食品企业，此属性为菜单的完全限定网址。

      openingHoursSpecification

[OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification) 的数组或单个对象（均受支持）

营业地点的营业时间。

      openingHoursSpecification.closes

[Time](https://schema.org/Time)

营业地点的打烊时间，采用 hh:mm:ss 格式。

      openingHoursSpecification.dayOfWeek

[DayOfWeek](https://schema.org/DayOfWeek)

以下值中的一个或多个：

- https://schema.org/Monday：星期一。
- https://schema.org/Tuesday：星期二。
- https://schema.org/Wednesday：星期三。
- https://schema.org/Thursday：星期四。
- https://schema.org/Friday：星期五。
- https://schema.org/Saturday：星期六。
- https://schema.org/Sunday：星期日。

      我们还支持不带网址前缀的简称（例如 Monday）。

      openingHoursSpecification.opens

[Time](https://schema.org/Time)

营业地点开门营业的时间，采用 hh:mm:ss 格式。

      openingHoursSpecification.validFrom

[Date](https://schema.org/Date)

季节性歇业的开始日期，采用 YYYY-MM-DD 格式。

      openingHoursSpecification.validThrough

[Date](https://schema.org/Date) 

季节性歇业的结束日期，采用 YYYY-MM-DD 格式。

      priceRange

[Text](https://schema.org/Text) 

商家的相对价格范围，通常由数值范围（例如“10-15 美元”）或货币符号的标准化值（例如“$$$”）表示。

此字段的字符数必须小于 100 个。如果字符数超过 100 个，Google 就不会显示商家的价格范围。

      review

[Review](https://schema.org/Review)

**只有在网站收集有关其他本地商家的评价时才建议使用此属性**：对本地商家的评价。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看[评价属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#review-properties)的必要属性和建议属性列表。

      servesCuisine

[servesCuisine](https://schema.org/servesCuisine)

餐馆供应的菜肴种类。

      telephone

[Text](https://schema.org/Text)

商家电话号码应该是客户的主要联系方式。请务必在电话号码中包含国家/地区代码和区号。

      url

[URL](https://schema.org/URL)

特定营业地点的完全限定网址。该网址必须是有效的链接。

### 
  餐馆轮播界面（仅面向部分提供商）

    餐馆轮播界面目前仅面向一小部分餐馆提供商。如果您想参与进来，请提交[注册表单](https://docs.google.com/a/google.com/forms/d/e/1FAIpQLSdZCJXAe2TtpiBe8Lx2dWR6LatLcCbFq7SZsyWqH6xJ7ulbaQ/viewform?hl=zh-cn)。

      如果您的网站上列出了多家餐馆，而您希望它们能够出现在托管轮播界面上，请添加“轮播界面”对象。除了[标准的轮播界面属性](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn)之外，您还可以在“轮播界面”对象中定义以下属性。虽然轮播界面属性不是必需的，但如果您希望餐馆列表能够显示在托管轮播界面中，则必须添加以下属性。

Google 支持的属性如下：

      必要属性

      image

重复的 [URL](https://schema.org/URL) 或 [ImageObject](https://schema.org/ImageObject)

一张或多张餐馆图片。

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

      name

[Text](https://schema.org/Text)

餐馆的名称。

      建议属性

      address

[PostalAddress](https://schema.org/PostalAddress)

商家的实际位置。请添加尽可能多的属性。提供的属性越多，搜索结果对用户来说就质量越高。例如：

```
"address": {
  "@type": "PostalAddress",
  "streetAddress": "148 W 51st St",
  "addressLocality": "New York",
  "addressRegion": "NY",
  "postalCode": "10019",
  "addressCountry": "US"
}
```

      servesCuisine

[servesCuisine](https://schema.org/servesCuisine)

餐馆供应的菜肴种类。

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