# 食谱架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn

---

  # 食谱（Recipe、HowTo、ItemList）结构化数据

使用结构化数据让 Google 了解您的食谱，进而帮助用户找到您的食谱内容。

    有了您提供的评价者评分、烹饪和准备时长以及营养成分等信息，Google 可以更好地了解您的食谱并以有趣的方式呈现给用户。食谱可以显示在 Google 搜索结果和 Google 图片中。

根据您对内容的标记方式，您的食谱可能符合以下食谱增强功能的使用条件：

      食谱增强功能**

        **食谱托管轮播界面**：通过添加 [ItemList 结构化数据](#item-list)，使用户能浏览您的食谱库。

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

下面是一些使用 JSON-LD 代码的食谱示例。

  **注意**：在 Google 搜索结果中的实际显示效果可能会有不同。在富媒体搜索结果测试工具中预览结构化数据，即可查看最新布局。

### Google 搜索上的食谱

下面是一个可在 Google 搜索结果中显示的网页示例。

  <html>
  <head>
    <title>Non-Alcoholic Piña Colada</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Non-Alcoholic Piña Colada",
      "image": [
      "https://example.com/photos/1x1/photo.jpg",
      "https://example.com/photos/4x3/photo.jpg",
      "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Mary Stone"
      },
      "datePublished": "2024-03-10",
      "description": "This non-alcoholic pina colada is everyone's favorite!",
      "recipeCuisine": "American",
      "prepTime": "PT1M",
      "cookTime": "PT2M",
      "totalTime": "PT3M",
      "keywords": "non-alcoholic",
      "recipeYield": "4 servings",
      "recipeCategory": "Drink",
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
        "400ml of pineapple juice",
        "100ml cream of coconut",
        "ice"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "name": "Blend",
          "text": "Blend 400ml of pineapple juice and 100ml cream of coconut until smooth.",
          "url": "https://example.com/non-alcoholic-pina-colada#step1",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step1.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Fill",
          "text": "Fill a glass with ice.",
          "url": "https://example.com/non-alcoholic-pina-colada#step2",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step2.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Pour",
          "text": "Pour the pineapple juice and coconut mixture over ice.",
          "url": "https://example.com/non-alcoholic-pina-colada#step3",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step3.jpg"
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Make a Non-Alcoholic Piña Colada",
        "description": "This is how you make a non-alcoholic piña colada.",
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
        "expires": "2024-02-05T08:00:00+08:00"
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
    <title>Non-Alcoholic Piña Colada</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Non-Alcoholic Piña Colada",
      "image": [
      "https://example.com/photos/1x1/photo.jpg",
      "https://example.com/photos/4x3/photo.jpg",
      "https://example.com/photos/16x9/photo.jpg"
      ],
      "author": {
        "@type": "Person",
        "name": "Mary Stone"
      },
      "datePublished": "2024-03-10",
      "description": "This non-alcoholic pina colada is everyone's favorite!",
      "recipeCuisine": "American",
      "prepTime": "PT1M",
      "cookTime": "PT2M",
      "totalTime": "PT3M",
      "keywords": "non-alcoholic",
      "recipeYield": "4 servings",
      "recipeCategory": "Drink",
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
        "400ml of pineapple juice",
        "100ml cream of coconut",
        "ice"
      ],
      "recipeInstructions": [
        {
          "@type": "HowToStep",
          "name": "Blend",
          "text": "Blend 400ml of pineapple juice and 100ml cream of coconut until smooth.",
          "url": "https://example.com/non-alcoholic-pina-colada#step1",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step1.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Fill",
          "text": "Fill a glass with ice.",
          "url": "https://example.com/non-alcoholic-pina-colada#step2",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step2.jpg"
        },
        {
          "@type": "HowToStep",
          "name": "Pour",
          "text": "Pour the pineapple juice and coconut mixture over ice.",
          "url": "https://example.com/non-alcoholic-pina-colada#step3",
          "image": "https://example.com/photos/non-alcoholic-pina-colada/step3.jpg"
        }
      ],
      "video": {
        "@type": "VideoObject",
        "name": "How to Make a Non-Alcoholic Piña Colada",
        "description": "This is how you make a non-alcoholic piña colada.",
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
        "expires": "2024-02-05T08:00:00+08:00"
       }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 轮播界面

