# 结构化数据标记的运作方式简介 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn

---

  # Google 搜索中的结构化数据标记简介

Google 搜索会尽力了解网页内容。您可以在网页上添加结构化数据，向 Google 提供有关该网页含义的明确线索，从而帮助我们理解该网页。结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式；例如，食谱网页上会有食材、烹饪时长和温度、卡路里等各类信息。

## 为什么要向网页添加结构化数据？

添加结构化数据可让您获得对用户更有吸引力的搜索结果，并可能会鼓励用户与您的网站进行更多互动，这就是富媒体搜索结果**。
        以下是一些为网站实现了结构化数据的案例研究：

- Rotten Tomatoes 为 10 万个独特网页添加了结构化数据。衡量结果表明，采用结构化数据的网页在点击率方面比不含结构化数据的网页高 25%。
- Food Network 已将其 80% 的网页转换为启用搜索结果功能，结果访问量增加了 35%。
- Rakuten 发现，用户在已实现结构化数据的网页上花费的时间是在不含结构化数据的网页上的 1.5 倍，且在包含搜索结果功能的 AMP 网页上的互动率是在不含相应功能的 AMP 网页上的 3.6 倍。
- 雀巢公司经过衡量发现，在搜索结果中显示为富媒体搜索结果的网页所获的点击率比不显示为富媒体搜索结果的网页高 82%。

      请参阅[有关实现结构化数据的网站的案例研究](https://developers.google.com/search/case-studies?hl=zh-cn)。

## 结构化数据在 Google 搜索中的运作方式

Google 会利用在网络上找到的结构化数据来了解网页内容并收集有关网络和世界的一般信息，例如标记中关于人物、图书或公司的信息。例如，当食谱网页包含 [JSON-LD](https://json-ld.org) 结构化数据（描述食谱的标题、作者和其他详情）时，Google 搜索可以使用这些信息显示食谱的富媒体搜索结果：

由于结构化数据可标识食谱的各个元素，因此用户可按食材、卡路里数、烹饪时长等条件搜索食谱。

如果您使用了 Wix、WordPress 或 Shopify 等 CMS**，可能无法直接修改 HTML。您的 CMS 可能具有搜索引擎设置页面，或者也许您可以安装一个可让您指定结构化数据的插件。搜索有关向您的 CMS 添加结构化数据的说明（例如，搜索“Wix 结构化数据”或“WordPress 结构化数据插件”）。

在编写结构化数据时，应使用信息所属网页上的页内标记。
  该网页上的结构化数据描述的是该网页的内容。不要仅为了容纳结构化数据而创建空白网页；也不要添加与用户无法看到的信息相关的结构化数据（即使这些信息准确无误）。若要了解更多技术和质量指南，请参阅[结构化数据常规指南](https://developers.google.com/search/docs/guides/sd-policies?hl=zh-cn)。

[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)是一种简单实用的工具，可用于验证结构化数据；在某些情况下，还可用于预览 Google 搜索中的功能。不妨试试：

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

## 结构化数据词汇表和格式

本文档介绍了结构化数据的必需属性、推荐属性或可选属性分别是哪些，这些属性对 Google 搜索有特殊含义。大多数 Google 搜索结构化数据使用 [schema.org](https://schema.org/) 词条，但是就 Google 搜索的行为而言，Google 搜索中心文档才是最终参考指南，请忽略 schema.org 文档。schema.org 上有很多属性和对象对 Google 搜索而言并非必要属性和对象，但它们可能对其他搜索引擎、服务、工具和平台来说很有用。

Data-vocabulary.org 标记已不再适用于 Google 富媒体搜索结果功能。详细了解[即将停止支持 data-vocabulary](https://developers.google.com/search/blog/2020/01/data-vocabulary?hl=zh-cn) 这一变动。

请务必在开发期间使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)检查您的结构化数据，并在部署后使用[“富媒体搜索结果状态”报告](https://support.google.com/webmasters/answer/7552505?hl=zh-cn)监控网页的有效性，因为这些网页在部署后可能会因模板或呈现方面的问题而发生故障。

如需让某个对象在 Google 搜索结果中出现时具有增强的显示效果，您必须为该对象添加所有的必需属性。一般来说，采用的推荐功能越多，您的信息就越有可能在 Google 搜索结果中出现时具有增强的显示效果。
      **不过**，更重要的是要提供数量较少但完整无误的推荐属性，而不要尝试提供所有可能的建议属性，但是数据不够完整、格式有误或不够准确。

除了本文所述的属性和对象之外，Google 还可以广泛使用 [sameAs](https://schema.org/sameAs) 属性和其他 [schema.org](https://schema.org/) 结构化数据。如果我们觉得某些元素很有用，未来将会利用它们发布新的搜索功能。

### 
  支持的格式

  除非另有说明，否则 Google 搜索支持以下格式的结构化数据。
  一般而言，我们建议您使用最易于实现和维护的格式（在大多数情况下是 JSON-LD）；只要标记有效且已按照功能的说明文档正确实现，那么 3 种格式对 Google 来说都没问题。

    格式

    [JSON-LD](https://json-ld.org/)***（推荐）**
    嵌入 HTML 网页 <head> 和 <body> 元素的 <script> 标记中的 JavaScript 表示法。此标记不与用户可见文本交错显示，使嵌套数据项更易于表达，例如，Event>MusicVenue>PostalAddress>Country。
          此外，Google 可以读取通过 JavaScript 代码或内容管理系统中的嵌入式微件等[动态注入网页内容](https://developers.google.com/search/docs/guides/generate-structured-data-with-javascript?hl=zh-cn)的 JSON-LD 数据。

    [微数据](https://html.spec.whatwg.org/multipage/microdata.html#microdata)
    一种开放社区 HTML 规范，用于在 HTML 内容中嵌套结构化数据。与 RDFa 一样，它会使用 HTML 标记属性为您想以结构化数据形式显示的属性命名。它通常用在 <body> 元素中，但也可用在 <head> 元素中。

    [RDFa](https://rdfa.info/)
    一种 HTML5 扩展功能，通过引入与您要向搜索引擎描述的用户可见内容对应的 [HTML 标记属性](https://www.w3.org/TR/rdfa-lite/#the-attributes)来支持关联的数据。RDFa 通常用在 HTML 网页的 <head> 和 <body> 部分中。

通常，如果网站的设置允许，Google 建议对结构化数据使用 JSON-LD，因为这是网站所有者大规模实现和维护的最简单解决方案（换言之，不容易遇到用户错误）。

## 结构化数据指南

请务必遵循[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)以及任何与您所用的结构化数据类型相关的指南，否则您的结构化数据可能无法在 Google 搜索中显示为富媒体搜索结果。

## 结构化数据使用入门

如果您不熟悉结构化数据，请查看 [schema.org 结构化数据新手指南](https://schema.org/docs/gs.html)。虽然本指南重点介绍微数据，但这些基本概念也适用于 JSON-LD 和 RDFa。

  熟悉结构化数据的基础知识后，请浏览 [Google 搜索中的结构化数据功能列表](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)，然后选择一项功能来实现。每种指南都会详细介绍如何实现结构化数据，以确保您的网站在 Google 搜索中能显示富媒体搜索结果。

[选择功能](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)

## 衡量结构化数据的效果

您可能想将包含结构化数据的网页的效果与不含结构化数据的网页的效果进行比较，从而判断是否值得花费精力包含结构化数据。为此，最好的办法就是[在您网站中的几个网页上运行使用前和使用后测试](https://developers.google.com/search/docs/crawling-indexing/website-testing?hl=zh-cn)。这可能会有点棘手，因为单个网页的网页浏览量可能会因各种原因而不尽相同。

1. 在网站上选择一些未使用任何结构化数据并且已经在 Search Console 中有几个月数据的网页。请务必选择在内容上不受季节性或时效性影响的网页；请使用一些虽然不会发生大幅变化但其热门程度仍能吸引足够多的阅读量的网页，以便生成有意义的数据。
2. 将结构化数据或其他功能添加到您的网页中。用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)检查您的网页，确认标记有效，并且 Google 已发现您的结构化数据。
3. 在[效果报告](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#by_search_appearance)中记录几个月的效果数据，并按网址进行过滤，即可比较网页效果。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。