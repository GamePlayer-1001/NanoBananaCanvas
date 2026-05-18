# 使用结构化数据标记 FAQ | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/faqpage?hl=zh-cn

---

  # FAQ（FAQPage、Question、Answer）结构化数据

  用户是否可以在您的网站中提交对单个问题的回答？**如果可以，请改用 [QAPage](https://developers.google.com/search/docs/appearance/structured-data/qapage?hl=zh-cn) 结构化数据。

  如果您的政府或健康类网站包含问题和答案列表，您可以使用 FAQPage 结构化数据帮助用户在 Google 上找到这些信息。如果您正确标记了 FAQ 页，它们[可能会](#feature-availability)在 Google 搜索中显示为富媒体搜索结果，并且系统可能会为其生成[适用于 Google 助理的 Action](https://developers.google.com/assistant/content/overview?hl=zh-cn)，而这有助于您的网站触及合适的用户。

## 功能可用性

  FAQ 富媒体搜索结果仅适用于侧重政府或健康内容的知名权威网站。此功能适用于 Google 搜索支持的所有国家/地区和语言的桌面设备和移动设备。

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

下面是一个 JSON-LD 格式的 FAQPage 示例：

    <html>
  <head>
    <title>Finding an apprenticeship - Frequently Asked Questions(FAQ)</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "How to find an apprenticeship?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "<p>We provide an official service to search through available apprenticeships. To get started, create an account here, specify the desired region, and your preferences. You will be able to search through all officially registered open apprenticeships.</p>"
        }
      }, {
        "@type": "Question",
        "name": "Whom to contact?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can contact the apprenticeship office through our official phone hotline above, or with the web-form below. We generally respond to written requests within 7-10 days."
        }
      }]
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
    <title>Finding an apprenticeship - Frequently Asked Questions(FAQ)</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [{
        "@type": "Question",
        "name": "How to find an apprenticeship?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "<p>We provide an official service to search through available apprenticeships. To get started, create an account here, specify the desired region, and your preferences. You will be able to search through all officially registered open apprenticeships.</p>"
        }
      }, {
        "@type": "Question",
        "name": "Whom to contact?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can contact the apprenticeship office through our official phone hotline above, or with the web-form below. We generally respond to written requests within 7-10 days."
        }
      }]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据

下面是一个微数据格式的 FAQPage 示例：

    <html itemscope itemtype="https://schema.org/FAQPage">
<head></head>
<body>
  <h1>
    Frequently Asked Questions(FAQ)
  </h1>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h2 itemprop="name">How to find an apprenticeship?</h2>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">
        We provide an official service to search through available apprenticeships. To get started, create an account here, specify the desired region, and your preferences. You will be able to search through all officially registered open apprenticeships.
      </div>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h2 itemprop="name">Whom to contact?</h2>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">
        You can contact the apprenticeship office through our official phone hotline above, or with the web-form below. We generally respond to written requests within 7-10 days.
      </div>
    </div>
  </div>
</body>
</html>

```
<html itemscope itemtype="https://schema.org/FAQPage">
<head></head>
<body>
  <h1>
    Frequently Asked Questions(FAQ)
  </h1>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h2 itemprop="name">How to find an apprenticeship?</h2>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">
        We provide an official service to search through available apprenticeships. To get started, create an account here, specify the desired region, and your preferences. You will be able to search through all officially registered open apprenticeships.
      </div>
    </div>
  </div>
  <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
    <h2 itemprop="name">Whom to contact?</h2>
    <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
      <div itemprop="text">
        You can contact the apprenticeship office through our official phone hotline above, or with the web-form below. We generally respond to written requests within 7-10 days.
      </div>
    </div>
  </div>
</body>
</html>
```

## 指南

要让您的常见问题解答页能够显示为富媒体搜索结果，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [内容指南](#content-guidelines)

### 内容指南

- 您的网站必须是健康类网站或政府网站。该网站还必须广为人知且权威。
- 请仅在您的网页包含 FAQ（其中，每个问题都有答案）时使用 FAQPage。如果您的网页中只列出了一个问题且用户可以提交备选答案，请改用 [QAPage](https://developers.google.com/search/docs/appearance/structured-data/qapage?hl=zh-cn)。下面是一些示例：

**有效用例**：

        由健康网站本身编写的一个 FAQ 网页，用户无法在该网页上提交备选答案
- 一个政府机构的支持网页，其中列有常见问题解答，用户无法在该网页上提交备选回答

无效用例**：

- 一个论坛网页，用户可以在该网页上提交单个问题的答案
- 一个产品支持页，用户可以在该网页上提交单个问题的答案
- 一个产品页面，用户可以在这个页面上提交多个问题和答案

  请勿将 FAQPage 用于广告宣传。
  确保每个 Question 包含完整的问题内容，并确保每个 Answer 包含完整的答案内容。可以显示整个问题和答案内容。
  如果问题和答案包含以下任何类型的内容，那么它们可能不会显示为富媒体搜索结果：淫秽、亵渎、露骨色情、血腥暴力、宣传危险/违法活动，或仇恨性/骚扰性语言。
  所有 FAQ 内容都必须在源网页上对用户可见。以下是一些示例：

**有效用例**：

- 问题和答案在网页上都对用户可见。
- 问题在网页上可见，而答案隐藏在可展开的部分。用户可以通过点击可展开的部分查看答案。

**无效用例**：用户根本无法在网页上找到 FAQ 内容。

  如果您的网站上存在重复的 FAQ 内容（也就是说，相同的问题和答案出现在您网站的多个网页上），在整个网站上，请仅标记一处该内容。

## 结构化数据类型定义

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需属性。你还可以添加建议的属性，以便向结构化数据添加更多信息，进而提供更好的用户体验。

### FAQPage

schema.org 上提供了 [FAQPage](https://schema.org/FAQPage) 的完整定义。

  FAQPage 类型表示网页是包含已获解答问题的 FAQ 页。每个网页都必须有一个 FAQPage 类型定义。

Google 支持的属性如下：

      必要属性

      mainEntity
      [Question](https://schema.org/Question)

          以 Question 为元素的数组，包含 FAQPage 上附有答案的问题。您必须至少指定一个有效的 [Question 项](#question)。Question 项包含问题和答案。

### Question

如需了解 [Question](https://schema.org/Question) 的完整定义，请访问 schema.org。

  Question 类型定义了 FAQ 中的一个已获解答的问题。每个 Question 实例都必须包含在 schema.org/FAQPage 的 mainEntity 属性数组中。

Google 支持的属性如下：

    必要属性

      acceptedAnswer
      [Answer](https://schema.org/Answer)

问题的答案。每个问题必须有一个答案。

      name
      [Text](https://schema.org/Text)

问题的完整内容。例如，“处理退款需要多长时间？”。

### Answer

如需了解 [Answer](https://schema.org/Answer) 的完整定义，请访问 schema.org。

Answer 类型定义了相应网页上每个 Question 的 acceptedAnswer。

Google 支持的属性如下：

    必要属性

      text
      [Text](https://schema.org/Text)

问题的完整答案。答案可能包含 HTML 内容（如链接和列表）。Google 搜索会显示以下 HTML 标记：&#60;h1&#62; 到 &#60;h6&#62;、&#60;br&#62;、&#60;ol&#62;、&#60;ul&#62;、&#60;li&#62;、&#60;a&#62;、&#60;p&#62;、&#60;div&#62;、&#60;b&#62;、&#60;strong&#62;、&#60;i&#62; 和 &#60;em&#62;。所有其他标记都会被忽略。

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