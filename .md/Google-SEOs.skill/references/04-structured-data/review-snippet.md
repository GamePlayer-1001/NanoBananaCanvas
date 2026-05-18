# 评价摘要（Review、AggregateRating）结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn

---

  # 评价摘要（Review、AggregateRating）结构化数据

评价摘要是来自评价网站的简短评价摘录或评分，通常是众多评价者给出的综合评分的平均值。当 Google 发现有效的评价或评分标记时，可能会显示丰富网页摘要，其中包含根据评价或评分得出的星级和其他摘要信息。除了文字评价之外，还有数字分制（如 1 到 5）的评分。评价摘要可能会出现在富媒体搜索结果或 Google 知识面板中。您可以为以下功能提供评分：

      注意**：在 Google 搜索结果中的实际显示效果可能会有不同。您可以使用[富媒体搜索结果测试](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)来预览大多数功能。

- [图书](https://developers.google.com/search/docs/appearance/structured-data/book?hl=zh-cn)
- [课程列表](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)
- [事件](https://developers.google.com/search/docs/appearance/structured-data/event?hl=zh-cn)
- [本地商家](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn)（仅适用于捕获关于其他本地商家的评价的网站；请参阅[关于自利评价的指南](#self-serving)）
- [影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)
- [产品](https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [软件应用](https://developers.google.com/search/docs/appearance/structured-data/software-app?hl=zh-cn)

    Google 还支持针对以下 schema.org 类型（及其子类型）的评价：

- [CreativeWorkSeason](https://schema.org/CreativeWorkSeason)
- [CreativeWorkSeries](https://schema.org/CreativeWorkSeries)
- [Episode](https://schema.org/Episode)
- [Game](https://schema.org/Game)
- [MediaObject](https://schema.org/MediaObject)
- [MusicPlaylist](https://schema.org/MusicPlaylist)
- [MusicRecording](https://schema.org/MusicRecording)
- [Organization](https://schema.org/Organization)（仅适用于捕获关于其他组织的评价的网站；请参阅[关于自利评价的指南](#self-serving)）

      **您的网站是否提供关于其他雇主的评价？**如果是，请使用 [EmployerAggregateRating结构化数据](https://developers.google.com/search/docs/appearance/structured-data/employer-rating?hl=zh-cn)。

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

您可以通过下面几种方法向网页添加 Review 结构化数据：

- 添加简单评价。
- 使用 [review](https://schema.org/review) 属性将评价嵌入另一个 schema.org 类型。
- 添加总体评分。如果您标记的内容同时包含作者和评价日期，则可以省略个别评价的评分。对于总体评价，您必须提供平均评分，才能显示丰富网页摘要。
- 使用 [aggregateRating](https://schema.org/aggregateRating) 属性将总体评分嵌入另一个 schema.org 类型。

### 简单评价

下面是一个简单评价示例。

### JSON-LD

        <html>
  <head>
  <title>Legal Seafood</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Review",
      "itemReviewed": {
        "@type": "Restaurant",
        "image": "https://www.example.com/seafood-restaurant.jpg",
        "name": "Legal Seafood",
        "servesCuisine": "Seafood",
        "priceRange": "$$$",
        "telephone": "1234567",
        "address" :{
          "@type": "PostalAddress",
          "streetAddress": "123 William St",
          "addressLocality": "New York",
          "addressRegion": "NY",
          "postalCode": "10038",
          "addressCountry": "US"
        }
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 4
      },
      "author": {
        "@type": "Person",
        "name": "Bob Smith"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Washington Times"
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
  <title>Legal Seafood</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Review",
      "itemReviewed": {
        "@type": "Restaurant",
        "image": "https://www.example.com/seafood-restaurant.jpg",
        "name": "Legal Seafood",
        "servesCuisine": "Seafood",
        "priceRange": "$$$",
        "telephone": "1234567",
        "address" :{
          "@type": "PostalAddress",
          "streetAddress": "123 William St",
          "addressLocality": "New York",
          "addressRegion": "NY",
          "postalCode": "10038",
          "addressCountry": "US"
        }
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": 4
      },
      "author": {
        "@type": "Person",
        "name": "Bob Smith"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Washington Times"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

     <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="Review">
      <div property="itemReviewed" typeof="Restaurant">
        <img property="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span property="name">Legal Seafood</span>
        <span property="servesCuisine">Seafood</span>
        <span property="priceRange">$$$</span>
        <span property="telephone">1234567</span>
        <span property="address">123 William St, New York</span>
      </div>
      <span property="reviewRating" typeof="Rating">
        <span property="ratingValue">4</span>
      </span> stars -
      <b>"A good seafood place." </b>
      <span property="author" typeof="Person">
        <span property="name">Bob Smith</span>
      </span>
      <div property="publisher" typeof="Organization">
        <meta property="name" content="Washington Times">
      </div>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="Review">
      <div property="itemReviewed" typeof="Restaurant">
        <img property="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span property="name">Legal Seafood</span>
        <span property="servesCuisine">Seafood</span>
        <span property="priceRange">$$$</span>
        <span property="telephone">1234567</span>
        <span property="address">123 William St, New York</span>
      </div>
      <span property="reviewRating" typeof="Rating">
        <span property="ratingValue">4</span>
      </span> stars -
      <b>"A good seafood place." </b>
      <span property="author" typeof="Person">
        <span property="name">Bob Smith</span>
      </span>
      <div property="publisher" typeof="Organization">
        <meta property="name" content="Washington Times">
      </div>
    </div>
  </body>
</html>
```

### 微数据

     <html>
  <head>
  <title>Legal Seafood</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Review">
      <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/Restaurant">
        <img itemprop="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span itemprop="name">Legal Seafood</span>
        <span itemprop="servesCuisine">Seafood</span>
        <span itemprop="priceRange">$$$</span>
        <span itemprop="telephone">1234567</span>
        <span itemprop="address">123 William St, New York</span>
      </div>
      <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <span itemprop="ratingValue">4</span>
      </span> stars -
      <b>"A good seafood place." </b>
      <span itemprop="author" itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">Bob Smith</span>
      </span>
      <div itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
        <meta itemprop="name" content="Washington Times">
      </div>
    </div>
  </body>
</html>

```
 <html>
  <head>
  <title>Legal Seafood</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Review">
      <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/Restaurant">
        <img itemprop="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span itemprop="name">Legal Seafood</span>
        <span itemprop="servesCuisine">Seafood</span>
        <span itemprop="priceRange">$$$</span>
        <span itemprop="telephone">1234567</span>
        <span itemprop="address">123 William St, New York</span>
      </div>
      <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
        <span itemprop="ratingValue">4</span>
      </span> stars -
      <b>"A good seafood place." </b>
      <span itemprop="author" itemscope itemtype="https://schema.org/Person">
        <span itemprop="name">Bob Smith</span>
      </span>
      <div itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
        <meta itemprop="name" content="Washington Times">
      </div>
    </div>
  </body>
</html>
```

### 嵌套评价

下面是一个嵌入 Product 中的评价示例。您可以将该示例复制并粘贴到自己的 HTML 网页中。

### JSON-LD

  <html>
  <head>
    <title>The Catcher in the Rye</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "brand": {
        "@type": "Brand",
        "name": "Penguin Books"
      },
      "description": "The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind.",
      "sku": "9780241984758",
      "mpn": "925872",
      "image": "https://www.example.com/catcher-in-the-rye-book-cover.jpg",
      "name": "The Catcher in the Rye",
      "review": [{
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5
        },
        "author": {
          "@type": "Person",
          "name": "John Doe"
        }
       },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 1
        },
        "author": {
          "@type": "Person",
          "name": "Jane Doe"
        }
      }],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 88,
        "bestRating": 100,
        "ratingCount": 20
      },
      "offers": {
        "@type": "Offer",
        "url": "https://example.com/offers/catcher-in-the-rye",
        "priceCurrency": "USD",
        "price": 5.99,
        "priceValidUntil": "2024-11-05",
        "itemCondition": "https://schema.org/UsedCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "eBay"
        }
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
    <title>The Catcher in the Rye</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "brand": {
        "@type": "Brand",
        "name": "Penguin Books"
      },
      "description": "The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind.",
      "sku": "9780241984758",
      "mpn": "925872",
      "image": "https://www.example.com/catcher-in-the-rye-book-cover.jpg",
      "name": "The Catcher in the Rye",
      "review": [{
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 5
        },
        "author": {
          "@type": "Person",
          "name": "John Doe"
        }
       },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 1
        },
        "author": {
          "@type": "Person",
          "name": "Jane Doe"
        }
      }],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 88,
        "bestRating": 100,
        "ratingCount": 20
      },
      "offers": {
        "@type": "Offer",
        "url": "https://example.com/offers/catcher-in-the-rye",
        "priceCurrency": "USD",
        "price": 5.99,
        "priceValidUntil": "2024-11-05",
        "itemCondition": "https://schema.org/UsedCondition",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "eBay"
        }
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

 <html>
  <head>
    <title>The Catcher in the Rye</title>
  </head>
    <body>
      <div vocab="https://schema.org/" typeof="Product">
        <div rel="schema:brand">
          <div typeof="schema:Brand">
            <div property="schema:name" content="Penguin"></div>
          </div>
        </div>
        <div property="schema:description" content="The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind."></div>
        <div property="schema:sku" content="9780241984758"></div>
        <div property="schema:mpn" content="925872"></div>
        <img property="image" src="https://example.com/photos/1x1/catcher-in-the-rye-book-cover.jpg" alt="Catcher in the Rye"/>
        <span property="name">The Catcher in the Rye</span>
        <div property="review" typeof="Review"> Reviews:
          <span property="reviewRating" typeof="Rating">
            <span property="ratingValue">5</span> -
          </span>
          <b>"A masterpiece of literature" </b> by
          <span property="author" typeof="Person">
            <span property="name">John Doe</span></span>, written on
          <meta property="datePublished" content="2006-05-04">4 May 2006
          <div>I really enjoyed this book. It captures the essential challenge people face as they try make sense of their lives and grow to adulthood.</div>
          <span property="publisher" typeof="Organization">
            <meta property="name" content="Washington Times">
          </span>
        </div><div property="review" typeof="Review">
          <span property="reviewRating" typeof="Rating">
            <span property="ratingValue">1</span> -
          </span>
          <b>"The worst thing I've ever read" </b> by
          <span property="author" typeof="Person">
            <span property="name">Jane Doe</span></span>, written on
          <meta property="datePublished" content="2006-05-10">10 May 2006
          <span property="publisher" typeof="Organization">
            <meta property="name" content="Washington Times">
          </span>
        </div>
        <div rel="schema:aggregateRating">
          <div typeof="schema:AggregateRating">
            <div property="schema:reviewCount" content="89"></div>
            <div property="schema:ratingValue" content="4.4">4,4</div> stars
          </div>
        </div>
        <div rel="schema:offers">
          <div typeof="schema:Offer">
            <div property="schema:price" content="4.99"></div>
            <div property="schema:availability" content="https://schema.org/InStock"></div>
            <div property="schema:priceCurrency" content="GBP"></div>
            <div property="schema:priceValidUntil" datatype="xsd:date" content="2024-11-21"></div>
            <div rel="schema:url" resource="https://example.com/catcher"></div>
            <div property="schema:itemCondition" content="https://schema.org/UsedCondition"></div>
          </div>
        </div>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>The Catcher in the Rye</title>
  </head>
    <body>
      <div vocab="https://schema.org/" typeof="Product">
        <div rel="schema:brand">
          <div typeof="schema:Brand">
            <div property="schema:name" content="Penguin"></div>
          </div>
        </div>
        <div property="schema:description" content="The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind."></div>
        <div property="schema:sku" content="9780241984758"></div>
        <div property="schema:mpn" content="925872"></div>
        <img property="image" src="https://example.com/photos/1x1/catcher-in-the-rye-book-cover.jpg" alt="Catcher in the Rye"/>
        <span property="name">The Catcher in the Rye</span>
        <div property="review" typeof="Review"> Reviews:
          <span property="reviewRating" typeof="Rating">
            <span property="ratingValue">5</span> -
          </span>
          <b>"A masterpiece of literature" </b> by
          <span property="author" typeof="Person">
            <span property="name">John Doe</span></span>, written on
          <meta property="datePublished" content="2006-05-04">4 May 2006
          <div>I really enjoyed this book. It captures the essential challenge people face as they try make sense of their lives and grow to adulthood.</div>
          <span property="publisher" typeof="Organization">
            <meta property="name" content="Washington Times">
          </span>
        </div><div property="review" typeof="Review">
          <span property="reviewRating" typeof="Rating">
            <span property="ratingValue">1</span> -
          </span>
          <b>"The worst thing I've ever read" </b> by
          <span property="author" typeof="Person">
            <span property="name">Jane Doe</span></span>, written on
          <meta property="datePublished" content="2006-05-10">10 May 2006
          <span property="publisher" typeof="Organization">
            <meta property="name" content="Washington Times">
          </span>
        </div>
        <div rel="schema:aggregateRating">
          <div typeof="schema:AggregateRating">
            <div property="schema:reviewCount" content="89"></div>
            <div property="schema:ratingValue" content="4.4">4,4</div> stars
          </div>
        </div>
        <div rel="schema:offers">
          <div typeof="schema:Offer">
            <div property="schema:price" content="4.99"></div>
            <div property="schema:availability" content="https://schema.org/InStock"></div>
            <div property="schema:priceCurrency" content="GBP"></div>
            <div property="schema:priceValidUntil" datatype="xsd:date" content="2024-11-21"></div>
            <div rel="schema:url" resource="https://example.com/catcher"></div>
            <div property="schema:itemCondition" content="https://schema.org/UsedCondition"></div>
          </div>
        </div>
    </div>
  </body>
</html>
```

### 微数据

   <html>
  <head>
    <title>The Catcher in the Rye</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <div itemprop="brand" itemtype="https://schema.org/Brand" itemscope>
        <meta itemprop="name" content="Penguin" />
      </div>
      <meta itemprop="description" content="The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind." />
      <meta itemprop="sku" content="0446310786" />
      <meta itemprop="mpn" content="925872" />
      <img itemprop="image" src="https://example.com/photos/1x1/catcher-in-the-rye-book-cover.jpg" alt="Catcher in the Rye"/>
      <span itemprop="name">The Catcher in the Rye</span>
      <div itemprop="review" itemscope itemtype="https://schema.org/Review"> Reviews:
        <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          <span itemprop="ratingValue">5</span> -
        </span>
        <b>"A masterpiece of literature" </b> by
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">John Doe</span></span>, written on
        <meta itemprop="datePublished" content="2006-05-04">4 May 2006
        <div>I really enjoyed this book. It captures the essential challenge people face as they try make sense of their lives and grow to adulthood.</div>
        <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
            <meta itemprop="name" content="Washington Times">
        </span>
      </div><div itemprop="review" itemscope itemtype="https://schema.org/Review">
        <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
            <span itemprop="ratingValue">1</span> -
        </span>
        <b>"The worst thing I've ever read" </b> by
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">Jane Doe</span></span>, written on
        <meta itemprop="datePublished" content="2006-05-10">10 May 2006
        <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
          <meta itemprop="name" content="Washington Times">
        </span>
      </div>
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <span itemprop="ratingValue" content="4.4">4,4</span> stars
      </div>
      <div itemprop="offers" itemtype="https://schema.org/Offer" itemscope>
        <link itemprop="url" href="https://example.com/catcher" />
        <meta itemprop="availability" content="https://schema.org/InStock" />
        <meta itemprop="priceCurrency" content="GBP" />
        <meta itemprop="itemCondition" content="https://schema.org/UsedCondition" />
        <meta itemprop="price" content="4.99" />
        <meta itemprop="priceValidUntil" content="2024-11-21" />
      </div>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>The Catcher in the Rye</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <div itemprop="brand" itemtype="https://schema.org/Brand" itemscope>
        <meta itemprop="name" content="Penguin" />
      </div>
      <meta itemprop="description" content="The Catcher in the Rye is a classic coming-of-age story: an story of teenage alienation, capturing the human need for connection and the bewildering sense of loss as we leave childhood behind." />
      <meta itemprop="sku" content="0446310786" />
      <meta itemprop="mpn" content="925872" />
      <img itemprop="image" src="https://example.com/photos/1x1/catcher-in-the-rye-book-cover.jpg" alt="Catcher in the Rye"/>
      <span itemprop="name">The Catcher in the Rye</span>
      <div itemprop="review" itemscope itemtype="https://schema.org/Review"> Reviews:
        <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
          <span itemprop="ratingValue">5</span> -
        </span>
        <b>"A masterpiece of literature" </b> by
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">John Doe</span></span>, written on
        <meta itemprop="datePublished" content="2006-05-04">4 May 2006
        <div>I really enjoyed this book. It captures the essential challenge people face as they try make sense of their lives and grow to adulthood.</div>
        <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
            <meta itemprop="name" content="Washington Times">
        </span>
      </div><div itemprop="review" itemscope itemtype="https://schema.org/Review">
        <span itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">
            <span itemprop="ratingValue">1</span> -
        </span>
        <b>"The worst thing I've ever read" </b> by
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">Jane Doe</span></span>, written on
        <meta itemprop="datePublished" content="2006-05-10">10 May 2006
        <span itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
          <meta itemprop="name" content="Washington Times">
        </span>
      </div>
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <span itemprop="ratingValue" content="4.4">4,4</span> stars
      </div>
      <div itemprop="offers" itemtype="https://schema.org/Offer" itemscope>
        <link itemprop="url" href="https://example.com/catcher" />
        <meta itemprop="availability" content="https://schema.org/InStock" />
        <meta itemprop="priceCurrency" content="GBP" />
        <meta itemprop="itemCondition" content="https://schema.org/UsedCondition" />
        <meta itemprop="price" content="4.99" />
        <meta itemprop="priceValidUntil" content="2024-11-21" />
      </div>
    </div>
  </body>
</html>
```

### 总体评分

下面是一个总体评分示例。

### JSON-LD

  <html>
  <head>
    <title>Legal Seafood</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "AggregateRating",
      "itemReviewed": {
        "@type": "Restaurant",
        "image": "https://www.example.com/seafood-restaurant.jpg",
        "name": "Legal Seafood",
        "servesCuisine": "Seafood",
        "telephone": "1234567",
        "address" : {
          "@type": "PostalAddress",
          "streetAddress": "123 William St",
          "addressLocality": "New York",
          "addressRegion": "NY",
          "postalCode": "10038",
          "addressCountry": "US"
        }
      },
      "ratingValue": 88,
      "bestRating": 100,
      "ratingCount": 20
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Legal Seafood</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "AggregateRating",
      "itemReviewed": {
        "@type": "Restaurant",
        "image": "https://www.example.com/seafood-restaurant.jpg",
        "name": "Legal Seafood",
        "servesCuisine": "Seafood",
        "telephone": "1234567",
        "address" : {
          "@type": "PostalAddress",
          "streetAddress": "123 William St",
          "addressLocality": "New York",
          "addressRegion": "NY",
          "postalCode": "10038",
          "addressCountry": "US"
        }
      },
      "ratingValue": 88,
      "bestRating": 100,
      "ratingCount": 20
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

     <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="AggregateRating">
      <div property="itemReviewed" typeof="Restaurant">
        <img property="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span property="name">Legal Seafood</span>
        <span property="servesCuisine">Seafood</span>
        <span property="telephone">1234567</span>
        <span property="address">123 William St, New York</span>
      </div>
      <span property="ratingValue">4.2</span> out of <span property="bestRating">5</span> stars -
      <span property="ratingCount">123</span> votes
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="AggregateRating">
      <div property="itemReviewed" typeof="Restaurant">
        <img property="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span property="name">Legal Seafood</span>
        <span property="servesCuisine">Seafood</span>
        <span property="telephone">1234567</span>
        <span property="address">123 William St, New York</span>
      </div>
      <span property="ratingValue">4.2</span> out of <span property="bestRating">5</span> stars -
      <span property="ratingCount">123</span> votes
    </div>
  </body>
</html>
```

### 微数据

     <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/AggregateRating">
      <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/Restaurant">
        <img itemprop="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span itemprop="name">Legal Seafood</span>
        <span itemprop="servesCuisine">Seafood</span>
        <span itemprop="telephone">1234567</span>
        <span itemprop="address">123 William St, New York</span>
      </div>
      <span itemprop="ratingValue">4.2</span> out of <span itemprop="bestRating">5</span> stars -
      <span itemprop="ratingCount">123</span> votes
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Legal Seafood</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/AggregateRating">
      <div itemprop="itemReviewed" itemscope itemtype="https://schema.org/Restaurant">
        <img itemprop="image" src="https://example.com/photos/1x1/seafood-restaurant.jpg" alt="Legal Seafood"/>
        <span itemprop="name">Legal Seafood</span>
        <span itemprop="servesCuisine">Seafood</span>
        <span itemprop="telephone">1234567</span>
        <span itemprop="address">123 William St, New York</span>
      </div>
      <span itemprop="ratingValue">4.2</span> out of <span itemprop="bestRating">5</span> stars -
      <span itemprop="ratingCount">123</span> votes
    </div>
  </body>
</html>
```

### 嵌套总体评分

下面是一个嵌入 Product 中的总体评分示例。您可以将该示例复制并粘贴到自己的 HTML 网页中。

### JSON-LD

    <html>
  <head>
  <title>Executive Anvil</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Executive Anvil",
    "image": [
      "https://example.com/photos/1x1/photo.jpg",
      "https://example.com/photos/4x3/photo.jpg",
      "https://example.com/photos/16x9/photo.jpg"
     ],
    "brand": {
      "@type": "Brand",
      "name": "ACME"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.4,
      "ratingCount": 89
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": 119.99,
      "highPrice": 199.99,
      "priceCurrency": "USD"
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
  <title>Executive Anvil</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Executive Anvil",
    "image": [
      "https://example.com/photos/1x1/photo.jpg",
      "https://example.com/photos/4x3/photo.jpg",
      "https://example.com/photos/16x9/photo.jpg"
     ],
    "brand": {
      "@type": "Brand",
      "name": "ACME"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.4,
      "ratingCount": 89
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": 119.99,
      "highPrice": 199.99,
      "priceCurrency": "USD"
    }
  }
  </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

       <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="Product">
     <span property="brand" typeof="Brand">ACME</span> <span property="name">Executive Anvil</span>
     <img property="image" src="https://example.com/photos/1x1/anvil_executive.jpg" alt="Executive Anvil logo" />
     <span property="aggregateRating"
           typeof="AggregateRating">
      Average rating: <span property="ratingValue">4.4</span>, based on
      <span property="ratingCount">89</span> reviews
     </span>
     <span property="offers" typeof="AggregateOffer">
      from $<span property="lowPrice">119.99</span> to
      $<span property="highPrice">199.99</span>
      <meta property="priceCurrency" content="USD" />
     </span>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="Product">
     <span property="brand" typeof="Brand">ACME</span> <span property="name">Executive Anvil</span>
     <img property="image" src="https://example.com/photos/1x1/anvil_executive.jpg" alt="Executive Anvil logo" />
     <span property="aggregateRating"
           typeof="AggregateRating">
      Average rating: <span property="ratingValue">4.4</span>, based on
      <span property="ratingCount">89</span> reviews
     </span>
     <span property="offers" typeof="AggregateOffer">
      from $<span property="lowPrice">119.99</span> to
      $<span property="highPrice">199.99</span>
      <meta property="priceCurrency" content="USD" />
     </span>
    </div>
  </body>
</html>
```

### 微数据

     <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <span itemprop="brand" itemtype="https://schema.org/Brand" itemscope>ACME</span> <span itemprop="name">Executive Anvil</span>
      <img itemprop="image" src="https://example.com/photos/1x1/anvil_executive.jpg" />
      <span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        Average rating: <span itemprop="ratingValue">4.4</span>, based on
        <span itemprop="ratingCount">89</span> reviews
      </span>
      <span itemprop="offers" itemscope itemtype="https://schema.org/AggregateOffer">
        from $<span itemprop="lowPrice">119.99</span> to
        $<span itemprop="highPrice">199.99</span>
        <meta itemprop="priceCurrency" content="USD" />
      </span>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/Product">
      <span itemprop="brand" itemtype="https://schema.org/Brand" itemscope>ACME</span> <span itemprop="name">Executive Anvil</span>
      <img itemprop="image" src="https://example.com/photos/1x1/anvil_executive.jpg" />
      <span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        Average rating: <span itemprop="ratingValue">4.4</span>, based on
        <span itemprop="ratingCount">89</span> reviews
      </span>
      <span itemprop="offers" itemscope itemtype="https://schema.org/AggregateOffer">
        from $<span itemprop="lowPrice">119.99</span> to
        $<span itemprop="highPrice">199.99</span>
        <meta itemprop="priceCurrency" content="USD" />
      </span>
    </div>
  </body>
</html>
```

## 指南

您的内容必须遵循以下指南，才能以富媒体搜索结果的形式呈现。

警告：**如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [技术指南](#technical-guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 技术指南

- 确保使用 [schema.org/AggregateRating](https://schema.org/AggregateRating) 标记许多人对某项内容的总体评估。Google 可能会将总体评分显示为丰富网页摘要，对于某些类型的内容，也可能会在搜索结果中显示为答案。
- 若想明确提及特定的产品或服务，可以将评价嵌套在另一种 schema.org 类型（如 [schema.org/Book](https://schema.org/Book) 或 [schema.org/Recipe](https://schema.org/Recipe)）的标记中，或者将一个 schema.org 类型用作 itemReviewed 属性的值。
- 确保用户可以随时在标记的网页中查看您标记的评价内容。并且能够一目了然地发现网页中包含评价内容。 例如，如果您对评价进行了标记，用户应该能够看到评价的文本和关联的评分。如果您使用 AggregateRating，用户应该能够在网页上看到该总体评分。
- 我们建议您仅接受附有评价意见和作者姓名的评分。
    虽然这不是强制要求，但此方法可以帮助用户查看解释评分的详细信息。
- 提供与具体项（而非某个类别或列表中的所有项）有关的评价信息。
- 如果您添加多条单独的评价，则还需要添加各条评价的汇总评分。
- 请勿汇总来自其他网站的评价或评分。
- 如果评价摘要针对本地商家或组织，您必须遵循以下这些额外的指南：

           如果接受评价的实体能够控制其收到的评价，则使用 LocalBusiness 或任何其他类型的 Organization 结构化数据的网页无法使用星级评价功能。例如，将有关实体 A 的评价直接添加到结构化数据中或者通过嵌入式第三方微件（如 Google 商家评价或 Facebook 评价微件）将其呈现在实体 A 的网站上。
             如需了解详情，请参阅[介绍我们为何添加该指南](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful?hl=zh-cn#updated)的博文以及[关于此次变更的常见问题解答](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful?hl=zh-cn#faq)。
- 评分必须直接来自用户。
- 请勿依赖人工编辑来为本地商家创建、精选或编制评分信息。

## 不同结构化数据类型的定义

要使结构化数据能够显示在搜索结果中，您必须为其添加必需的属性。您还可以添加建议的属性，以便向结构化数据添加更多信息，进而提供更好的用户体验。

### Review

如需了解 Review 的完整定义，请访问 [schema.org/Review](https://schema.org/Review)。

Google 支持的属性如下：

    必要属性

      author

[Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

评价的作者。评价者的名称必须是一个有效的名称。例如，“周六之前享受五折优惠”就不是有效的评价者名称。

此字段的字符数必须小于 100 个。如果字符数超过 100 个，您的网页就无法显示基于作者的评价摘要。

          为了帮助 Google 更好地了解各种功能中的作者，应该遵循[作者标记最佳实践](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn#author-bp)。

        itemReviewed（如果评价不是[嵌套评价](#embedded-review-example)）

有效的类型之一

被评价的项。不过，如果使用 [review](https://schema.org/review) 属性将评价嵌入另一个 schema.org 类型，则可以省略 itemReviewed 属性（我们假设父项是被评项）。

            被评项的有效类型是：

- [Book](https://schema.org/Book)
- [Course](https://schema.org/Course)
- [CreativeWorkSeason](https://schema.org/CreativeWorkSeason)
- [CreativeWorkSeries](https://schema.org/CreativeWorkSeries)
- [Episode](https://schema.org/Episode)
- [Event](https://schema.org/Event)
- [Game](https://schema.org/Game)
- [HowTo](https://schema.org/HowTo)
- [LocalBusiness](https://schema.org/LocalBusiness)
- [MediaObject](https://schema.org/MediaObject)
- [Movie](https://schema.org/Movie)
- [MusicPlaylist](https://schema.org/MusicPlaylist)
- [MusicRecording](https://schema.org/MusicRecording)
- [Organization](https://schema.org/Organization)
- [Product](https://schema.org/Product)
- [Recipe](https://schema.org/Recipe)
- [SoftwareApplication](https://schema.org/SoftwareApplication)

        itemReviewed.name 或[嵌套评价](#embedded-review-example)中的父项 name

[Text](https://schema.org/Text)

被评项的名称。如果使用 [review](https://schema.org/review) 属性将评价嵌入另一个 schema.org 类型，您仍需提供被评项的 name。例如：

```
{
  "@context": "https://schema.org/",
  "@type": "Game",
  "name": "Firefly",
  "review": {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": 5
    },
    "author": {
      "@type": "Person",
      "name": "John Doe"
    }
  }
}
```

         reviewRating

[Rating](https://schema.org/Rating)

在相应评价中给出的评分。评分可以是嵌套的 [Rating](https://schema.org/Rating) 或更具体的子类型。最典型的子类型是 [AggregateRating](#aggregated-rating-type-definition)。

          reviewRating.ratingValue

[Number](https://schema.org/Number) 或 [Text](https://schema.org/Text)

相应项的质量评分（以数字表示），可以是数字、分数或百分比（例如 4、60% 或 6 / 10）。Google 能够理解分数和百分比的分制，因为分数本身或百分比就暗含了分制。数字的默认分制为 5 分制，1 为最低值，5 为最高值。如需采用其他分制，请使用 bestRating 和 worstRating。

对于小数，请使用句点（而非英文逗号）来指定值（例如，使用 4.4 而不是 4,4）。在微数据和 RDFa 中，您可以使用 content 属性替换可见内容。这样，您就可以向用户显示任何样式惯例，同时满足结构化数据的句点要求。 例如：

```
<span itemprop="ratingValue" content="4.4">4,4</span> stars
```

    建议属性

        datePublished

[Date](https://schema.org/Date)

发布评价的日期，采用 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 日期格式。

          reviewRating.bestRating

[Number](https://schema.org/Number)

相应评分制中允许的最高值。如果省略 bestRating，系统会假定最高评分为 5 分。

          reviewRating.worstRating

[Number](https://schema.org/Number)

相应评分制中允许的最低值。如果省略 worstRating，系统会假定最低评分为 1 分。

### AggregateRating

如需了解 AggregateRating 的完整定义，请访问 [schema.org/AggregateRating](https://schema.org/AggregateRating)。

Google 支持的属性如下：

      必要属性

        itemReviewed（如果总体评分不是[嵌套总体评分](#embedded-aggregate-rating)）

有效的类型之一

被评分的项。不过，如果使用 [aggregateRating](https://schema.org/aggregateRating) 属性将总体评分嵌入另一个 schema.org 类型的属性，则可以省略 itemReviewed 属性。

              被评项的有效类型是：

- [Book](https://schema.org/Book)
- [Course](https://schema.org/Course)
- [CreativeWorkSeason](https://schema.org/CreativeWorkSeason)
- [CreativeWorkSeries](https://schema.org/CreativeWorkSeries)
- [Episode](https://schema.org/Episode)
- [Event](https://schema.org/Event)
- [Game](https://schema.org/Game)
- [HowTo](https://schema.org/HowTo)
- [LocalBusiness](https://schema.org/LocalBusiness)
- [MediaObject](https://schema.org/MediaObject)
- [Movie](https://schema.org/Movie)
- [MusicPlaylist](https://schema.org/MusicPlaylist)
- [MusicRecording](https://schema.org/MusicRecording)
- [Organization](https://schema.org/Organization)
- [Product](https://schema.org/Product)
- [Recipe](https://schema.org/Recipe)
- [SoftwareApplication](https://schema.org/SoftwareApplication)

        itemReviewed.name 或[嵌套总体评分](#embedded-aggregate-rating)中的父项 name

[Text](https://schema.org/Text)

被评项的名称。如果使用 [aggregateRating](https://schema.org/aggregateRating) 属性将评价嵌入另一个 schema.org 类型，您仍需提供被评项的 name。例如：

```
{
  "@context": "https://schema.org/",
  "@type": "Game",
  "name": "Firefly",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 88,
    "bestRating": 100,
    "ratingCount": 20
  }
}
```

        ratingCount

[Number](https://schema.org/Number)

相应项在您的网站上获得的评分总数。至少需要 ratingCount 和 reviewCount 其中之一。

        reviewCount

[Number](https://schema.org/Number)

指定给出评价的人数（无论是否附有评分）。至少需要 ratingCount 和 reviewCount 其中之一。

        ratingValue

[Number](https://schema.org/Number) 或 [Text](https://schema.org/Text)

相应项的平均质量评分（以数字表示），可以是数字、分数或百分比（例如 4、60% 或 6 / 10）。Google 能够理解分数和百分比的分制，因为分数本身或百分比就暗含了分制。数字的默认分制为 5 分制，1 为最低值，5 为最高值。如需采用其他分制，请使用 bestRating 和 worstRating。

对于十进制数，请使用句点（而非英文逗号）来指定值（例如，使用 4.4 而不是 4,4）。在微数据和 RDFa 中，您可以使用 content 属性替换可见内容。这样，您就可以向用户显示任何样式惯例，同时满足结构化数据的句点要求。 例如：

```
<span itemprop="ratingValue" content="4.4">4,4</span> stars
```

    建议属性

      bestRating

[Number](https://schema.org/Number)

相应评分制中允许的最高值。如果省略 bestRating，系统会假定最高评分为 5 分。

      worstRating

[Number](https://schema.org/Number)

相应评分制中允许的最低值。如果省略 worstRating，系统会假定最低评分为 1 分。

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

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。