下面是一个包含 [itemList](#item-list) 结构化数据的食谱摘要网页（一个包含食谱列表的网页）示例。此内容可以显示在 Google 搜索结果中的网格内。

  <html>
  <head>
    <title>Grandma's Best Pie Recipes</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://example.com/apple-pie.html"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://example.com/blueberry-pie.html"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "https://example.com/cherry-pie.html"
        }]
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Grandma's Best Pie Recipes</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "url": "https://example.com/apple-pie.html"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "url": "https://example.com/blueberry-pie.html"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "url": "https://example.com/cherry-pie.html"
        }]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 指南

      您的标记必须遵循[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)，才能显示在 Google 搜索结果中。
如果您违反了这些政策，您的食谱可能不会显示为富媒体搜索结果，但您的内容仍会显示在 Google 搜索结果中。了解[垃圾性质的结构化标记](https://support.google.com/webmasters/answer/3498001?hl=zh-cn)。

以下指南适用于 Recipe 结构化数据。

- 只有当内容是关于特定菜肴的制作方式时，才应使用 Recipe 结构化数据。例如，“磨砂膏”或“聚会创意”就不是有效的菜肴名称。
- 要使您的食谱显示在[轮播界面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn)或网格中，您必须遵循以下指南：

        提供 ItemList 结构化数据，为您的列表汇总食谱。您可以单独提供 ItemList 结构化数据，也可以和 Recipe 结构化数据一起提供。
- 您的网站必须有一个摘要网页，其中列出集合内的所有食谱。例如，当用户点击 Google 搜索结果中的摘要链接时，他们便会被正确地定向到您网站上的相应网页，其中列出了与搜索内容相关的食谱。

## 结构化数据类型定义

要使您的内容能够作为富媒体搜索结果显示在 Google 搜索结果中，您必须为相应内容添加必需的属性。您还可添加建议的属性，以便添加与您的内容相关的更多信息，进而提供更好的用户体验。

### Recipe

      请使用 schema.org [Recipe](https://schema.org/Recipe) 类型的以下属性标记食谱内容。如需了解 Recipe 的完整定义，请访问 [schema.org/Recipe](https://schema.org/Recipe)。
      Google 支持的属性如下：

      必要属性

          image

[URL](https://schema.org/URL) 或 [ImageObject](https://schema.org/ImageObject)

菜肴成品图片。

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

          在 Recipe 标记中指定 image 属性不会影响为[文字结果图片](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result-image)选择的图片。
            若要针对文字搜索结果图片进行优化，请遵循[图片搜索引擎优化 (SEO) 最佳实践](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)。

          name

[Text](https://schema.org/Text)

菜肴的名称。

      建议属性

          aggregateRating

[AggregateRating](https://schema.org/AggregateRating)

相应对象所获得的平均评价分数的注解。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看必需和建议的 [AggregateRating 属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregated-rating-type-definition)列表。

如果 Recipe 结构化数据只包含一条评价，那么评价者的名称必须是有效的个人或组织名称。例如，“配料可享 50% 折扣”就不是有效的评价者名称。

          author

[Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

撰写食谱的个人或组织的名称。为了帮助 Google 更好地了解各种功能中的作者，应该遵循[作者标记最佳实践](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn#author-bp)。

          cookTime

[Duration](https://schema.org/Duration)

实际烹饪菜肴所需的时间，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)（如果适用）。

始终与 prepTime 结合使用。

          datePublished

[Date](https://schema.org/Date)

食谱的发布日期，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)（如果适用）。

          description

[Text](https://schema.org/Text)

一段用于描述菜肴的简短摘要。

          keywords

[Text](https://schema.org/Text)

用来描述您的食谱的其他字词，如季节（“夏季”）、假日（“万圣节”）或其他描述词（“快速”、“简单”、“正宗”）。

**其他指南**

- 用英文逗号分隔关键字列表中的多个条目。
- 请勿使用实际为 recipeCategory 或 recipeCuisine 的标记。
                **

不建议**：

```
"keywords": "dessert, American"
```

**建议**：

```
"keywords": "winter apple pie, nutmeg crust"
```

          nutrition.calories

[Energy](https://schema.org/Energy)

使用此食谱制作的每份菜肴所含的卡路里数。如果定义了 nutrition.calories，必须使用份量定义 recipeYield。

          prepTime

              [Duration](https://schema.org/Duration)

准备菜肴的食材和工作区所需的时间，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)（如果适用）。

始终与 cookTime 结合使用。

          recipeCategory

[Text](https://schema.org/Text)

您的食谱是关于三餐中的哪一餐或哪道菜。例如：“晚餐”、“主菜”或“甜点/点心”。

          recipeCuisine

[Text](https://schema.org/Text)

与您的食谱相关的地理区域。例如，“法国菜”、“地中海菜”或“美国菜”。

          recipeIngredient

[Text](https://schema.org/Text)

食谱中用到的配料。

例如：

```
"recipeIngredient": [
  "1 (15 ounce) package double crust ready-to-use pie crust",
  "6 cups thinly sliced, peeled apples (6 medium)",
  "3/4 cup sugar",
  "2 tablespoons all-purpose flour",
  "3/4 teaspoon ground cinnamon",
  "1/4 teaspoon salt",
  "1/8 teaspoon ground nutmeg",
  "1 tablespoon lemon juice"
]
```

**其他指南**：

- 仅添加按食谱烹制菜肴所必需的配料。
- 不要添加无关紧要的信息，如配料的定义。

   recipeInstructions

[HowToStep](https://schema.org/HowToStep)、[HowToSection](https://schema.org/HowToSection) 或 [Text](https://schema.org/Text)

制作菜肴的步骤。

有几个选项可用于设置 recipeInstructions 的值。我们建议使用 HowToStep。当食谱包含多个部分时，您还可以利用 HowToSection 将 HowToStep 分组。

- **HowToStep**：使用 HowToStep 指定食谱的步骤。

```
"recipeInstructions": [
  {
    "@type": "HowToStep",
    "name": "Preheat",
    "text": "Heat oven to 425°F.",
    "url": "https://example.com/recipe#step1",
    "image": "https://example.com/photos/recipe/step1.jpg"
  }, {
    "@type": "HowToStep",
    "name": "Prepare crust",
    "text": "Place 1 pie crust in ungreased 9-inch glass pie plate, pressing firmly against side and bottom.",
    "url": "https://example.com/recipe#step2",
    "image": "https://example.com/photos/recipe/step2.jpg"
  }, {
    "@type": "HowToStep",
    "name": "Make filling",
    "text": "In large bowl, gently mix filling ingredients; spoon into crust-lined pie plate.",
    "url": "https://example.com/recipe#step3",
    "image": "https://example.com/photos/recipe/step3.jpg"
  }, {
    "@type": "HowToStep",
    "name": "Cover",
    "text": "Top with second crust. Cut slits or shapes in several places in top crust.",
    "url": "https://example.com/recipe#step4",
    "image": "https://example.com/photos/recipe/step4.jpg"
  }, {
    "@type": "HowToStep",
    "name": "Bake",
    "text": "Bake 40 to 45 minutes. The pie is ready when the apples are tender and the crust is golden brown.",
    "url": "https://example.com/recipe#step5",
    "image": "https://example.com/photos/recipe/step5.jpg"
  }, {
    "@type": "HowToStep",
    "name": "Cool",
    "text": "Cool on cooling rack at least 2 hours before serving.",
    "url": "https://example.com/recipe#step6",
    "image": "https://example.com/photos/recipe/step6.jpg"
  }
]
```
- **HowToSection（仅当食谱包含多个部分时）**：用于将步骤组合成多个部分。有关示例，请参见 [HowToSection](#how-to-section)。
- **单个或重复的文本属性**：包含一个或多个步骤的文本块。Google 会将所有步骤视为在一个部分中。重复的属性值会连接成一个文本块。然后，Google 会尝试自动将这个文本块拆分为多个步骤。Google 会尝试查找并移除所有部分名称、步骤编号、关键字以及其他所有可能会错误地显示在食谱步骤文本中的内容。为获得最佳效果，我们建议您使用 [HowToStep](#how-to-step) 明确指定步骤。

```
"recipeInstructions": [
  "In large bowl, gently mix filling ingredients; spoon into crust-lined pie
plate. Top with second crust. Cut slits or shapes in several places in top
crust. Bake 40 to 45 minutes. The pie is ready when the or until apples are
tender and the crust is golden brown. Cool on cooling rack at least 2 hours
before serving."
]
```

**其他指南**

- 不要添加应在别处使用的元数据。尤其是，应使用 author 属性指定作者，使用 recipeCuisine 属性指定菜系，使用 recipeCategory 属性指定类别，并使用 keywords 属性指定其他关键字。
- 只能添加与如何按照食谱烹制菜肴相关的文本，不能添加其他文本（如“指导”、“观看视频”或“第 1 步”）。请在结构化数据以外指定这些词组。
**不建议**：

```
"recipeInstructions": [{
  "@type": "HowToStep",
  "text": "Step 1. Heat oven to 425°F."
}]
```

**建议**：

```
"recipeInstructions": [{
  "@type": "HowToStep",
  "text": "Heat oven to 425°F."
}]
```

          recipeYield

[Text](https://schema.org/Text) 或 [Integer](https://schema.org/Integer)

食谱的份量（如果适用）。您可以使用纯数字指定此食谱制作出的份量。如果您想使用其他单位（例如食物数量），可以添加其他份量信息。如果您指定了每份菜肴的任何营养信息（例如 nutrition.calories），这就是必需的属性。

示例

```
"recipeYield": [
  "6",
  "24 cookies"
]
```

          totalTime

[Duration](https://schema.org/Duration)

准备和烹饪菜肴所需的总时间，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)（如果适用）。

使用 totalTime，或者将 cookTime 与 prepTime 搭配使用。

        video

      [VideoObject](https://schema.org/VideoObject)

          一段视频，描述菜肴的烹制步骤。需遵循必需和建议的[视频属性](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#video-object)的列表。

### HowToSection

    大多数食谱不包含部分。首先将食谱说明拆分成 HowToStep 属性，如果需要额外指定步骤部分，则仅添加 HowToSection。

使用 HowToSection 对一系列步骤（或子部分）进行分组，它们构成了食谱说明的一部分。直接在 recipeInstructions 属性的定义内指定 HowToSection，或指定为另一个 HowToSection 的 itemListElement。

HowToSection 类型用于定义单个食谱的一部分，可包含一个或多个步骤。不得使用 HowToSection 定义同一菜肴的不同食谱，而是要将 HowToSection 用作单个食谱的一部分。如需列举菜肴的多个食谱，请使用多个 Recipe 对象。例如，对于制作苹果派的多种方法，请将它们列为多个 Recipe 对象，而不是 HowToSection 对象。

如需了解 HowToSection 的完整定义，请访问 [schema.org/HowToSection](https://schema.org/HowToSection)。

      必要属性

        itemListElement

      [HowToStep](#how-to-step)

部分和/或子部分的详细步骤列表。例如，在某道披萨食谱中，可能有一个部分会介绍披萨皮制作步骤，有一个部分会介绍馅料准备步骤，还有一个部分会介绍拌匀和烘焙步骤。

示例：

```
{
  "@type": "HowToSection",
  "name": "Assemble the pie",
  "itemListElement": [
    {
      "@type": "HowToStep",
      "text": "In large bowl, gently mix filling ingredients; spoon into crust-lined pie plate."
    }, {
      "@type": "HowToStep",
      "text": "Top with second crust. Cut slits or shapes in several places in top crust."
    }
  ]
}
```

        name

      [Text](https://schema.org/Text)

相应部分的名称。

### HowToStep

使用 HowToStep 对一个或多个句子进行分组，它们介绍了如何完成食谱的某个部分（如果这适用于您的内容）。使用句子定义 text 属性，或者使用 HowToDirection 或 HowToTip 为每个句子定义 itemListElement。

使用 [HowToStep](https://schema.org/HowToStep) 类型的以下属性标记食谱步骤。直接在 recipeInstructions 属性的定义内指定 HowToStep，或指定为 HowToSection 的 itemListElement。

如需了解 HowToStep 的完整定义，请访问 [schema.org/HowToStep](https://schema.org/HowToStep)。

      必要属性

        itemListElement

      [HowToDirection](https://schema.org/HowToDirection) 或 [HowToTip](https://schema.org/HowToTip)

详细子步骤列表，包括指导或提示。

如果使用了 text，则该属性为可选属性。

        text

      [Text](https://schema.org/Text)

相应步骤的完整说明文字。

如果使用了 itemListElement，则该属性为可选属性。其他指南：

- 只能添加说明文本，不能添加其他文本（如“指导”、“观看视频”或“第 1 步”）。请在标记的属性以外指定这些词组。
            **

不建议**：

```
{
  "@type": "HowToStep",
  "text": "Step 1. Heat oven to 425°F."
}
```

**建议**：

```
{
  "@type": "HowToStep",
  "text": "Heat oven to 425°F."
}
```

      建议属性

        image

      [ImageObject](https://schema.org/ImageObject) 或 [URL](https://schema.org/URL)

          相应步骤的图片。其他图片指南：

- 图片网址必须[可抓取且可编入索引](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps?hl=zh-cn)。
- 图片必须代表已标记的内容。
- 图片格式必须为 .jpg、.png 或 .gif。

        name

      [Text](https://schema.org/Text)

          相应步骤的总结性字词或短语（例如“排列馅饼皮”）。请勿使用非描述性文字（例如“第 1 步：[文字]”）或其他形式的步骤编号（例如“1. [文字]”）。

        url

      [URL](https://schema.org/URL)

          一个可直接链接到相应步骤的 URL（如有），例如锚链接片段。

        video

      [VideoObject](https://schema.org/VideoObject) 或 [Clip](https://schema.org/Clip)

 相应步骤的视频或视频剪辑。

如果使用 [VideoObject](https://schema.org/VideoObject)，则位于必需和建议的 [Video](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#type-definitions) 属性或 [Clip](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#clip) 属性列表后面。

### HowToDirection 和 HowToTip

HowToDirection 和 HowToTip 用于描述指导或提示（如果适用）。这两者具有相同的必需属性和建议属性。

如需了解 HowToDirection 和 HowToTip 的完整定义，请访问 [schema.org/HowToDirection](https://schema.org/HowToDirection) 和 [schema.org/HowToTip](https://schema.org/HowToTip)。

      必要属性

        text

      [Text](https://schema.org/Text)

相应指导或提示的文字。

### ItemList

除了 [Recipe 属性](#recipe-properties)之外，您还可为托管专用列表添加以下属性。虽然 ItemList 不是必需的，但如果您希望食谱能够显示在托管方陈列界面中，则必须添加以下属性。如需详细了解托管轮播界面，请参阅 [Carousel](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn)。

如需了解 ItemList 的完整定义，请访问 [schema.org/ItemList](https://schema.org/ItemList)。

      必要属性

          itemListElement

[ListItem](https://schema.org/ListItem)

列表中单个食谱网页的注释。

          ListItem.position

[Integer](https://schema.org/Integer)

列表中相应食谱网页的序数位置。例如：

```

"itemListElement": [
  {
    "@type": "ListItem",
    "position": 1,
  }, {
    "@type": "ListItem",
    "position": 2,
  }
]

```

          ListItem.url

[URL](https://schema.org/URL)

项目网页的规范网址。每个项目都必须具备一个独一无二的网址。

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