# 轮播界面 (ItemList) 结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn

---

  # 轮播界面 (ItemList) 结构化数据

轮播界面是一种列表形式的富媒体搜索结果，用户可以在移动设备上滑动浏览其内容。它会显示来自同一网站的多张卡片（又称为“托管轮播界面”）。为了让您的网站能够显示托管轮播界面富媒体搜索结果，请添加 ItemList 结构化数据，并与下列支持的结构化数据功能之一结合：

- [课程列表](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)
- [影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [餐馆](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#carousel)

  如果您添加 ItemList 标记并与一种支持的内容类型结合，则轮播界面在 Google 搜索中可能的显示效果如下：

注意**：Google 搜索上还有其他类似于轮播界面的功能（例如“焦点新闻”），其中会显示来自不同网站的结果。您无法通过轮播界面标记控制这些类型的轮播界面。

## 添加结构化数据

  结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

  下面概述了如何向网站中添加结构化数据。

1. 决定哪个网页将包含轮播界面结构化数据。有两种选择：

- **[摘要页面和多个详情页面](#summary)**：摘要页面包含列表中每一项的简短说明，每项说明都指向一个单独的详情页面，详情页面则只介绍该项内容。例如，在列有一组最佳曲奇食谱的摘要页面中，每项说明都链接到该种曲奇的完整食谱。
- **[一页全包式单一列表](#all-in-one)**：包含所有列表信息（包括每项的全文）的单个页面。例如，一个 2020 年的热门电影列表，全部包含在一个页面中。
2. 添加[必要属性](#structured-data-type-definitions)。根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
    **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
3. 根据轮播界面所涉及的具体内容类型，添加必需属性和建议属性：

- [课程](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)
- [影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [餐馆](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#carousel)
4. 遵循[指南](#guidelines)。
5. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码。
6. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
  **注意**：重新抓取和重新编入索引需要一段时间，请耐心等待。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
7. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

### 摘要页面和多个详情页面

**摘要页面**包含列表中每一项的简短说明。每项说明都指向一个单独的**详情页面**，详情页面则只介绍该项内容。

#### 
  摘要页面

  摘要页面定义了一个 ItemList，其中每个 ListItem 都只有三个属性：@type（设为 ListItem）、position（在列表中的位置）和 url（相应项的完整详情所在页面的网址）。

  以下是摘要页面的外观示例：

  <html>
  <head>
    <title>Best cookie recipes</title>
    <script type="application/ld+json">
    {
      "@context":"https://schema.org",
      "@type":"ItemList",
      "itemListElement":[
        {
          "@type":"ListItem",
          "position":1,
          "url":"https://example.com/peanut-butter-cookies.html"
        },
        {
          "@type":"ListItem",
          "position":2,
          "url":"https://example.com/triple-chocolate-chunk.html"
        },
        {
          "@type":"ListItem",
          "position":3,
          "url":"https://example.com/snickerdoodles.html"
        }
      ]
    }
    </script>
  </head>
  <body>
    <p>
      Here are the best cookie recipes of all time.
    </p>
    <h2>
      Peanut Butter Cookies
    </h2>
    <p>
      This <a href="https://example.com/peanut-butter-cookies.html">Peanut Butter Cookie recipe</a> is the tastiest one you'll find.
    </p>
    <h2>
      Triple Chocolate Chunk Cookies
    </h2>
    <p>
      This <a href="https://example.com/triple-chocolate-chunk.html">Triple Chocolate Chunk Cookies recipe</a> is the tastiest one you'll find.
    </p>
    <h2>
      Snickerdoodles
    </h2>
    <p>
      This <a href="https://example.com/snickerdoodles.html">Snickerdoodles recipe</a> is the tastiest one you'll find.
    </p>
  </body>
</html>
**

```
<html>
  <head>
    <title>Best cookie recipes</title>
    <script type="application/ld+json">
    {
      "@context":"https://schema.org",
      "@type":"ItemList",
      "itemListElement":[
        {
          "@type":"ListItem",
          "position":1,
          "url":"https://example.com/peanut-butter-cookies.html"
        },
        {
          "@type":"ListItem",
          "position":2,
          "url":"https://example.com/triple-chocolate-chunk.html"
        },
        {
          "@type":"ListItem",
          "position":3,
          "url":"https://example.com/snickerdoodles.html"
        }
      ]
    }
    </script>
  </head>
  <body>
    <p>
      Here are the best cookie recipes of all time.
    </p>
    <h2>
      Peanut Butter Cookies
    </h2>
    <p>
      This <a href="https://example.com/peanut-butter-cookies.html">Peanut Butter Cookie recipe</a> is the tastiest one you'll find.
    </p>
    <h2>
      Triple Chocolate Chunk Cookies
    </h2>
    <p>
      This <a href="https://example.com/triple-chocolate-chunk.html">Triple Chocolate Chunk Cookies recipe</a> is the tastiest one you'll find.
    </p>
    <h2>
      Snickerdoodles
    </h2>
    <p>
      This <a href="https://example.com/snickerdoodles.html">Snickerdoodles recipe</a> is the tastiest one you'll find.
    </p>
  </body>
</html>
```

#### 
  详情页面

  详情页面定义了轮播界面所涉及的特定结构化数据类型。例如，如果摘要页面介绍了一组最佳曲奇食谱，每个详情页面都会包含一个特定食谱的 Recipe 结构化数据。

  下面是一个详情页面的外观示例：

#### 
      花生酱曲奇

    <html>
  <head>
    <title>Peanut Butter Cookies</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Peanut Butter Cookies",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Peanut Butter Cookie recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "peanut butter, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of peanut butter",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the peanut butter and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Peanut Butter Cookies",
        "description": "This is how you make peanut butter cookies.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make peanut butter cookies.
    </p>
    <ol>
      <li>Mix together the peanut butter and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Peanut Butter Cookies</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Peanut Butter Cookies",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Peanut Butter Cookie recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "peanut butter, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of peanut butter",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the peanut butter and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Peanut Butter Cookies",
        "description": "This is how you make peanut butter cookies.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make peanut butter cookies.
    </p>
    <ol>
      <li>Mix together the peanut butter and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>
```

#### 
      三重巧克力块曲奇

    <html>
  <head>
    <title>Triple Chocolate Chunk Cookies</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Triple Chocolate Chunk Cookies",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Triple Chocolate Chunk Cookie recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "chocolate, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of melted chocolate",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the chocolate and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Triple Chocolate Chunk Cookies",
        "description": "This is how you make peanut butter cookies.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make Triple Chocolate Chunk Cookies.
    </p>
    <ol>
      <li>Mix together the chocolate and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Triple Chocolate Chunk Cookies</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Triple Chocolate Chunk Cookies",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Triple Chocolate Chunk Cookie recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "chocolate, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of melted chocolate",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the chocolate and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Triple Chocolate Chunk Cookies",
        "description": "This is how you make peanut butter cookies.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make Triple Chocolate Chunk Cookies.
    </p>
    <ol>
      <li>Mix together the chocolate and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>
```

#### 肉桂奶油曲奇

    <html>
  <head>
    <title>Snickerdoodles</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Snickerdoodles",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Snickerdoodles recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "cinnamon sugar, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of cinnamon",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the cinnamon and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Snickerdoodles",
        "description": "This is how you make snickerdoodles.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make snickerdoodles.
    </p>
    <ol>
      <li>Mix together the cinnamon and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Snickerdoodles</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Snickerdoodles",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Wendy Darling"
      },
      "datePublished": "2024-03-10",
      "description": "This Snickerdoodles recipe is everyone's favorite",
      "prepTime": "PT10M",
      "cookTime": "PT25M",
      "totalTime": "PT35M",
      "recipeCuisine": "French",
      "recipeCategory": "Cookies",
      "keywords": "cinnamon sugar, cookies",
      "recipeYield": 24,
      "nutrition": {
        "@type": "NutritionInformation",
        "calories": "120 calories"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 5,
        "ratingCount": 18
      },
      "recipeIngredient": [
        "2 cups of cinnamon",
        "1/3 cup of sugar"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "text": "Mix together the cinnamon and sugar."
        },
        {
          "@type": "HowToStep",
          "text": "Roll cookie dough into small balls and place on a cookie sheet."
        },
        {
          "@type": "HowToStep",
          "text": "Bake for 25 minutes."
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Snickerdoodles",
        "description": "This is how you make snickerdoodles.",
        "thumbnailUrl": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "contentUrl": "https://www.example.com/video123.mp4",
        "embedUrl": "https://www.example.com/videoplayer?video=123",
        "uploadDate": "2024-02-05T08:00:00+08:00",
        "duration": "PT1M33S",
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": { "@type": "WatchAction" },
          "userInteractionCount": 2347
        },
        "expires": "2025-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
    <p>
      Here's how to make snickerdoodles.
    </p>
    <ol>
      <li>Mix together the cinnamon and sugar.</li>
      <li>Roll cookie dough into small balls and place on a cookie sheet.</li>
      <li>Bake for 25 minutes.</li>
    </ol>
  </body>
</html>
```

### 一页全包式单一列表

  该列表包含所有轮播界面信息，其中包括每项的完整内容。例如，一个 2020 年的热门电影列表，全部包含在一个页面中。此页面不链接到其他详情页面。

  下面是一个一页全包式单一列表的示例：

<html>
  <head>
    <title>The Best Movies from the Oscars - 2024</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Movie",
            "url": "https://example.com/2024-best-picture-noms#a-star-is-born",
            "name": "A Star Is Born",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-10-05",
            "director": {
                "@type": "Person",
                "name": "Bradley Cooper"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 5
              },
              "author": {
                "@type": "Person",
                "name": "John D."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 90,
                "bestRating": 100,
                "ratingCount": 19141
              }
            }
          },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Movie",
            "name": "Bohemian Rhapsody",
            "url": "https://example.com/2024-best-picture-noms#bohemian-rhapsody",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-11-02",
            "director": {
                "@type": "Person",
                "name": "Bryan Singer"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 3
              },
              "author": {
                "@type": "Person",
                "name": "Vin S."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 61,
                "bestRating": 100,
                "ratingCount": 21985
              }
            }
          },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Movie",
            "name": "Black Panther",
            "url": "https://example.com/2024-best-picture-noms#black-panther",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-02-16",
            "director": {
                "@type": "Person",
                "name": "Ryan Coogler"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 2
              },
              "author": {
                "@type": "Person",
                "name": "Trevor R."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 96,
                "bestRating": 100,
                "ratingCount": 88211
              }
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
    <title>The Best Movies from the Oscars - 2024</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Movie",
            "url": "https://example.com/2024-best-picture-noms#a-star-is-born",
            "name": "A Star Is Born",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-10-05",
            "director": {
                "@type": "Person",
                "name": "Bradley Cooper"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 5
              },
              "author": {
                "@type": "Person",
                "name": "John D."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 90,
                "bestRating": 100,
                "ratingCount": 19141
              }
            }
          },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Movie",
            "name": "Bohemian Rhapsody",
            "url": "https://example.com/2024-best-picture-noms#bohemian-rhapsody",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-11-02",
            "director": {
                "@type": "Person",
                "name": "Bryan Singer"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 3
              },
              "author": {
                "@type": "Person",
                "name": "Vin S."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 61,
                "bestRating": 100,
                "ratingCount": 21985
              }
            }
          },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Movie",
            "name": "Black Panther",
            "url": "https://example.com/2024-best-picture-noms#black-panther",
            "image": "https://example.com/photos/6x9/photo.jpg",
            "dateCreated": "2024-02-16",
            "director": {
                "@type": "Person",
                "name": "Ryan Coogler"
              },
            "review": {
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": 2
              },
              "author": {
                "@type": "Person",
                "name": "Trevor R."
              }
            },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": 96,
                "bestRating": 100,
                "ratingCount": 88211
              }
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

## 指南

为使您的网页能够显示为轮播界面富媒体搜索结果，您必须遵循[搜索要素指南](https://developers.google.com/search/docs/essentials?hl=zh-cn)和[结构化数据常规指南](https://developers.google.com/search/docs/guides/sd-policies?hl=zh-cn)。此外，轮播界面结构化数据还需要遵循以下指南：

- 列表中的所有项必须属于同一类型。例如，如果列表的内容为食谱，请仅添加 Recipe 类型的项。请勿混用不同类型。
- 请确保轮播界面结构化数据是完整的，并包含网页上列出的所有项目。
- 用户可见文字必须与网页上的结构化数据中包含的信息类似。
- 以列表格式显示的项将按 position 属性指定的顺序显示。

## 
  验证和部署结构化数据

1. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码。对于[摘要页面](#summary)，下面列了一些您需要自行验证的事项：

- 确认 itemListElement 包含两个或更多 ListItem 元素。
- 确保所有 ListItem 元素的类型都相同（例如，它们都与食谱有关）。
- 使用富媒体搜索结果测试对列表中提到的每个网址进行验证。列表中的每个网页都必须包含有效的结构化数据，可参阅下列受支持内容类型的相关文档：[食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)、[课程](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)、[餐馆](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#carousel-example)、[影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)。
2. 部署一些包含结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页情形。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
  **注意**：重新抓取和重新编入索引需要一段时间，请耐心等待。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
3. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 不同结构化数据类型的定义

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需的属性。

### ItemList

ItemList 是用于存放列表中所有元素的容器项。如果用在[摘要页面](#summary)上，列表中的所有网址都必须指向同一网域中的不同网页。如果用在[一页全包式列表](#all-in-one)中，所有网址都必须指向托管列表结构化数据的页面上的一个锚标记。

如需了解 ItemList 的完整定义，请访问 [schema.org/ItemList](https://schema.org/ItemList)。

Google 支持的属性如下：

    必要属性

      itemListElement

[ListItem](https://schema.org/ListItem)

包含各个项的列表。如需指定列表，请定义一个包含至少两个 ListItem 元素的 ItemList。所有项都必须为同一类型。详情请参见 
        [ListItem](#list-item)。

### ListItem

ListItem 包含列表中单个项的详细信息。

- 如果这是[摘要页面](#summary)，则应仅在 ListItem 中包含 type、position、url 属性。
- 如果这是**一页全包式列表**，则应包含它描述的数据类型的所有其他 schema.org 属性。支持的数据类型包括：

        [课程](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)
- [影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [餐馆](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#carousel)

如需了解 ListItem 的完整定义，请访问 [schema.org/ListItem](https://schema.org/ListItem)。

#### 
      摘要页面

      以下属性适用于摘要页面：

        必要属性

            position

[Integer](https://schema.org/Integer)

该项在轮播界面中的位置。应为一个数字，从 1 开始。

            url

[URL](https://schema.org/URL)

项详情页面的规范网址。列表中的所有网址都必须是独一无二的，但属于同一网域（与当前网页相同的网域或子网域/超级网域）。

#### 
      全包式页面

      以下属性适用于全包式页面：

        必要属性

            item

[Thing](https://schema.org/Thing)

列表中的单个内容。为此对象填充以下值，以及所描述的特定结构化数据类型的所有属性：

- [item.name](#item-name)
- [item.url](#item-url)
- 此数据类型所需的所有其他属性，请参阅 schema.org 以及内容类型的对应文档中介绍的规则：

          [课程](https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn)
- [影片](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [餐馆](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#carousel)

        示例**：对于食谱，您需要提供 prepTime 和 image 属性。

            item.name

[Text](https://schema.org/Text)

该项的字符串名称。item.name 在轮播界面中显示为单个项的标题。HTML 格式会被忽略。

            item.url

[URL](https://schema.org/URL)

指向页面上相应项的完全限定网址和页面锚标记。网址必须指向当前页面，并且您必须在页面中靠近用户可见文字的位置添加 HTML 锚标记（<a> 标记，也可以是 name 或 id 值）。
        **示例**：https://example.org/recipes/pies#apple_pie。

            position

[Integer](https://schema.org/Integer)

该项在轮播界面中的位置。应为一个数字，从 1 开始。

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