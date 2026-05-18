# 问答页面 (QAPage) 的架构 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/qapage?hl=zh-cn

---

  # 问答 (QAPage) 结构化数据

问答网页是包含问答格式数据（先列出一个问题，后跟相应的答案）的网页。对于表示问题及相应答案的内容，您可以使用 [
  schema.org](https://schema.org/) QAPage、Question 和 Answer 类型标记数据。

如果您正确标记了网页，Google 就会在搜索结果页上为其显示富媒体搜索结果。这种富媒体搜索结果处理方式有助于您的网站通过 Google 搜索覆盖合适的用户。
  例如，如果用户查询“如何取出卡在 USB 端口中的数据线？”，而提供此问题答案的网页已加上标记，就可能会显示该查询的富媒体搜索结果。

  除了能够使系统对您的内容采用富媒体搜索结果处理方式之外，标记问答网页还有助于 Google 为该网页生成更好的[摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)。如果未显示富媒体搜索结果，那么答案的内容可能会出现在基本搜索结果中。

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

以下标记示例包括 JSON-LD 格式的 QAPage、Question 和 Answer 类型定义：

    JSON-LD
    <html>
  <head>
    <title>How many ounces are there in a pound?</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "QAPage",
      "mainEntity": {
        "@type": "Question",
        "name": "How many ounces are there in a pound?",
        "text": "I have taken up a new interest in baking and keep running across directions in ounces and pounds. I have to translate between them and was wondering how many ounces are in a pound?",
        "answerCount": 3,
        "upvoteCount": 26,
        "datePublished": "2024-02-14T15:34-05:00",
        "author": {
          "@type": "Person",
          "name": "Mary Stone",
          "url": "https://example.com/profiles/mary-stone"
        },
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1 pound (lb) is equal to 16 ounces (oz).",
          "image": "https://example.com/images/conversion-chart.jpg",
          "upvoteCount": 1337,
          "url": "https://example.com/question1#acceptedAnswer",
          "datePublished": "2024-02-14T16:34-05:00",
          "author": {
            "@type": "Person",
            "name": "Julius Fernandez",
            "url": "https://example.com/profiles/julius-fernandez"
          }
        },
        "suggestedAnswer": [
          {
            "@type": "Answer",
            "text": "Are you looking for ounces or fluid ounces? If you are looking for fluid ounces there are 15.34 fluid ounces in a pound of water.",
            "upvoteCount": 42,
            "url": "https://example.com/question1#suggestedAnswer1",
            "datePublished": "2024-02-14T15:39-05:00",
            "author": {
              "@type": "Person",
              "name": "Kara Weber",
              "url": "https://example.com/profiles/kara-weber"
            },
            "comment": {
              "@type": "Comment",
              "text": "I'm looking for ounces, not fluid ounces.",
              "datePublished": "2024-02-14T15:40-05:00",
              "author": {
                "@type": "Person",
                "name": "Mary Stone",
                "url": "https://example.com/profiles/mary-stone"
              }
            }
          }, {
            "@type": "Answer",
            "text": " I can't remember exactly, but I think 18 ounces in a lb. You might want to double check that.",
            "upvoteCount": 0,
            "url": "https://example.com/question1#suggestedAnswer2",
            "datePublished": "2024-02-14T16:02-05:00",
            "author": {
              "@type": "Person",
              "name": "Joe Cobb",
              "url": "https://example.com/profiles/joe-cobb"
            }
          }
        ]
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
    <title>How many ounces are there in a pound?</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "QAPage",
      "mainEntity": {
        "@type": "Question",
        "name": "How many ounces are there in a pound?",
        "text": "I have taken up a new interest in baking and keep running across directions in ounces and pounds. I have to translate between them and was wondering how many ounces are in a pound?",
        "answerCount": 3,
        "upvoteCount": 26,
        "datePublished": "2024-02-14T15:34-05:00",
        "author": {
          "@type": "Person",
          "name": "Mary Stone",
          "url": "https://example.com/profiles/mary-stone"
        },
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "1 pound (lb) is equal to 16 ounces (oz).",
          "image": "https://example.com/images/conversion-chart.jpg",
          "upvoteCount": 1337,
          "url": "https://example.com/question1#acceptedAnswer",
          "datePublished": "2024-02-14T16:34-05:00",
          "author": {
            "@type": "Person",
            "name": "Julius Fernandez",
            "url": "https://example.com/profiles/julius-fernandez"
          }
        },
        "suggestedAnswer": [
          {
            "@type": "Answer",
            "text": "Are you looking for ounces or fluid ounces? If you are looking for fluid ounces there are 15.34 fluid ounces in a pound of water.",
            "upvoteCount": 42,
            "url": "https://example.com/question1#suggestedAnswer1",
            "datePublished": "2024-02-14T15:39-05:00",
            "author": {
              "@type": "Person",
              "name": "Kara Weber",
              "url": "https://example.com/profiles/kara-weber"
            },
            "comment": {
              "@type": "Comment",
              "text": "I'm looking for ounces, not fluid ounces.",
              "datePublished": "2024-02-14T15:40-05:00",
              "author": {
                "@type": "Person",
                "name": "Mary Stone",
                "url": "https://example.com/profiles/mary-stone"
              }
            }
          }, {
            "@type": "Answer",
            "text": " I can't remember exactly, but I think 18 ounces in a lb. You might want to double check that.",
            "upvoteCount": 0,
            "url": "https://example.com/question1#suggestedAnswer2",
            "datePublished": "2024-02-14T16:02-05:00",
            "author": {
              "@type": "Person",
              "name": "Joe Cobb",
              "url": "https://example.com/profiles/joe-cobb"
            }
          }
        ]
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html>
<body itemscope itemtype="https://schema.org/QAPage">
<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
   <h2 itemprop="name">How many ounces are there in a pound?</h2>
   <div itemprop="upvoteCount">52</div>
   <div itemprop="text">I have taken up a new interest in baking and keep running across directions in ounces and pounds. I have to translate between them and was wondering how many ounces are in a pound?</div>
<div>
    <div><span itemprop="answerCount">3</span> answers</div>
    <div><span itemprop="upvoteCount">26</span> votes</div>
    <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">1337</div>
       <div itemprop="text">
       1 pound (lb) is equal to 16 ounces (oz).
       </div>
      <a itemprop="url" href="https://example.com/question1#acceptedAnswer">Answer Link</a>
      </div>
    <div itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">42</div>
       <div itemprop="text">
       Are you looking for ounces or fluid ounces? If you are looking for fluid ounces there are 15.34 fluid ounces in a pound of water.
       </div>
       <a itemprop="url" href="https://example.com/question1#suggestedAnswer1">Answer Link</a>
     </div>
     <div itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">0</div>
       <div itemprop="text">
       I can't remember exactly, but I think 18 ounces in a lb. You might want to double check that.
       </div>
       <a itemprop="url" href="https://example.com/question1#suggestedAnswer2">Answer Link</a>
    </div>
</div>
</div>
</body>
</html>

```
<html>
<body itemscope itemtype="https://schema.org/QAPage">
<div itemprop="mainEntity" itemscope itemtype="https://schema.org/Question">
   <h2 itemprop="name">How many ounces are there in a pound?</h2>
   <div itemprop="upvoteCount">52</div>
   <div itemprop="text">I have taken up a new interest in baking and keep running across directions in ounces and pounds. I have to translate between them and was wondering how many ounces are in a pound?</div>
<div>
    <div><span itemprop="answerCount">3</span> answers</div>
    <div><span itemprop="upvoteCount">26</span> votes</div>
    <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">1337</div>
       <div itemprop="text">
       1 pound (lb) is equal to 16 ounces (oz).
       </div>
      <a itemprop="url" href="https://example.com/question1#acceptedAnswer">Answer Link</a>
      </div>
    <div itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">42</div>
       <div itemprop="text">
       Are you looking for ounces or fluid ounces? If you are looking for fluid ounces there are 15.34 fluid ounces in a pound of water.
       </div>
       <a itemprop="url" href="https://example.com/question1#suggestedAnswer1">Answer Link</a>
     </div>
     <div itemprop="suggestedAnswer" itemscope itemtype="https://schema.org/Answer">
       <div itemprop="upvoteCount">0</div>
       <div itemprop="text">
       I can't remember exactly, but I think 18 ounces in a lb. You might want to double check that.
       </div>
       <a itemprop="url" href="https://example.com/question1#suggestedAnswer2">Answer Link</a>
    </div>
</div>
</div>
</body>
</html>
```

## 指南

若要让 Google 对您的问答网页采用这种富媒体搜索结果处理方式，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [内容指南](#content-guidelines)

### 内容指南

- 仅当网页包含的信息采用问答格式（即先列出一个问题，后跟相应的答案）时，才能使用 QAPage 标记。
- 必须允许用户提交问题的答案。如果给定的问题只有 1 条答案，并且不支持用户提交备选答案，请不要对内容使用 QAPage 标记；在这种情况下应改用 [FAQPage](https://developers.google.com/search/docs/appearance/structured-data/faqpage?hl=zh-cn)。以下是一些示例：

**有效用例**：

        一个论坛网页，用户可以在该网页上提交单个问题的答案
- 一个产品支持网页，用户可以在该网页上提交单个问题的答案

无效用例**：

- 由网站本身编写的一个常见问题解答网页，用户无法在该网页上提交备选答案
- 一个产品页面，用户可以在这个页面上提交多个问题和答案
- 一份旨在回答问题的方法指南
- 一篇旨在回答问题的博文
- 一篇旨在回答问题的文章

  如果并非所有内容都符合条件，请不要将 QAPage 标记应用于网站或论坛上的所有网页。例如，某个论坛可能发布了许多问题，并且这些问题分别都符合该标记的条件，不过，如果该论坛也有一些网页中的内容不是问题，那么这些网页就不符合条件。
  不要对常见问题解答页或每页有多个问题的网页使用 QAPage 标记。QAPage 标记适用于重点论述单个问题以及相应答案的网页。
  不要将 QAPage 标记用于广告目的。
  确保每个 Question 包含完整的问题内容，并确保每个 Answer 包含完整的答案内容。
  Answer 标记适用于问题的答案，而不适用于对问题的评论或对其他答案的评论。请改为对此类内容使用 comment 属性和 Comment 类型。
  如果问题和答案包含以下任何类型的内容，那么它们可能不会显示为富媒体搜索结果：淫秽、亵渎、露骨色情、血腥暴力、宣传危险/违法活动，或仇恨性/骚扰性语言。
  [知识问答网页](https://developers.google.com/search/docs/appearance/structured-data/education-qa?hl=zh-cn)（这些网页侧重于为用户提交的家庭作业问题提供正确的答案）可能符合问答轮播界面体验的条件。这些网页可能只有由内部专家（而非用户）提供或选择的单个答案。**
    示例**：一个教育网页，用户在该网页上提交了单个问题，专家选择了最佳答案。

## 结构化数据类型定义

本部分介绍了与 QAPage 相关的结构化数据类型。

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需的属性。您还可添加建议的属性，以便向结构化数据添加更多信息，进而提供更好的用户体验。

您可以使用 Google 的[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)工具验证和预览结构化数据。

### QAPage

QAPage 类型表示网页重点论述了某个特定问题以及相应的答案。我们只会使用带有 QAPage 标记的网页中的 Question 结构化数据。每个网页只能有一个 QAPage 类型定义。

如需了解 QAPage 的完整定义，请访问 [https://schema.org/QAPage](https://schema.org/QAPage)。

下表介绍了 Google 搜索使用的 QAPage 类型的属性。

      必要属性

### 
        mainEntity

      [Question](#question)

相应网页的 Question 必须嵌套在 QAPage 项目的 mainEntity 属性下。

### Question

Question 类型定义了相应网页回答的问题，并且包含该问题的答案（如果有）。网页上应只有 1 个 Question 类型，并且它应嵌套在 schema.org/QAPage 的 mainEntity 属性下。每个网页必须只有 1 个 Question 类型定义。

如果您的网站不支持某个建议的属性，请从结构化数据中省略该属性。

如需了解 Question 的完整定义，请访问 [https://schema.org/Question](https://schema.org/Question)。 Google 支持的属性如下：

      必要属性

### answerCount

      [Integer](https://schema.org/Integer)

对问题的回答总数。例如，如果有 15 条回答，但由于分页而仅标记了前 10 条，此值将为 15。对于没有答案的问题，此值也可能为 0。answerCount +
            commentCount 应等于任何类型的回复总数。

      值为 acceptedAnswer 或 suggestedAnswer
      [Answer](https://schema.org/Answer)

要显示为富媒体搜索结果，问题必须有至少 1 条答案 - acceptedAnswer 或 suggestedAnswer。不过，问题在刚发布时可能没有答案。对于没有答案的问题，请将 answerCount 属性设为 0。没有答案的问题无法显示为富媒体搜索结果。

### acceptedAnswer

            [Answer](https://schema.org/Answer)

问题的最佳答案。每个问题可有零条或多条此类回答。它必须代表您的网站在一定程度上接纳的回答。例如，被提问者、版主或投票系统接纳为最佳回答。不得通过其他排序形式（如按时间由近到远）确定最佳答案。

### suggestedAnswer

            [Answer](https://schema.org/Answer)

1 条可能的答案，但未被接受为最佳答案 (acceptedAnswer)。每个问题可有零条或多条此类答案。

### name

      [Text](https://schema.org/Text)

简短形式的问题的完整内容。例如，“一量杯是几茶匙的量？”。

    建议属性

### author

      [Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

问题作者的相关信息。为了帮助 Google 更好地了解各种功能中的作者，建议您遵循[作者标记最佳实践](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn#author-bp)。

请参考[文章](https://developers.google.com/search/docs/appearance/structured-data/articl?hl=zh-cn#article-types)和[个人资料页面](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)结构化数据中受支持的属性，然后包含尽可能多的合理作者属性。

### author.url

[URL](https://schema.org/URL)

可唯一标识问题作者的网页链接，该网页很有可能是问答网站的个人资料页面。我们建议您使用[个人资料页面结构化数据](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)标记该网页。

      comment

[Comment](https://schema.org/Comment)

与问题相关的评论（如果存在）。理想情况下，此类内容不是答案，通常是关于问题的说明或讨论。

      commentCount

[Integer](https://schema.org/Integer)

与相应问题相关的评论数量（如果适用）。answerCount +
            commentCount 应等于任何类型的回复总数。

      dateModified

[DateTime](https://schema.org/DateTime)

修改答案的日期和时间（如果适用），采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

      datePublished

[DateTime](https://schema.org/DateTime)

问题的发布日期和时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

      digitalSourceType

[IPTCDigitalSourceEnumeration](https://schema.org/IPTCDigitalSourceEnumeration)

digitalSourceType 属性用于指明与内容关联的数字来源类型（如适用）。此属性在辨别人工创作内容与 AI 或其他机器生成内容时尤为关键。Google 支持以下值：

- TrainedAlgorithmicMediaDigitalSource：表示由经过训练的模型（例如 LLM）创建的内容。
- AlgorithmicMediaDigitalSource：表示通过更简单的算法流程（例如自动回复机器人）创建的内容。

如果未指定此属性，Google 会假定内容是由人工生成的。

      image

[ImageObject](https://schema.org/ImageObject) 或 [URL](https://schema.org/URL)

问题中的任何内嵌图片（如果适用）。 如果没有任何图片，请勿在此字段中添加默认图片、图标、占位符图片或作者图片。

### text

      [Text](https://schema.org/Text)

详细问题的完整内容。例如，“我正在做饭，我需要知道杯子里放几茶匙的量。一量杯是几茶匙的量？”

### upvoteCount

      [Integer](https://schema.org/Integer)

相应问题已得到的投票总数。如果网页支持顶和踩，则应将 upvoteCount 值设为一个表示顶和踩相加抵消后的总值。例如，如果有 5 个顶和 2 个踩，则 upvoteCount 的总值为 3。如果有 5 个顶，且不支持踩，则 upvoteCount 的值为 5。

      video

[VideoObject](https://schema.org/VideoObject)

问题中的任何内嵌视频（如果适用）。

### Answer

Answer 类型定义了相应网页上的 Question 的建议答案和被接纳的答案。您可以在 Question 中将 Answers 定义为 suggestedAnswer 和 acceptedAnswer 属性的值。

下表介绍了 Question 中使用的 Answer 类型的属性。

如需了解 Answer 的完整定义，请访问 [https://schema.org/Answer](https://schema.org/Answer)。

如果您的网站不支持某个建议的属性，请从结构化数据中省略该属性。

    必要属性

### text

    [Text](https://schema.org/Text)

回答的完整内容。如果只标记了一部分，则可能不会显示您的内容，因为 Google 无法确定显示哪些内容最为恰当。

      建议属性

### author

      [Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

答案作者的相关信息。为了帮助 Google 更好地了解各种功能中的作者，建议您遵循[作者标记最佳实践](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn#author-bp)。

请查看[文章](https://developers.google.com/search/docs/appearance/structured-data/articl?hl=zh-cn#article-types)和[个人资料页面](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)结构化数据中有哪些受支持的属性，然后包含尽可能多的合理作者属性。

### author.url

[URL](https://schema.org/URL)

可唯一标识回答作者的网页链接，该网页很有可能是问答网站的个人资料页面。我们建议您使用[个人资料页面结构化数据](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)标记该网页。

      comment

[Comment](https://schema.org/Comment)

与答案相关的评论，通常是关于答案的说明或讨论（如果适用）。

      commentCount

[Integer](https://schema.org/Integer)

有关相应回答的评论数量（如果适用）。如果评论标记中未包含所有这些属性，此属性就特别有用。

      dateModified

[DateTime](https://schema.org/DateTime)

答案的修改日期和时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)（如果适用）。

      datePublished

[DateTime](https://schema.org/DateTime)

问题的回答日期和时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

      digitalSourceType

[IPTCDigitalSourceEnumeration](https://schema.org/IPTCDigitalSourceEnumeration)

digitalSourceType 属性用于指明与内容关联的数字来源类型（如适用）。此属性在辨别人工创作内容与 AI 或其他机器生成内容时尤为关键。Google 支持以下值：

- TrainedAlgorithmicMediaDigitalSource：表示由经过训练的模型（例如 LLM）创建的内容。
- AlgorithmicMediaDigitalSource：表示通过更简单的算法流程（例如自动回复机器人）创建的内容。

如果未指定此属性，Google 会假定内容是由人工生成的。

      image

[ImageObject](https://schema.org/ImageObject) 或 [URL](https://schema.org/URL)

答案中的任何内嵌图片（如果适用）。如果没有任何图片，请勿在此字段中添加默认图片、图标、占位符图片或作者图片。

### upvoteCount

      [Integer](https://schema.org/Integer)

相应答案已得到的投票总数（如果适用）。如果网页支持顶和踩，则应将 upvoteCount 值设为一个表示顶和踩相加抵消后的总值。例如，如果有 5 个顶和 2 个踩，则 upvoteCount 的总值为 3。如果有 5 个顶，且不支持踩，则 upvoteCount 的值为 5。

### url

      [URL](https://schema.org/URL)

直接链接到相应答案的网址。例如：https://www.examplesite.com/question#answer1

        **强烈建议**分别为每条答案提供一个网址，因为这样可以改善用户点击进入您网站时的体验。

      video

[VideoObject](https://schema.org/VideoObject) 或 [URL](https://schema.org/URL)

答案中的任何内嵌视频（如果适用）。

### Comment

Comment 类型可视需要用于描述关于问题或答案的澄清性说明或讨论，既非问题也非答案。您可以在 Question 或 Answer 中将 Comments 定义为 comment 属性的值。

如需了解 Comment 的完整定义，请访问 [https://schema.org/Comment](https://schema.org/Comment)。

      必要属性

### text

      [Text](https://schema.org/Text)

评论的完整内容。如果只标记了一部分，Google 可能无法确定显示哪些文字最为恰当。

      建议属性

### author

      [Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

评论作者的相关信息。为了帮助 Google 更好地了解各种功能中的作者，建议您遵循[作者标记最佳实践](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn#author-bp)。

请参考[文章](https://developers.google.com/search/docs/appearance/structured-data/articl?hl=zh-cn#article-types)和[个人资料页面](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)结构化数据中受支持的属性，然后包含尽可能多的合理作者属性。

### author.url

[URL](https://schema.org/URL)

可唯一标识评论作者的网页链接，该网页很有可能是问答网站的个人资料页面。我们建议您使用[个人资料页面结构化数据](https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn)标记该网页。

      comment

[Comment](https://schema.org/Comment)

用于回复评论的嵌套、消息串式评论（如果适用）。

      commentCount

[Integer](https://schema.org/Integer)

关于相应评论的评论数（如果适用）。如果评论标记中未包含所有这些属性，此属性就特别有用。

      dateModified

[DateTime](https://schema.org/DateTime)

评论的修改日期和时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)（如果适用）。

      datePublished

[DateTime](https://schema.org/DateTime)

评论的撰写日期和时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

      digitalSourceType

[IPTCDigitalSourceEnumeration](https://schema.org/IPTCDigitalSourceEnumeration)

digitalSourceType 属性用于指明与内容关联的数字来源类型（如适用）。此属性在辨别人工创作内容与 AI 或其他机器生成内容时尤为关键。Google 支持以下值：

- TrainedAlgorithmicMediaDigitalSource：表示由经过训练的模型（例如 LLM）创建的内容。
- AlgorithmicMediaDigitalSource：表示通过更简单的算法流程（例如自动回复机器人）创建的内容。

如果未指定此属性，Google 会假定内容是由人工生成的。

      image

[ImageObject](https://schema.org/ImageObject) 或 [URL](https://schema.org/URL)

评论中的任何内嵌图片（如果适用）。如果没有任何图片，请勿在此字段中添加默认图片、图标、占位符图片或作者图片。

      video

[VideoObject](https://schema.org/VideoObject) 或 [URL](https://schema.org/URL)

评论中的任何内嵌视频（如果适用）。

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