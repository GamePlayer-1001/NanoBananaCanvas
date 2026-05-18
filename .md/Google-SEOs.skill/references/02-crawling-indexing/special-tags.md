# Google 支持的元标记和属性 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/special-tags?hl=zh-cn

---

  # Google 支持的 meta 标记和属性

  本页将介绍什么是 meta 标记，Google 支持哪些 meta 标记和 HTML 属性来控制索引编制，以及在您的网站上实现 meta 标记时需要注意的其他重要事项。

## meta 代码

  meta 标记是一种 HTML 标记，用于向搜索引擎和其他客户端提供有关网页的其他信息。客户端会处理 meta 标记，并忽略不受支持的元标记。meta 标记应添加到 HTML 网页的 <head> 部分，通常如下所示：

```
<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="description" content="Author: A.N. Author, Illustrator: P. Picture, Category: Books, Price:  £9.24, Length: 784 pages">
    <meta name="google-site-verification" content="+nxGUDJ4QpAZ5l9Bsjdi102tLVC21AIh5d1Nl23908vVuFHs34=">
    <title>Example Books - high-quality used books for children</title>
    <meta name="robots" content="noindex,nofollow">
  </head>
</html>
```

        如果您使用 Wix、WordPress 或 Blogger 等 CMS**，则可能无法直接修改 HTML，也可能不希望修改 HTML。实际上，您的 CMS 可能具有搜索引擎设置页面或其他某种机制，能够将 meta 标记告知搜索引擎。

        如果您要向网站添加 meta 标记，请在您的 CMS 上搜索有关修改网页 <head> 的说明（例如，搜索“wix add meta tags”）。

Google 支持以下 meta 标记：

    Google 支持的 meta 标记的列表

### 说明

```
<meta name="description" content="A description of the page">
```

        此标记用于提供一段有关网页的简短说明。在某些情况下，此说明将用在[搜索结果中显示的摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)中。

### 漫游器和 Googlebot

```
<meta name="robots" content="..., ...">
```

```
<meta name="googlebot" content="..., ...">
```

          这些 meta 标记可以控制搜索引擎的抓取和索引编制行为。

<meta name="robots" ... 标记适用于所有搜索引擎，但 <meta name="googlebot ... 标记专用于 Google。

如果 robots（或 googlebot）meta 标记之间存在冲突，那么系统会应用限制较严的标记。例如，如果某个网页同时包含 max-snippet:50 和 nosnippet 标记，那么会应用 nosnippet 标记。

