# 结构化数据常规指南 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn

---

  # 结构化数据常规指南

    要想让富媒体搜索结果显示在 Google 搜索结果中，结构化数据不应违反 [Google 搜索的内容政策](https://support.google.com/websearch/answer/10622781?hl=zh-cn)（包括[网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)）。
    此外，本页还详细介绍了适用于所有结构化数据的通用指南：必须遵循这些指南，才能让网站在 Google 搜索中显示为富媒体搜索结果。

    如果网页存在[结构化数据问题](https://support.google.com/webmasters/answer/9044175?hl=zh-cn#spammy-structured-markup)，可能会导致我们采取人工处置措施。结构化数据人工处置措施意味着网页不符合显示为富媒体搜索结果的条件；这不会影响网页在 Google 网页搜索中的排名。
    如需查看我们是否对您的网页采取了人工处置措施，请打开 [Search Console 中的“人工处置措施”报告](https://search.google.com/search-console/manual-actions?hl=zh-cn)。

重要提示：即使[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)显示您的网页已正确地添加标记，Google 也不能保证您的结构化数据一定会显示在搜索结果中**。
      导致此类情况的部分常见原因如下：

- 结构化数据的使用使相应功能可以显示，但并不保证一定会显示。****Google 算法会根据多种可变因素（包括搜索记录、所在位置和设备类型）来确定要显示的搜索结果，以便按照自己的标准为用户打造最佳的搜索体验。在某些情况下，该算法可能会判定某项功能比另一项功能更合适，甚至会判定[文本搜索结果](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result)最合适。
- 结构化数据未[体现网页的主要内容](#relevance)，或可能具有误导性。
- 结构化数据不正确，但富媒体搜索结果测试未能发现该错误。
- [用户看不到](#hidden)结构化数据引用的内容。
- 网页不符合本页所述的结构化数据指南、针对特定结构化数据功能的指南、[搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)或 [Google 搜索的内容政策](https://support.google.com/websearch/answer/10622781?hl=zh-cn)。

## 技术指南

如需测试您的结构化数据是否符合技术指南，您可以使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)和[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)，这两款工具能发现大多数技术错误。

### 格式

为了确保能够显示为富媒体搜索结果，请使用以下[三种支持的格式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#structured-data-format)之一标记您网站的网页：

- JSON-LD（推荐）
- 微数据
- RDFa

### 访问权限

 请勿使用 robots.txt、[noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn) 或任何其他访问控制方法阻止 Googlebot 访问您的结构化数据网页。

## 质量指南

使用自动化工具测试是否符合这些质量指南并不容易。
    违反质量指南可能会导致语法正确的结构化数据无法在 Google 搜索中显示为富媒体搜索结果，还可能导致其被[标记为垃圾内容](https://support.google.com/webmasters/answer/3498001?hl=zh-cn)。

### 内容

- 遵循[适用于 Google 网页搜索的网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)。
- 提供最新信息。对于具有时效性的内容，一旦它们无法再反映最新情况，我们便不会将其显示为富媒体搜索结果。
- 提供您或您的用户生成的原创内容。
- **请勿**标记网页阅览者看不到的内容。例如，如果 JSON-LD 标记介绍了某位表演者，则 HTML 正文必须介绍同一位表演者。
- **请勿**标记无关内容或误导性内容，例如虚假评价或与网页主题无关的内容。
- **请勿**使用结构化数据来欺骗或误导用户。不要冒充任何人员或组织，也不要虚报您的所有者身份、联属关系或主要目的。
- 结构化数据中的内容还必须遵循特定功能指南中所述的附加内容准则或政策。例如，JobPosting 结构化数据中的内容必须遵循[招聘信息内容政策](https://developers.google.com/search/docs/appearance/structured-data/job-posting?hl=zh-cn#content-policies)。

### 相关性

结构化数据必须真实地体现网页内容。下面列举了一些不相关数据的示例：

- 体育赛事直播网站将广播标记为本地活动。
- 木工技艺网站将说明标记为食谱。

### 完整性

- 请指定[您的特定富媒体搜索结果类型对应的文档](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)中列出的所有必需属性。如果内容缺少必要属性，则无法显示为富媒体搜索结果。
- 您提供的建议属性越多，对用户而言，相应结果的品质就越高。例如：用户会首选明确注明薪资（而非未明确注明薪资）的招聘信息，并且更青睐具有真实用户评价和真实星级评分的食谱（请注意，不是由真实用户给出的评价或评分可能会导致[人工处置措施](https://support.google.com/webmasters/answer/3498001?hl=zh-cn)）。富媒体搜索结果的排名会考虑额外的信息。

### 位置

- 请将结构化数据放在要描述的网页上，除非文档另有说明。
- 如果您有包含相同内容的重复网页，建议您在所有重复网页（而不仅仅是规范网页）上放置相同的结构化数据。

### 明确性

- 对于您的标记，请尽量使用 schema.org 定义的最具体的适用类型和属性名称。
- 遵循[您的特定富媒体搜索结果类型对应的文档](https://developers.google.com/search/docs/guides/search-gallery?hl=zh-cn)中提供的所有其他指南。

### 图片

- 将图片指定为结构化数据属性时，请确保图片与图片所在的网页相关。例如，如果定义 NewsArticle 的 image 属性，则图片必须与该新闻报道相关。
- 结构化数据中指定的所有图片网址都必须可抓取且可编入索引。否则，Google 搜索找不到这些网址，也就无法将其显示在搜索结果页中。如需检查 Google 能否访问您的网址，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)。

### 网页上有多个项目

网页上有多个项目是指一个网页上有多种项目。例如，网页可能包含食谱、展示如何按照该食谱制作食物的视频，以及有关用户可以如何发现该食谱的面包屑导航信息。所有这些对用户可见的信息也可以使用结构化数据进行标记，以便 Google 搜索等搜索引擎更轻松地了解网页上的信息。当您添加更多适用于某个网页的项目时，Google 搜索可以更全面地了解该网页的内容，并在不同的搜索功能中显示该网页。

     无论您是嵌套多个项目还是单独指定各个项目，Google 搜索都可以了解网页上的多个项目：

- **嵌套**：存在一个主要项目，并且其他项目在主要项目下分组。对相关项目（例如，同时包含视频和评价的食谱）进行分组时，这种方法特别有用。
- **单独指定各个项目**：每个项目是同一网页上的单独内容块。
      注意：如果将一些项目关联起来对您更有帮助（例如，食谱和视频），请同时在食谱和视频项目中使用 @id，指定该视频与网页上的该食谱相关。如果您没有将这两个项目关联起来，Google 搜索可能不知道可以将该视频显示为食谱富媒体搜索结果。

为简洁起见，这些示例经过精简，并未涵盖相关功能的所有必要和建议属性。如需完整示例，请参阅[特定的结构化数据类型对应的文档](https://developers.google.com/search/docs/guides/search-gallery?hl=zh-cn)。

### 嵌套

      下面是一个嵌套结构化数据的示例，其中 Recipe 是主要项目，aggregateRating 和 video 则嵌套在 Recipe 中。

```
<html>
  <head>
    <title>How To Make Banana Bread</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Banana Bread Recipe",
      "description": "The best banana bread recipe you'll ever find! Learn how to use up all those extra bananas.",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.7,
        "ratingCount": 123
      },
      "video": {
        "@type": "VideoObject",
        "name": "How To Make Banana Bread",
        "description": "This is how you make banana bread, in 5 easy steps.",
        "contentUrl": "https://www.example.com/video123.mp4"
       }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 单独指定各个项目

      以下是单独指定结构化数据的各个项目的示例。其中有 Recipe 和 BreadcrumbList 这两个不同的项目。

```
<html>
  <head>
    <title>How To Make Banana Bread</title>
    <script type="application/ld+json">
    [{
      "@context": "https://schema.org/",
      "@type": "Recipe",
      "name": "Banana Bread Recipe",
      "description": "The best banana bread recipe you'll ever find! Learn how to use up all those extra bananas."
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Recipes",
        "item": "https://example.com/recipes"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Bread recipes",
        "item": "https://example.com/recipes/bread-recipes"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "How To Make Banana Bread"
      }]
    }]
    </script>
  </head>
  <body>
  </body>
</html>
```

#### 
    其他提示

- 为确保 Google 搜索了解网页的主要用途，请包含能体现网页重点内容的主要结构化数据类型。例如，如果网页的主要内容是食谱，请确保除了包含[视频](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn)和[评价](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn)结构化数据，还包含[食谱结构化数据](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)。这样，该网页才有机会出现在多个搜索结果中（食谱富媒体搜索结果、视频搜索结果和评价摘要）。如果该网页仅包含视频结构化数据，Google 搜索就无法充分了解该网页，也就不会另外将其显示为食谱富媒体搜索结果。
- 为确保网页能够充分体现用户可见的内容，请确保所有结构化数据项目都完整无缺。例如，如果您包含多条评价，请务必包含用户可以在网页上看到的所有评价。如果某个网页没有标记网页上的所有评价，那么对于想要根据搜索结果中的网页呈现效果看到所有这些评价的用户，这将会造成误导。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。