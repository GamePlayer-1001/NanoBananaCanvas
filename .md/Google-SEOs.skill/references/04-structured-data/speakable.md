# 可朗读（Beta 版）架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/speakable?hl=zh-cn

---

  # 可朗读（Article、WebPage）结构化数据（Beta 版）

此功能处于 Beta 版阶段，随时可能会变更。我们目前正在开发此功能，所以相关要求或指南可能会发生变更。

speakable[schema.org](https://schema.org/) 属性可用于标识报道或网页中最适合使用文字转语音 (TTS) 功能进行音频播放的版块。添加标记后，搜索引擎和其他应用可以识别出相应内容，并在内置 Google 助理的设备上使用 TTS 功能朗读这些内容。包含 speakable 结构化数据的网页可以使用 Google 助理来通过新渠道分发内容，并将内容呈现给更多的用户。

Google 助理会使用 speakable 结构化数据在智能音箱设备上对时事新闻查询进行回复。当用户询问有关特定主题的新闻时，Google 助理会从网络上返回最多 3 篇报道，并支持使用 TTS 功能对报道中包含 speakable 结构化数据的版块进行音频播放。当 Google 助理朗读某个 speakable 版块时，它会寻找内容的来源，并通过 Google 助理应用将完整的报道网址发送到用户的移动设备。

## 示例

下面是一个使用了 JSON-LD 代码和 xPath content-locator 值的 speakable 结构化数据示例：

```
<html>
  <head>
    <title>Speakable markup example</title>
    <meta name="description" content="This page is all about the quick brown fox" />
    <script type="application/ld+json">
    {
     "@context": "https://schema.org/",
     "@type": "WebPage",
     "name": "Quick Brown Fox",
     "speakable":
     {
      "@type": "SpeakableSpecification",
      "xPath": [
        "/html/head/title",
        "/html/head/meta[@name='description']/@content"
        ]
      },
     "url": "https://www.example.com/quick-brown-fox"
     }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 适用的国家/地区和语言

speakable 属性适用于将 Google Home 设备的语言设为“英语”的美国用户以及使用英语发布内容的发布商。我们希望，一旦实施 speakable 属性的发布商数量足够多，就能将它推广到其他国家/地区和语言版本。

## 使用入门

为了使您的新闻内容能够在用户查询时事新闻时作为答案呈现，请按以下步骤操作：

1. 确保遵循[我们的指南](#guidelines)。
2. 将 [speakable 结构化数据](#structured-data-type-definitions)添加到您的网页中。

## 指南

如需让您的 speakable 内容能够显示在新闻搜索结果中，您必须遵循以下指南。

- [技术指南](#technical-guidelines)
- [内容指南](#content-guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 技术指南

在为 Google 助理实施 speakable 标记时，请遵循以下指南。

- 不要将 speakable 结构化数据添加到在纯语音和语音转发的情况下听起来可能会令人困惑的内容中，如新闻电头（报道新闻的地点）、照片说明或信息来源说明。
- 应抓住重点，而不是使用 speakable 结构化数据强调整篇报道。这样能让听众明白新闻的主旨，不会因为使用了 TTS 朗读功能而漏掉重要细节。

### 内容指南

在编写打算使用 speakable 结构化数据标记的内容时，请遵循以下指南。

- 用 speakable 结构化数据标记的内容必须具有简明扼要的资讯标题和/或摘要，可为用户提供易懂且有用的信息。
- 如果您将新闻的开头包含在 speakable 结构化数据中，我们建议您重写新闻的开头，将信息拆分成多个句子，以便通过 TTS 功能更清楚地朗读。
- 为确保能够向用户提供最佳音频体验，我们建议每段 speakable 结构化数据包含大约 20-30 秒的内容，或者大概 2-3 个句子。

## 结构化数据类型定义

[Speakable](https://pending.schema.org/speakable) 属性供 [Article](https://pending.schema.org/Article) 或 [Webpage](https://pending.schema.org/WebPage) 对象使用。
      如需了解 speakable 的完整定义，请访问 [schema.org/speakable](https://schema.org/speakable)。为了能够使用此功能，您必须为内容添加必要属性。

speakable 属性可以重复任意次数使用，有两种可能的 content-locator 值：CSS 选择器和 xPath。请使用下列属性之一：

      必要属性

          cssSelector

[Text](https://schema.org/Text)

对带注释的网页中的内容（如类属性）寻址。使用 cssSelector 或 xPath，但不要同时使用这两者。例如：

```
"speakable":
  {
  "@type": "SpeakableSpecification",
  "cssSelector": [
    ".headline",
    ".summary"
  ]
}
```

           xPath

[Text](https://schema.org/Text)

使用 xPath 对内容寻址（假设该内容使用 XML 视图）。使用 cssSelector 或 xPath，但不要同时使用这两者。例如：

```
"speakable":
  {
  "@type": "SpeakableSpecification",
  "xPath": [
    "/html/head/title",
    "/html/head/meta[@name='description']/@content"
  ]
}
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

### 无法触发内容

*error* 问题**：您无法通过 Google 助理使用 TTS 音频触发您的内容。

*done* **解决问题**

1. 尝试以下语音指令：

- “与 $topic 相关的最新消息是什么？”
- “与 $topic 相关的最新资讯是什么？”
- “播放与 $topic 相关的新闻。”
2. 如果问题仍然存在，可能是因为排名是通过算法确定的。通过 TTS 音频播放，Google 助理可提供最多 3 篇来自不同新闻发布来源的报道。有关 Google 如何对报道进行排名的详情，请参阅 [Google 搜索的运作方式](https://www.google.com/search/howsearchworks/?hl=zh-cn)。

## 更多音频解决方案

除了 speakable 结构化数据之外，您还可以将其他 Google 助理音频解决方案用于您的新闻内容，比如实现 Google 助理与您自定义应用的高级集成。例如，允许用户通过 Google 助理与应用进行互动。有关详情，请参阅 [Actions on Google 开发者指南](https://developers.google.com/actions?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。