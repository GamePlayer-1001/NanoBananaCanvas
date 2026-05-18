# Google 搜索中的网站名称 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/site-names?hl=zh-cn

---

  # 向 Google 搜索提供网站名称

  当 Google 在搜索结果中列出某个网页时，会显示该网页的来源网站的名称，
  我们将其称为“网站名称”。请注意，网站名称与按网页显示的[标题链接](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn)不同（标题链接与网页一一对应，而网站名称对应的是整个网站）。

  该图示展示了 Google 搜索中的一条文字搜索结果，其中用突出显示的框圈出网站名称部分

焦吐司

[如何使用平底锅制作吐司](https://wikipedia.org/wiki/Toast_(food))

## 功能可用性

  网站名称适用于 Google 搜索支持的所有语言，同时支持桌面设备和移动设备。搜索结果中会显示网域级和子网域级网站名称（如需了解详情，请参阅[技术指南](#technical-guidelines)）。

## Google 搜索中的网站名称是如何创建的

  Google 在 Google 搜索结果页上生成网站名称的过程是完全自动的，且会同时考虑网站首页中的内容及网络上对此网页的引用。在 Google 搜索中，生成网站名称是为了充分展现和描述每条结果的来源。

  如需指明您偏好的网站名称，请向您的首页添加 [WebSite 结构化数据](#website)。我们的网站名称系统还会考虑 og:site_name 和 <title> 中的内容、标题元素和首页上的其他文字。不过，如果您想指定偏好设置，WebSite 结构化数据最为重要。

  尽管我们无法手动更改自动选择的网站名称，但您可以[指明备用名称](#alternative)，以便我们的自动化系统考虑是否未选择您的主要偏好设置。

## 选择网站名称

- **选择能准确体现网站身份且不会误导用户的唯一名称**。您选择的名称必须遵循 [Google 搜索内容政策](https://support.google.com/websearch/answer/10622781?hl=zh-cn)。
- 为网站**使用简明易懂的名称**（例如，使用“Google”，而不是“Google, Inc”）。虽然网站名称没有长度限制，但在某些设备上，较长的网站名称可能会被截断。
- **避免使用通用名称**。我们的系统不太可能选择诸如“爱荷华州最佳牙医”之类的通用名称作为网站名称，除非该品牌名称具有非常高的知名度。
- **在首页相关元素中使用一致的网站名称**。无论您在结构化数据中使用了什么网站名称，都请确保与您首页上[其他来源](#sources)中引用的网站名称保持一致，因为我们的系统在进行选择时会考虑到后者。
- **提供备用名称**。尽管我们的网站名称系统会尝试使用您的首选网站名称，但有时该名称会不可用。例如，我们的系统通常不会针对两个不同的全球性网站使用相同的网站名称。在其他情况下，我们的系统可能会认为网站使用首字母缩写词更便于大众识别，而不是全名。使用 alternateName 属性提供备用名称可让 Google 考虑其他选项（如果您的首选选项未被选择）。

## 如何添加包含结构化数据的网站名称

  结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

  本部分将介绍技术指南、必需属性，以及如何添加和测试网站名称结构化数据。

使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
  **
  使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。

### 遵循指南

  为了帮助 Google 更好地了解您的网站名称，请务必遵循[搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)、[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)、[选择网站名称](#choosing-site-name)的指南以及以下技术指南：

#### 技术指南

- **每个网站仅一个名称**：目前，Google 搜索仅支持每个网站有一个网站名称，其中“网站”由网域或子网域定义。**Google 搜索不支持子目录级别的网站名称。
    请注意，以 www 或 m 开头的子网域通常被视为等同的子网域。**
    受支持**：https://example.com（这是网域级首页）
    **
    受支持**：https://www.example.com（这也被视为网域级首页）
    **
    受支持**：https://m.example.com（这也被视为网域级首页）
    **
    受支持**：https://news.example.com（这是子网域级首页）
    **
    不受支持**：https://example.com/news（这是子目录级首页）
- **结构化数据必须放置在网站的首页上**：[WebSite 结构化数据](#website)必须放置在网站的首页上。我们所说的首页是指网域级或子网域级根 URI。例如，https://example.com 是网域的首页，而 https://example.com/de/index.html 不是首页。**注意**：如果子网域的首页上没有结构化数据，系统可能会将网域级网站名称用作子网域的备选名称。
- **首页必须能被 Google 抓取**：如果我们无权访问您首页上的内容（因系统[阻止](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share?hl=zh-cn)该访问），则或许无法生成网站名称。
- **对于包含重复首页的网站**：如果您有包含相同内容的重复首页（例如，首页的 HTTP 和 HTTPS 版本，或 www 版本和非 www 版本），请确保您在所有重复网页（而不仅仅是规范网页）上使用相同的结构化数据。
- **如果您的网站上已经有 WebSite 结构化数据**，请务必将网站名称属性嵌套在同一节点中。也就是说，请尽可能避免在首页上额外创建 WebSite 结构化数据块。

### 添加必需的网站名称属性

  以 JSON-LD、RDFa 或微数据格式向网站首页添加必需属性。您无需在网站的每个网页中添加此标记；只需将此标记添加到网站首页即可。

  必要属性

      name

[Text](https://schema.org/Text)

网站的名称。确保该名称遵循[选择网站名称的指南](#choosing-site-name)。

      url

[URL](https://schema.org/URL)

网站首页的网址。请将此项设为您网站网域或子网域的[规范](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)首页。例如，https://example.com/ 或 https://news.example.com/。

下面是一个包含必填字段的 WebSite 结构化数据示例：

#### JSON-LD

```
<html>
  <head>
    <title>Example: A Site about Examples</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org",
      "@type" : "WebSite",
      "name" : "Example",
      "url" : "https://example.com/"
    }
  </script>
  </head>
  <body>
  </body>
</html>
```

#### 微数据

```
<html>
  <head>
    <title>Example: A Site about Examples</title>
  </head>
  <body>
  <div itemscope itemtype="https://schema.org/WebSite">
    <link itemprop="url" href="https://example.com" />
    <meta itemprop="name" content="Example"/>
  </div>
  </body>
</html>

```

### 添加备用网站名称

若要提供网站名称的备用版本（例如，首字母缩写词或简称），可以添加 alternateName 属性。此属性是可选属性。

    建议属性

        alternateName

[Text](https://schema.org/Text)

          网站的备用名称（例如，如果您的网站有方便大众识别的首字母缩写词或简称）。确保该名称遵循[选择网站名称的指南](#choosing-site-name)。

          您可以列出多个备用名称。按照自己的偏好指定这些名称，最重要的名称排在前面。例如：

```
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Burnt Toast",
    "alternateName": ["BT", "B-T", "Burnt Toast Shop"],
    "url": "https://www.example.com/"
  }
</script>
```

以下是包含所有必填字段和建议字段的 WebSite 结构化数据示例：

#### JSON-LD

```
<html>
  <head>
    <title>Example: A Site about Examples</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org",
      "@type" : "WebSite",
      "name" : "Example Company",
      "alternateName" : "EC",
      "url" : "https://example.com/"
    }
  </script>
  </head>
  <body>
  </body>
</html>
```

#### 微数据

```
<html>
  <head>
    <title>Example: A Site about Examples</title>
  </head>
  <body>
  <div itemscope itemtype="https://schema.org/WebSite">
  <link itemprop="url" href="https://example.com" />
    <meta itemprop="name" content="Example Company"/>
    <meta itemprop="alternateName" content="EC"/>
  </div>
  </body>
</html>
```

### 测试结构化数据

1. 使用架构测试工具（例如[架构标记验证器](https://validator.schema.org/)）验证您的标记，确保没有语法错误。富媒体搜索结果测试不支持网站名称。
2. 使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的首页可供 Google 访问，不会因 robots.txt 文件、noindex 或登录要求阻止 Google 访问。
3. 如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。

  请等待一段时间，以便 Google 重新抓取您的网页并重新将其编入索引。请注意，网页发布后，Google 可能需要几天到几周的时间才会找到和抓取该网页。

## 
  未选择首选网站名称时的处理方式

  收到相应指示时，我们的系统通常会尝试使用 WebSite 结构化数据中的首选网站名称。但是，如果系统对使用您提供的名称不太有把握，有时可能会通过[其他来源](#sources)生成网站名称，或者改为显示域名或子域名。

如果我们的自动化系统未选择您的首选网站名称，请尝试以下步骤：

1. 验证以下内容：

- 首页 [WebSite 结构化数据](#website)中的网站名称为您网站的首选名称。
- 您的 WebSite 结构化数据不存在[结构化数据错误](https://support.google.com/webmasters/answer/13300873?hl=zh-cn)。
        使用架构测试工具（例如[架构标记验证器](https://validator.schema.org/)）确保没有语法错误（富媒体搜索结果测试不支持网站名称）。
- 您的结构化数据[遵循我们的指南](#guidelines)。
- 确认首页上的[其他来源](#sources)同样为网站使用了该首选名称。
- 确认您不打算为子目录设置网站名称。我们不支持子目录级别的网站名称（例如，https://example.com/news 是子目录级首页，不能有自己的网站名称）。如需了解详情，请参阅我们的[技术指南](#technical-guidelines)。
2. 请确保网页的重定向能够按预期运行，并且 Googlebot 可以访问重定向目标页。然后[请求重新抓取该网页](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。如果您的网页重定向到 Googlebot 可访问的其他网页，则系统会显示重定向目标页的网站名称。
3. 如果您的网站有多个版本（例如 HTTP 和 HTTPS 版本），请确保它们使用同一网站名称。
4. 如果您已更新网站名称结构化数据，请为 Google 留出相应的时间来重新抓取并重新处理新信息。请注意，抓取用时可能会从几天到几周不等，具体取决于系统判断内容所需的刷新频率。您可以使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn#request_indexing)请求重新抓取网页。
    **没有看到内部网页的首选网站名称？**如果您的首页已显示您首选的网站名称，请务必也为 Google 留出相应的时间来重新抓取并处理您的内部网页。

如果您按照指南操作，但首选网站名称仍未被选择，请考虑采取以下措施之一：

1. **首先，尝试使用 alternateName 属性提供备用名称**。如果我们的网站名称系统对使用您的首选名称不太有把握，则会重点考虑此名称。
2. **提供域名或子域名作为备份选项**。如需提供域名或子域名作为备份选项，请将您的域名或子域名添加为[备用名称](#alternative)。您的域名或子域名必须全部为小写字母（例如 example.com，而非 Example.com），这样我们的系统才能将其检测为网站名称偏好设置。如果您的首选名称未被选择，我们的系统会重点考虑使用此名称。在此示例中，Burnt Toast 是首选项，其次是 BT，而 example.com 是最不太合适的域名：

```

  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Burnt Toast",
    "alternateName": ["BT", "B-T", "Burnt Toast Shop", "example.com"],
    "url": "https://www.example.com/"
  }

```
3. **如果问题仍然存在，作为最后的补救措施，请尝试提供您的域名或子域名（全部为小写字母）作为[首选名称](#preferred-name)。**如果您提供域名或子域名作为首选名称，我们的系统通常会选择您提供的名称（但我们建议仅在万不得已时才这么做）。在此示例中，唯一的偏好设置是域名 example.com：

```

  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "example.com",
    "url": "https://www.example.com/"
  }

```

如果您在尝试执行[问题排查步骤](#troubleshooting)后仍遇到问题，请在 [Google 搜索中心帮助社区](https://support.google.com/webmasters/thread/227739087?hl=zh-cn)中发帖咨询。这有助于我们寻找系统中可能需要改进的地方。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。