默认值为 index, follow，不需要指定。
          如需查看 Google 支持的值的完整列表，请参阅[有效规则列表](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#directives)。

您还可以使用 X-Robots-Tag HTTP 标头规则，在网页的标头中指定此信息。如果您要限制将非 HTML 文件（如图形或其他类型的文档）编入索引的行为，这种方法尤其实用。
          [详细了解漫游器 meta 标记](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn)。

### notranslate

```
<meta name="googlebot" content="notranslate">
```

          如果 Google 发现网页内容所用的语言不是用户可能想阅读的语言，可能会在搜索结果中提供[经过翻译的标题链接和摘要](https://developers.google.com/search/docs/appearance/translated-results?hl=zh-cn)。
            如果用户点击翻译后的标题链接，那么用户与该网页之间的后续互动都是通过谷歌翻译进行的，该工具会自动翻译用户后续访问的链接。这样通常会让您有机会将独特而富有吸引力的内容提供给更多用户。不过，在某些情况下，您可能并不希望我们这样做。此 meta 标记可告知 Google 您不希望我们提供该网页的翻译。

### nopagereadaloud

```
<meta name="google" content="nopagereadaloud">
```

阻止各种 [Google 文字转语音服务](https://developers.google.com/search/docs/crawling-indexing/read-aloud-user-agent?hl=zh-cn)使用文字转语音 (TTS) 功能朗读网页内容。

### Google 网站验证

```
<meta name="google-site-verification" content="...">
```

          您可以在网站的顶级网页上使用此标记，[向 Search Console 验证您对该网站的所有权](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)。
          请注意，虽然 name 和 content 属性的值必须与提供给您的值完全匹配（包括大小写），但是否将标记从 XHTML 更改为 HTML，或者标记的格式是否与网页的格式相符，这些都无关紧要。

### 内容类型和字符集

```
<meta http-equiv="Content-Type" content="...; charset=...">
```

```
<meta charset="...">
```

          这两个标记分别用于定义网页的内容类型和字符集。请务必使用引号引住 [http-equiv](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-http-equiv) meta 标记中 content 属性的值，否则 [charset](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#charset) 属性可能会被错误地解读。我们建议尽可能使用 Unicode/UTF-8。

### 刷新

```
<meta http-equiv="refresh" content="...;url=...">
```

          此标记通常称为元刷新，会在一段时间后将用户转到新网址，有时也会被用作一种简单的重定向形式。不过，[并非所有浏览器都支持使用此元标记，因而可能会令用户感到困惑](https://www.w3.org/TR/WCAG10-HTML-TECHS/#meta-element)。我们建议改用服务器端 [301 重定向](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn)。

### 视口

```
<meta name="viewport" content="...">
```

          此标记可告知浏览器如何在移动设备上呈现网页。此标记的存在可向 Google 表明该网页适合移动设备。[详细了解如何配置 viewport meta 标记。](https://web.dev/articles/responsive-web-design-basics?hl=zh-cn#size-content)

### 评分

```
<meta name="rating" content="adult">
```

```
<meta name="rating" content="RTA-5042-1996-1400-1577-RTA">
```

          将网页标记为包含露骨的成人内容，以表明该网页应被安全搜索滤除。[详细了解如何标记安全搜索网页。](https://developers.google.com/search/docs/crawling-indexing/safesearch?hl=zh-cn)

## HTML 标记属性

  [HTML 标记属性](https://developer.mozilla.org/docs/Web/HTML/Attributes)是 HTML 标记的额外值，用于配置父标记。例如，<a> 标记的 href 属性会配置锚标记所指向的资源：<a **href="https://example.com/"**...>。

  对于索引编制来说，Google 搜索支持的 HTML 属性数量有限。src 和 href 等属性用于发现图片和网址等资源。Google 还支持各种 [rel 属性](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn)，可让网站所有者限定出站链接。

  通过 div、span 和 section 标记的 [data-nosnippet 属性](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#data-nosnippet-attr)，您可以从摘要中排除 HTML 网页的某些部分。

## 需要注意的其他事项

- 无论网页采用的是哪种代码，Google 都能读取 HTML 和 XHTML 样式的 meta 标记。
- 为了确保机器能读懂，head 部分必须是[有效的 HTML](https://developers.google.com/search/docs/crawling-indexing/valid-page-metadata?hl=zh-cn)；如果是属性，则所有父标记都必须有对应的结束标记。
- 除了 google-site-verification 外，其他 meta 标记的大小写通常无关紧要。
- 如果其他 meta 标记对您的网站很重要，您可以使用它们，但 Google 会忽略它不支持的 meta 标记。
- 如果您考虑使用 JavaScript 注入或更改 meta 标记，请谨慎操作。我们建议您尽可能避免使用 JavaScript 注入或更改 meta 标记。如果确有必要这么做，请全面[测试您的实现](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript?hl=zh-cn)。
- 如需检查网页上的 meta 标记和属性，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)。

## 不受支持的标记和属性

    以下标记和属性不受 Google 搜索支持，将被忽略。我们在此列出它们是因为它们要么在 HTML 中很常见，要么我们曾经为其提供支持。

      不受支持的标记和属性

      元关键字标记

        <meta name="keywords" content="...">
        该元关键字标记不会用于 Google 搜索，完全不会影响索引编制和排名。

      HTML 标记 lang 属性
      Google 搜索会根据网页的文字内容检测网页的语言。它不依赖于 lang 等代码注解。

        next 和 prev rel 属性值

```
<link rel="next" href="...">
```

```
<link rel="prev" href="...">
```

          Google 将不再使用这些 HTML <link> 标记，它们对索引编制没有任何影响。

### nositelinkssearchbox

```
<meta name="google" content="nositelinkssearchbox">
```

          Google 搜索不再使用 nositelinkssearchbox 规则来控制是否为给定网页显示站点链接搜索框，因为此功能已不存在。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。