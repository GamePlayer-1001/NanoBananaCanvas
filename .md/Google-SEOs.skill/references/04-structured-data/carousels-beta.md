# 轮播界面（Beta 版）结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/carousels-beta?hl=zh-cn

---

  # 结构化数据轮播界面（Beta 版）

  Google 会根据[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)了解网页上的内容，并使这些内容以更丰富的搜索结果形式呈现，称为“富媒体搜索结果”**。本指南重点介绍一种[目前处于 Beta 版阶段的全新轮播界面富媒体搜索结果](https://developers.google.com/search/blog/2024/02/search-experiences-in-eea?hl=zh-cn)，这是一种类似于列表的富媒体搜索结果，用户可以水平滚动查看来自指定网站的更多实体（也称为“托管轮播界面”）。轮播界面中的每个图块都可能包含您网站上关于网页实体的价格、评分和图片的信息。

  若要获得使用此 Beta 版富媒体搜索结果的资格，请添加 ItemList 结构化数据，并与以下至少一个受支持的结构化数据项搭配使用：

- [LocalBusiness](#localbusiness) 及其子类型，例如：

      [Restaurant](https://schema.org/Restaurant)
- [Hotel](https://schema.org/Hotel)
- [VacationRental](https://schema.org/VacationRental)

  [Product](#product)
  [Event](#event)

      将 ItemList 标记与支持的内容类型搭配使用时，轮播界面在 Google 搜索中会显示如下：

## 功能可用性

  此功能目前处于 Beta 版阶段，随着我们开发此功能，您可能会看到相应要求或指南发生变更。此功能同样仅面向[欧洲经济区](https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Glossary:European_Economic_Area_(EEA)#:~:text=See%20EEA%20disambiguation%20page%20for,and%20Norway%3B%20excluding%20Switzerland).) (EEA) 国家/地区、土耳其和南非提供，支持桌面设备和移动设备。在 EEA 国家/地区，此体验适用于与酒店、民宿、地面交通、航班、本地商家、推荐活动（活动、游览和活动）和购物相关的查询。在土耳其，此体验仅适用于与酒店、民宿和本地商家相关的查询。在南非，此体验适用于与酒店、民宿、推荐活动（活动、游览和活动）、航班、购物、外卖、租车和巴士预订相关的查询。

  如果您的商家位于 EEA 或土耳其，或为 EEA 或土耳其的用户提供服务，请填写相应的表单：

- 对于与地面交通、酒店、民宿、本地商家和推荐活动（例如活动、游览和活动）相关的查询，请使用此[Google 搜索汇总功能意向调查表](https://support.google.com/websearch/contact/search_dma?hl=zh-cn)
- 对于航班功能，请使用此[航班查询意向调查表](https://support.google.com/travel/contact/flight_queries_interest?hl=zh-cn)
- 对于[提供 CSS 计划的国家/地区](https://support.google.com/css-center/answer/7524491?hl=zh-cn#Supported_countries)的购物查询，请开始使用[购物比较服务 (CSS) 计划](https://support.google.com/css-center/answer/7524491?hl=zh-cn)

  如果您的商家位于南非，请填写 [Google 搜索南非标记和优化条状标签意向调查表](https://docs.google.com/forms/d/e/1FAIpQLSeio2rTpaGNFohJQNKRDLQENyfK5avJFGJSx1nguoRwqsocIQ/viewform?hl=zh-cn)。

## 添加结构化数据

  结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

  下面概述了如何向网站中添加结构化数据。

1. 选择一个摘要页面，其中包含有关列表中每个实体的一些信息。
    例如，一个列出“巴黎热门酒店”的类别网页，并提供指向您网站上具体详情页面的链接，以便用户详细了解每家酒店。您可以根据场景的需要，混合搭配不同类型的实体（例如酒店、餐馆）。例如，如果您有一篇“瑞士的推荐活动”文章，其中同时列出了本地活动和本地商家。
2. 向该摘要页面添加[必需的属性](#structured-data-type-definitions)。您无需向详情页面添加标记，即可使用此 Beta 版功能。
    根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
      **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
3. 根据轮播界面所涉及的具体内容类型，添加必需属性和建议属性：

- [LocalBusiness](#localbusiness) 及其子类型，例如：

          [Restaurant](https://schema.org/Restaurant)
- [Hotel](https://schema.org/Hotel)
- [VacationRental](https://schema.org/VacationRental)
4. [Product](#product)
5. [Event](#event)
6. 遵循[指南](#guidelines)。
7. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码。
8. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
  **注意**：重新抓取和重新编入索引需要一段时间，请耐心等待。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
9. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 指南

  为使您的网页能够显示为轮播界面富媒体搜索结果（Beta 版），您必须遵循[搜索要素指南](https://developers.google.com/search/docs/essentials?hl=zh-cn)和[结构化数据常规指南](https://developers.google.com/search/docs/guides/sd-policies?hl=zh-cn)。此外，轮播界面富媒体搜索结果（Beta 版）还需要遵循以下指南：

- 允许使用通用类型。不过，如需使用建议的属性，您必须使用相应的类型。例如，如需使用 amenityFeature，请使用 LodgingBusiness 类型。
- 允许使用额外字段，但这些字段可能不会出现在富媒体搜索结果中。
- 您的网站必须有一个摘要页面和多个详情页面。目前，此功能并不支持其他场景，例如“详情”为同一页面中锚点的一体化页面。
- 该标记必须位于摘要或类别页面上，该页面是类似于列表的页面，其中包含至少三个实体的相关信息，然后链接到您网站上的其他网页，以提供有关这些实体的更多信息。虽然您无需向详情页面添加标记，但必须在摘要页面的标记中添加详情页面网址。
- 标记摘要或类别页面上的所有项目。对于分页类别，请向每个后续页面添加 ItemList，并添加该页面上列出的实体。对于无限滚动，请重点标记在视口中初始加载的实体。

## 示例

以下是轮播界面的概要结构。轮播式富媒体搜索结果中的图块将按照标记中指定的顺序排序。

  <html>
    <head>
      <title>Top 5 Restaurants in Italy</title>
      <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Restaurant",
                  "name": "Trattoria Luigi",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$",
                  "servesCuisine": "Italian",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.5,
                    "reviewCount": 250
                  },
                "url": "https://www.example.com/trattoria-luigi"
              }
            },
            {
              "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "Restaurant",
                  "name": "La Pergola",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$",
                  "servesCuisine": "Italian",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.9,
                    "reviewCount": 1150
                  },
                "url": "https://www.example.com/la-pergola"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Restaurant",
                "name": "Pasta e Basta",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
              "url": "https://www.example.com/pasta-e-basta"
              }
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
      <title>Top 5 Restaurants in Italy</title>
      <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Restaurant",
                  "name": "Trattoria Luigi",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$",
                  "servesCuisine": "Italian",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.5,
                    "reviewCount": 250
                  },
                "url": "https://www.example.com/trattoria-luigi"
              }
            },
            {
              "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "Restaurant",
                  "name": "La Pergola",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$",
                  "servesCuisine": "Italian",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.9,
                    "reviewCount": 1150
                  },
                "url": "https://www.example.com/la-pergola"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Restaurant",
                "name": "Pasta e Basta",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
              "url": "https://www.example.com/pasta-e-basta"
              }
            }
          ]
        }
      </script>
    </head>
    <body>
    </body>
  </html>

```

## 不同结构化数据类型的定义

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需属性。您还可添加建议属性，以便添加与内容相关的更多信息，进而提供更优质的用户体验。

### ItemList

  ItemList 是用于存放列表中所有元素的容器项。列表中元素的所有网址都必须指向同一网域中的不同网页。

如需了解 ItemList 的完整定义，请访问 [schema.org/ItemList](https://schema.org/ItemList)。

    必要属性

      itemListElement

[ListItem](https://schema.org/ListItem)

          包含各个项的列表。如需指定列表，请定义一个包含至少三个 itemListElement.item 元素的 ItemList。

      itemListElement.item

LocalBusiness、Product 或 Event 的子类型

          列表中的单个项。请使用以下元素填充此对象：

- 所有轮播界面都必须具有的[常规属性](#common)（image、url、name）
- 此数据类型所需的所有其他属性，如您的内容类型文档所述：

              [LocalBusiness 及其子类型](#localbusiness)
- [Product](#product)
- [Event](#event)

          示例**：对于酒店，请提供 priceRange 和 amenityFeature 属性。

      itemListElement.position

          [Integer](https://schema.org/Integer)

          该项在轮播界面中的位置。应为一个数字，从 1 开始。

### 通用列表项属性（LocalBusiness、Product, 或 Event）

  所有轮播项类型都具有以下通用属性。

    必要属性

      image

重复的 [URL](https://schema.org/URL) 或 [ImageObject](https://schema.org/ImageObject)

          相关实体或项目的一张或多张图片（例如酒店的图片）。请勿在此图片属性中添加徽标。

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

          实体或项目的字符串名称。例如，酒店或民宿商家信息的名称。item.name 在轮播界面中显示为单个项的标题。HTML 格式会被忽略。

      url

          [URL](https://schema.org/URL)

          项目详情页面的规范网址（例如，摘要页面中引用的单个酒店或民宿商家信息的独立页面）。列表中的所有网址都必须是独一无二的，但属于同一网域（与摘要网页相同的网域或子网域/超级网域）。

        不支持摘要页面或类别页面内的锚链接；您的网站必须为列表中的每一项提供独立的详情页面。

    建议属性

        aggregateRating.bestRating

          [Number](https://schema.org/Number)

          相应评分体系中允许的最高值（例如 5 / 10）。如果省略 bestRating，系统会假定为 5。

        aggregateRating.ratingCount

          [Number](https://schema.org/Number)

          相应项在您的网站上获得的评分总数。

        aggregateRating.ratingValue

[Number](https://schema.org/Number) 或 [Text](https://schema.org/Text)

相应项的质量评分（以数字表示），可以是数字、分数或百分比（例如 4、60% 或 6 / 10）。Google 能够理解分数和百分比的分制，因为分数本身或百分比就暗含了分制。数字的默认分制为 5 分制，1 为最低值，5 为最高值。如需采用其他分制，请使用 bestRating 和 worstRating。

对于十进制数，请使用句点（而非英文逗号）来指定值（例如，使用 4.4 而不是 4,4）。在微数据和 RDFa 中，您可以使用 content 属性替换可见内容。这样，您就可以向用户显示任何样式惯例，同时满足结构化数据的句点要求。 例如：

```
<span itemprop="ratingValue" content="4.4">4,4</span> stars
```

### 其他特定于类型的属性定义

#### LocalBusiness（和子类型）

  对于轮播界面富媒体搜索结果，除了 [ListItem 属性](#listitem)之外，Google 还支持以下 LocalBusiness 属性（包括其子类型）。请将这些属性嵌套在 itemListElement.item 下。

    建议属性

      amenityFeature

          [LocationFeatureSpecification](https://schema.org/LocationFeatureSpecification)

**仅适用于 LodgingBusiness**：住宿的设施特征（例如特色或服务）。

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "beachAccess",
  "value": true
}
```

      priceRange

          [Text](https://schema.org/Text)

          商家的相对价格范围，通常由货币符号的标准化值指定。请使用以下任一格式提供价格范围：

- **价位：**例如“$”，“$$", "$$$”
- **范围：**例如“$-$$”

            此字段的长度必须少于 12 个字符。如果字符数超过 12 个，Google 就不会显示商家的价格范围。

      servesCuisine

          [Text](https://schema.org/Text)

**仅适用于餐馆**：餐馆供应的菜肴种类。

#### Product

  对于轮播界面富媒体搜索结果，除了 [ListItem 属性](#listitem)之外，Google 还支持以下 Product 属性。请将这些属性嵌套在 itemListElement.item 下。

    建议属性

      offers

[Offer](https://schema.org/Offer) 或 [AggregateOffer](https://schema.org/AggregateOffer)

用于销售商品的嵌套 Offer 或 AggregateOffer。请根据您的内容，为 Offer 或 AggregateOffer 添加建议属性。

如果您使用的是 Offer，请添加以下属性：

- offers.price
- offers.priceCurrency

如果您使用的是 AggregateOffer，请添加以下属性：

- offers.highPrice
- offers.lowPrice
- offers.priceCurrency

      offers.highPrice

          [Number](https://schema.org/Number)

          所有有效出价中的最高价格。如果您使用 price 指定单个价格，则无需添加 highPrice 和 lowPrice 属性。

      offers.lowPrice

          [Number](https://schema.org/Number)

          所有有效出价中的最低价格。如果您使用 price 指定单个价格，则无需添加 highPrice 和 lowPrice 属性。

      offers.price

          [Number](https://schema.org/Number)

          商品或价格组成部分（当附加到 PriceSpecification 及其子类型时）的优惠价格。如果您使用 lowPrice 和 highPrice 指定价格范围，请勿添加 price 属性。

      offers.priceCurrency

          [Text](https://schema.org/Text)

          用于描述商品价格的货币，采用由三个字母表示的 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。 如果未提供货币，Google 会默认选择 USD。

#### Event

  对于轮播界面富媒体搜索结果，除了 [ListItem 属性](#listitem)之外，Google 还支持以下 Event 属性。请将这些属性嵌套在 itemListElement.item 下。

    建议属性

      offers

Offer 或 AggregateOffer

用于销售活动门票的嵌套 Offer 或 AggregateOffer。请根据您的内容，为 Offer 或 AggregateOffer 添加建议属性。

如果您使用的是 Offer，请添加以下属性：

- offers.price
- offers.priceCurrency

如果您使用的是 AggregateOffer，请添加以下属性：

- offers.highPrice
- offers.lowPrice
- offers.priceCurrency

      offers.highPrice

          [Number](https://schema.org/Number)

          所有有效出价中的最高价格。如果您使用 price 指定单个价格，则无需添加 highPrice 和 lowPrice 属性。

      offers.lowPrice

          [Number](https://schema.org/Number)

          所有有效出价中的最低价格。如果您使用 price 指定单个价格，则无需添加 highPrice 和 lowPrice 属性。

      offers.price

          [Number](https://schema.org/Number)

          门票的价格，包括服务费和手续费。当价格发生变动或门票售罄时，请务必更新此值。如果您使用 lowPrice 和 highPrice 指定价格范围，请勿添加 price 属性。

如果活动免费、无需手续费或服务费，请将 price 设置为 0。

```
"offers": {
  "@type": "Offer",
  "price": 0
}
```

      offers.priceCurrency

          [Text](https://schema.org/Text)

          用于描述活动门票的货币，采用由三个字母表示的 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。
                如果未提供货币，Google 会默认选择 USD。

## 常见场景示例

### Restaurant 示例

下面是一个 JSON-LD 格式的餐厅轮播界面示例。

<html>
    <head>
      <title>Top 5 Restaurants in Paris</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Restaurant",
                "name": "Trattoria Luigi",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.5,
                  "reviewCount": 250
                },
                "url": "https://www.example.com/restaurant-location-1"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Restaurant",
                "name": "La Pergola",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1150
                },
                "url": "https://www.example.com/restaurant-location-2"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Restaurant",
                "name": "Pasta e Basta",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
                "url": "https://www.example.com/restaurant-location-3"
              }
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
      <title>Top 5 Restaurants in Paris</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Restaurant",
                "name": "Trattoria Luigi",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.5,
                  "reviewCount": 250
                },
                "url": "https://www.example.com/restaurant-location-1"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Restaurant",
                "name": "La Pergola",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1150
                },
                "url": "https://www.example.com/restaurant-location-2"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Restaurant",
                "name": "Pasta e Basta",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$$$",
                "servesCuisine": "Italian",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
                "url": "https://www.example.com/restaurant-location-3"
              }
            }
          ]
        }
      </script>
    </head>
    <body>
    </body>
  </html>
```

### 住宿（Hotels 和 VacationRental）示例

下面是一个 JSON-LD 格式的住宿轮播界面示例。

<html>
    <head>
      <title>Top 5 Hotels in Paris</title>
      <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Hotel",
                  "name": "Four Seasons Hotel George V, Paris",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$$",
                  "amenityFeature": {
                      "@type": "LocationFeatureSpecification",
                      "name" : "internetType",
                      "value": "Free"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.9,
                    "reviewCount": 50
                  },
                  "url": "https://www.example.com/four-seasons"
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "VacationRental",
                  "name": "Downtown Condo",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$",
                  "amenityFeature": {
                    "@type": "LocationFeatureSpecification",
                    "name" : "instantBookable",
                    "value": true
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.7,
                    "reviewCount": 827
                  },
                  "url": "https://www.example.com/downtown-condo"
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "Hotel",
                  "name": "Ritz Paris",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$$",
                  "amenityFeature": {
                    "@type": "LocationFeatureSpecification",
                    "name" : "freeBreakfast",
                    "value": true
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1290
                },
                "url": "https://www.example.com/ritz-paris"
              }
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
      <title>Top 5 Hotels in Paris</title>
      <script type="application/ld+json">
        {
        "@context": "https://schema.org",
        "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "Hotel",
                  "name": "Four Seasons Hotel George V, Paris",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$$",
                  "amenityFeature": {
                      "@type": "LocationFeatureSpecification",
                      "name" : "internetType",
                      "value": "Free"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.9,
                    "reviewCount": 50
                  },
                  "url": "https://www.example.com/four-seasons"
                }
              },
              {
                "@type": "ListItem",
                "position": 2,
                "item": {
                  "@type": "VacationRental",
                  "name": "Downtown Condo",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$",
                  "amenityFeature": {
                    "@type": "LocationFeatureSpecification",
                    "name" : "instantBookable",
                    "value": true
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": 4.7,
                    "reviewCount": 827
                  },
                  "url": "https://www.example.com/downtown-condo"
                }
              },
              {
                "@type": "ListItem",
                "position": 3,
                "item": {
                  "@type": "Hotel",
                  "name": "Ritz Paris",
                  "image": [
                    "https://example.com/photos/1x1/photo.jpg",
                    "https://example.com/photos/4x3/photo.jpg",
                    "https://example.com/photos/16x9/photo.jpg"
                  ],
                  "priceRange": "$$$$",
                  "amenityFeature": {
                    "@type": "LocationFeatureSpecification",
                    "name" : "freeBreakfast",
                    "value": true
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1290
                },
                "url": "https://www.example.com/ritz-paris"
              }
            }
          ]
        }
      </script>
    </head>
    <body>
    </body>
  </html>
```

### 推荐活动示例

下面是一个 JSON-LD 格式的推荐活动轮播界面示例。

<html>
    <head>
      <title>Top 5 Things To Do in Paris</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Event",
                "name": "Paris Seine River Dinner Cruise",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 45.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
                "url": "https://www.example.com/event-location1"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "LocalBusiness",
                "name": "Notre-Dame Cathedral",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.8,
                  "reviewCount": 4220
                },
                "url": "https://www.example.com/localbusiness-location"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Event",
                "name": "Eiffel Tower With Host Summit Tour",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 59.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 652
                },
                "url": "https://www.example.com/event-location2"
              }
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
      <title>Top 5 Things To Do in Paris</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Event",
                "name": "Paris Seine River Dinner Cruise",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 45.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.2,
                  "reviewCount": 690
                },
                "url": "https://www.example.com/event-location1"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "LocalBusiness",
                "name": "Notre-Dame Cathedral",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "priceRange": "$",
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.8,
                  "reviewCount": 4220
                },
                "url": "https://www.example.com/localbusiness-location"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Event",
                "name": "Eiffel Tower With Host Summit Tour",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 59.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 652
                },
                "url": "https://www.example.com/event-location2"
              }
            }
          ]
        }
      </script>
    </head>
    <body>
    </body>
  </html>

```

### Product 示例

下面是一个 JSON-LD 格式的商品轮播界面示例。

<html>
    <head>
      <title>Top coats of the season</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Product",
                "name": "Puffy Coat Series by Goat Coat",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": 45.00,
                  "highPrice": 60.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 50
                },
                "url": "https://www.example.com/puffy-coats"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Product",
                "name": "Wool Coat Series by Best Coats Around",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": 189.00,
                  "highPrice": 200.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.7,
                  "reviewCount": 827
                },
                "url": "https://www.example.com/wool-coats"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Product",
                "name": "Antartic Coat by Cold Coats",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 45.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1290
                },
                "url": "https://www.example.com/antartic-coat"
              }
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
      <title>Top coats of the season</title>
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "item": {
                "@type": "Product",
                "name": "Puffy Coat Series by Goat Coat",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": 45.00,
                  "highPrice": 60.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 50
                },
                "url": "https://www.example.com/puffy-coats"
              }
            },
            {
              "@type": "ListItem",
              "position": 2,
              "item": {
                "@type": "Product",
                "name": "Wool Coat Series by Best Coats Around",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "AggregateOffer",
                  "lowPrice": 189.00,
                  "highPrice": 200.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.7,
                  "reviewCount": 827
                },
                "url": "https://www.example.com/wool-coats"
              }
            },
            {
              "@type": "ListItem",
              "position": 3,
              "item": {
                "@type": "Product",
                "name": "Antartic Coat by Cold Coats",
                "image": [
                  "https://example.com/photos/1x1/photo.jpg",
                  "https://example.com/photos/4x3/photo.jpg",
                  "https://example.com/photos/16x9/photo.jpg"
                ],
                "offers": {
                  "@type": "Offer",
                  "price": 45.00,
                  "priceCurrency": "EUR"
                },
                "aggregateRating": {
                  "@type": "AggregateRating",
                  "ratingValue": 4.9,
                  "reviewCount": 1290
                },
                "url": "https://www.example.com/antartic-coat"
              }
            }
          ]
        }
      </script>
    </head>
    <body>
    </body>
  </html>

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