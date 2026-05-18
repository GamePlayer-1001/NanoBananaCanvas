# 订阅和付费内容标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/paywalled-content?hl=zh-cn

---

  # 订阅和付费内容结构化数据 (CreativeWork)

  本页介绍了如何使用 schema.org JSON-LD 并借助 [CreativeWork](https://schema.org/CreativeWork) 属性指明网站上的付费内容。该结构化数据有助于 Google 区分付费内容与[伪装真实内容](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#cloaking)的行为，后者违反了[网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)。详细了解[订阅和付费内容](https://developers.google.com/search/docs/appearance/flexible-sampling?hl=zh-cn)。

  本指南仅适用于您希望被抓取和编入索引的内容。如果您不希望我们将您的付费内容编入索引，则无需再继续阅读下去。

## 示例

下面是一个包含付费内容的 [NewsArticle](https://schema.org/NewsArticle) 结构化数据示例。

<html>
  <head>
    <title>Article headline</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Article headline",
      "image": "https://example.org/thumbnail1.jpg",
      "datePublished": "2025-02-05T08:00:00+08:00",
      "dateModified": "2025-02-05T09:20:00+08:00",
      "author": {
        "@type": "Person",
        "name": "John Doe",
        "url": "https://example.com/profile/johndoe123"
      },
      "description": "A most wonderful article",
      "isAccessibleForFree": false,
      "hasPart":
        {
        "@type": "WebPageElement",
        "isAccessibleForFree": false,
        "cssSelector" : ".paywall"
        }
    }
    </script>
  </head>
  <body>
    <div class="non-paywall">
      Non-Paywalled Content
    </div>
    <div class="paywall">
      Paywalled Content
    </div>
  </body>
</html>

```
<html>
  <head>
    <title>Article headline</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": "Article headline",
      "image": "https://example.org/thumbnail1.jpg",
      "datePublished": "2025-02-05T08:00:00+08:00",
      "dateModified": "2025-02-05T09:20:00+08:00",
      "author": {
        "@type": "Person",
        "name": "John Doe",
        "url": "https://example.com/profile/johndoe123"
      },
      "description": "A most wonderful article",
      "isAccessibleForFree": false,
      "hasPart":
        {
        "@type": "WebPageElement",
        "isAccessibleForFree": false,
        "cssSelector" : ".paywall"
        }
    }
    </script>
  </head>
  <body>
    <div class="non-paywall">
      Non-Paywalled Content
    </div>
    <div class="paywall">
      Paywalled Content
    </div>
  </body>
</html>
```

## 指南

  您必须遵循[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)和[技术指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn#technical-guidelines)，这样您的网页才能够显示在搜索结果中。此外，付费内容还需要遵循以下指南：

注意**：如果您违反了这些政策，您的网页可能无法显示在搜索结果中。如需了解详情，请参阅[垃圾内容结构化标记](https://support.google.com/webmasters/answer/3498001?hl=zh-cn)。

- 可以使用 JSON-LD 和微数据格式这两种方法来指定付费内容的结构化数据。
- 不要嵌套内容版块。
- 仅对 cssSelector 属性使用 .class 选择器。
- 如果您不希望在提供内容时浏览器能够访问相应内容，请选择一种不会向浏览器提供付费内容的付费墙实现方式。如果您使用客户端 JavaScript 解决方案，请参阅我们[关于使用 JavaScript 实现付费墙内容的指南](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript?hl=zh-cn#paywall)。

## 向付费内容添加标记

  如果您为您的网站内容采用任何[基于订阅的访问模式](https://developers.google.com/search/docs/appearance/flexible-sampling?hl=zh-cn)，或者如果用户必须注册才能访问您要编入索引的任何内容，请按相应步骤操作。以下示例适用于 NewsArticle 结构化数据。请务必对网页的所有版本（包括 AMP 和非 AMP 版本）执行以下步骤。

1. 在网页的每个付费版块周围添加一个类名。例如：
```

This content is outside a paywall and is visible to all.

This content is inside a paywall, and requires a subscription or registration.

```
2. 添加 [NewsArticle](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn) 结构化数据。
3. 将突出显示的 JSON-LD 结构化数据添加到您的 NewsArticle 结构化数据。
    **注意**：cssSelector 会引用您在第 1 步中添加的类名。

```
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.org/article"
  },
  (...)
  "isAccessibleForFree": false,
  "hasPart": {
    "@type": "WebPageElement",
    "isAccessibleForFree": false,
    "cssSelector": ".paywall"
  }
}
```
4. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码，并修复所有严重错误。

### 多个付费版块

如果网页上有多个付费版块，请以数组的形式添加类名。

下面是网页上的多个付费版块的示例：

```
<body>
  <div class="section1">This content is inside a paywall, and requires a subscription or registration.</div>
  <p>This content is outside a paywall and is visible to all.</p>
  <div class="section2">This is another section that's inside a paywall, or requires a subscription or registration.</div>
</body>
```

  下面是一个包含多个付费版块的 [NewsArticle](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn) 结构化数据示例。

```
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.org/article"
    },
  (...)
  "isAccessibleForFree": false,
  "hasPart": [
    {
      "@type": "WebPageElement",
      "isAccessibleForFree": false,
      "cssSelector": ".section1"
    }, {
      "@type": "WebPageElement",
      "isAccessibleForFree": false,
      "cssSelector": ".section2"
    }
  ]
}
```

### 支持的类型

  此标记适用于 [CreativeWork](https://schema.org/CreativeWork) 类型或以下某一特定类型的 CreativeWork：

- [Article](https://schema.org/Article)
- [NewsArticle](https://schema.org/NewsArticle)
- [Blog](https://schema.org/Blog)
- [Comment](https://schema.org/Comment)
- [Course](https://schema.org/Course)
- [HowTo](https://schema.org/HowTo)
- [Message](https://schema.org/Message)
- [Review](https://schema.org/Review)
- [WebPage](https://schema.org/WebPage)

可以使用多个 schema.org 类型，如下所示：

"@type": ["Article", "LearningResource"]

您必须添加必要属性，Google 才能知道您的文章包含付费内容。您可以添加建议的属性，以便更精确地指出网页的哪些版块隐藏在付费墙后面（或者需要订阅或注册）。

    必要属性

        isAccessibleForFree

[Boolean](https://schema.org/Boolean)

文章是否可供所有人访问，或是否隐藏在付费墙后面（或者需要订阅或注册）。将 isAccessibleForFree 属性设置为 false，即可指定此版块隐藏在付费墙后面。

    建议属性

        hasPart.cssSelector

[CssSelectorType](https://schema.org/CssSelectorType)

CSS 选择器，会引用您[在 HTML 中设置](#class-name-step)的类名，以指定付费版块。

        hasPart.@type

[Text](https://schema.org/Text)

将 @type 设置为 WebPageElement。

        hasPart.isAccessibleForFree

[Boolean](https://schema.org/Boolean)

文章的这一版块是否隐藏在付费墙后面（或者需要订阅或注册）。将 isAccessibleForFree 属性设置为 False，即可指定此版块隐藏在付费墙后面。

## AMP 注意事项

下面是您在使用 AMP 网页时需注意的一些事项：

- 如果您有包含付费内容的 AMP 网页，请在合适的情况下使用 [amp-subscriptions](https://www.ampproject.org/docs/reference/components/amp-subscriptions)。
- 确保您的授权端点准许 Google 及其他方的相应漫游器访问内容。具体操作方法因发布商不同而异。
- 确保对 AMP 和非 AMP 网页实施相同的漫游器访问政策，否则可能会导致 Search Console 中出现内容不匹配错误。

## Google 搜索中的生成式 AI 注意事项

  AI 概览和 AI 模式可以根据各种来源（包括网络来源）提供主题或查询的预览。
  因此，它们受到 Google 搜索[预览控件](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#nosnippet)的约束。

## 确保 Google 可以抓取您的网页并将其编入索引

  如果您希望 Google 抓取您的内容（包括付费版块）并将其编入索引，请确保 [Googlebot](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot?hl=zh-cn) 和 [Googlebot-News](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers?hl=zh-cn#googlebot-news)（如果适用）可以访问您的网页。

  使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 会如何抓取并呈现您网站上的某个网址。

## 控制在搜索结果中显示哪些信息

  若要阻止内容的某些部分显示在搜索结果摘要中，请使用 [data-nosnippet HTML 属性](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#data-nosnippet-attr)。您还可以使用 [max-snippet robots meta 标记](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#max-snippet)来限制搜索结果摘要中可以包含多少字符。

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