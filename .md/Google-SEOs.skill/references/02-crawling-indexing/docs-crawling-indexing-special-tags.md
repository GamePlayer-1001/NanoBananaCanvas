# Example Books - high-quality used books for children

---

---
source: https://developers.google.com/search/docs/crawling-indexing/special-tags
---

# Google 支持的 meta 标记和属性

- 

# Google 支持的 meta 标记和属性

```
meta
```

本页将介绍什么是 meta 标记，Google 支持哪些 meta 标记和 HTML 属性来控制索引编制，以及在您的网站上实现 meta 标记时需要注意的其他重要事项。

```
meta
```

```
meta
```

```
meta
```

## meta 代码

```
meta
```

meta 标记是一种 HTML 标记，用于向搜索引擎和其他客户端提供有关网页的其他信息。客户端会处理 meta 标记，并忽略不受支持的元标记。meta 标记应添加到 HTML 网页的  部分，通常如下所示：

```
meta
```

```
meta
```

```
meta
```

```

```

```

    Example Books - high-quality used books for children

```

如果您使用 Wix、WordPress 或 Blogger 等 CMS，则可能无法直接修改 HTML，也可能不希望修改 HTML。实际上，您的 CMS 可能具有搜索引擎设置页面或其他某种机制，能够将 meta 标记告知搜索引擎。

```
meta
```

如果您要向网站添加 meta 标记，请在您的 CMS 上搜索有关修改网页  的说明（例如，搜索“wix add meta tags”）。

```
meta
```

```

```

Google 支持以下 meta 标记：

```
meta
```

```
meta
```

### 说明

```

```

### 漫游器和 Googlebot

```

```

```

```

这些 meta 标记可以控制搜索引擎的抓取和索引编制行为。

```
meta
```

```

如果 Google 发现网页内容所用的语言不是用户可能想阅读的语言，可能会在搜索结果中提供经过翻译的标题链接和摘要。
            如果用户点击翻译后的标题链接，那么用户与该网页之间的后续互动都是通过谷歌翻译进行的，该工具会自动翻译用户后续访问的链接。这样通常会让您有机会将独特而富有吸引力的内容提供给更多用户。不过，在某些情况下，您可能并不希望我们这样做。此 meta 标记可告知 Google 您不希望我们提供该网页的翻译。

```
meta
```

### nopagereadaloud

```

```

阻止各种 Google 文字转语音服务使用文字转语音 (TTS) 功能朗读网页内容。

### Google 网站验证

```

```

您可以在网站的顶级网页上使用此标记，向 Search Console 验证您对该网站的所有权。
          请注意，虽然 name 和 content 属性的值必须与提供给您的值完全匹配（包括大小写），但是否将标记从 XHTML 更改为 HTML，或者标记的格式是否与网页的格式相符，这些都无关紧要。

```
name
```

```
content
```

### 内容类型和字符集

```

```

```

```

这两个标记分别用于定义网页的内容类型和字符集。请务必使用引号引住 http-equiv meta 标记中 content 属性的值，否则 charset 属性可能会被错误地解读。我们建议尽可能使用 Unicode/UTF-8。

```
http-equiv
```

```
meta
```

```
content
```

```
charset
```

### 刷新

```

```

此标记通常称为元刷新，会在一段时间后将用户转到新网址，有时也会被用作一种简单的重定向形式。不过，并非所有浏览器都支持使用此元标记，因而可能会令用户感到困惑。我们建议改用服务器端 301 重定向。

```
301
```

### 视口

```

```

此标记可告知浏览器如何在移动设备上呈现网页。此标记的存在可向 Google 表明该网页适合移动设备。详细了解如何配置 viewport meta 标记。

```
viewport
```

```
meta
```

### 评分

```

```

```

```

将网页标记为包含露骨的成人内容，以表明该网页应被安全搜索滤除。详细了解如何标记安全搜索网页。

## HTML 标记属性

HTML 标记属性是 HTML 标记的额外值，用于配置父标记。例如， 标记的 href 属性会配置锚标记所指向的资源：。

```

```

```
href
```

```

```

对于索引编制来说，Google 搜索支持的 HTML 属性数量有限。src 和 href 等属性用于发现图片和网址等资源。Google 还支持各种 rel 属性，可让网站所有者限定出站链接。

```
src
```

```
href
```

```
rel
```

通过 div、span 和 section 标记的 data-nosnippet 属性，您可以从摘要中排除 HTML 网页的某些部分。

```
div
```

```
span
```

```
section
```

```
data-nosnippet
```

## 需要注意的其他事项

- 无论网页采用的是哪种代码，Google 都能读取 HTML 和 XHTML 样式的 meta 标记。
- 为了确保机器能读懂，head 部分必须是有效的 HTML；如果是属性，则所有父标记都必须有对应的结束标记。
- 除了 google-site-verification 外，其他 meta 标记的大小写通常无关紧要。
- 如果其他 meta 标记对您的网站很重要，您可以使用它们，但 Google 会忽略它不支持的 meta 标记。
- 如果您考虑使用 JavaScript 注入或更改 meta 标记，请谨慎操作。我们建议您尽可能避免使用 JavaScript 注入或更改 meta 标记。如果确有必要这么做，请全面测试您的实现。
- 如需检查网页上的 meta 标记和属性，请使用网址检查工具。

```
meta
```

```
head
```

```
google-site-verification
```

```
meta
```

```
meta
```

```
meta
```

```
meta
```

```
meta
```

```
meta
```

## 不受支持的标记和属性

以下标记和属性不受 Google 搜索支持，将被忽略。我们在此列出它们是因为它们要么在 HTML 中很常见，要么我们曾经为其提供支持。

```

```

```
lang
```

```
lang
```

```
next
```

```
prev
```

```
rel
```

```

```

```

```

Google 将不再使用这些 HTML  标记，它们对索引编制没有任何影响。

```

```

### nositelinkssearchbox

```

```

Google 搜索不再使用 nositelinkssearchbox 规则来控制是否为给定网页显示站点链接搜索框，因为此功能已不存在。

```
nositelinkssearchbox
```