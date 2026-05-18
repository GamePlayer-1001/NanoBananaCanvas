# 漫游器元标记规范 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn

---

  # Robots meta 标记、data-nosnippet 和 X-Robots-Tag 规范

  本文档详细介绍了如何使用网页级和文本级设置调整 Google 在搜索结果中呈现内容的方式。您可以向 HTML 网页或 HTTP 标头中添加 meta 标记，从而指定网页级设置。您可以在网页中的 HTML 元素上使用 data-nosnippet 属性，从而指定文本级设置。

请注意，只有在抓取工具可以访问包含这些设置的网页时，系统才会读取和遵循这些设置。

  <meta name="robots" content="noindex"> 规则适用于搜索引擎抓取工具。如需屏蔽非搜索抓取工具（例如 AdsBot-Google），您可能需要添加针对具体抓取工具的规则（例如 <meta name="AdsBot-Google" content="noindex">）。

## 使用robots meta 标记

  借助robots meta 标记，您可以使用精细的网页级设置，控制各个 HTML 网页被编入索引并在 Google 搜索结果中显示给用户的方式。请将robots meta 标记放置在给定网页的 <head> 部分，如下所示：

```
<!DOCTYPE html>
<html><head>
  <meta name="robots" content="noindex">
  (&hellip;)
</head>
<body>(&hellip;)</body>
</html>
```

        如果您使用 Wix、WordPress 或 Blogger 等 CMS**，则可能无法直接修改 HTML，也可能不希望修改 HTML。实际上，您的 CMS 可能具有搜索引擎设置页面或其他某种机制，能够将 meta 标记告知搜索引擎。

        如果您要向网站添加 meta 标记，请在您的 CMS 上搜索有关修改网页 <head> 的说明（例如，搜索“wix add meta tags”）。

  在此示例中，robots meta 标记会指示搜索引擎不要在搜索结果中显示相应网页。name 属性的值 (robots) 指定此规则适用于所有抓取工具。name 和 content 属性都不区分大小写。如需针对特定的抓取工具，请将 name 属性的 robots 值替换为这个抓取工具的用户代理令牌。Google 支持在robots meta 标记中使用以下两个用户代理令牌，其他值会被忽略：

1. googlebot：适用于所有文本结果。
2. googlebot-news：适用于新闻结果。

  例如，如需指示 Google 不要在搜索结果中显示某个摘要，您可以将 googlebot 指定为 meta 标记的名称：

```
<meta name="googlebot" content="nosnippet">
```

  如需在 Google 网页搜索结果中显示完整的摘要，但不在 Google 新闻中显示摘要，请将 googlebot-news 指定为 meta 标记的名称：

```
<meta name="googlebot-news" content="nosnippet">
```

  要分别指定多个抓取工具，请使用多个robots meta 标记：

```
<meta name="googlebot" content="notranslate">
<meta name="googlebot-news" content="nosnippet">
```

    **注意**：Google 搜索不会强制要求将漫游器元标记放置在 HTML 标头中，并且也会遵循 HTML 文档正文部分中的漫游器元标记。

  如需禁止将非 HTML 资源（例如 PDF 文件、视频文件或图片文件）编入索引，请改用 [X-Robots-Tag 响应标头](#xrobotstag)。

## 使用 X-Robots-Tag HTTP 标头

  X-Robots-Tag 可用作指定网址的 HTTP 标头响应中的一个元素。任何可在robots meta 标记中使用的规则也可以指定为 X-Robots-Tag。下面是一个 HTTP 响应示例，它含有一个 X-Robots-Tag，用来指示抓取工具不要将某一网页编入索引：

```

HTTP/1.1 200 OK
Date: Tue, 25 May 2010 21:42:43 GMT
(&hellip;)
X-Robots-Tag: noindex
(&hellip;)
```

      您可以在 HTTP 响应中组合使用多个 X-Robots-Tag 标头，也可以指定一系列以英文逗号分隔的规则。下面这个示例 HTTP 标头响应组合使用了 noimageindex X-Robots-Tag 与 unavailable_after X-Robots-Tag。

```

HTTP/1.1 200 OK
Date: Tue, 25 May 2010 21:42:43 GMT
(&hellip;)
X-Robots-Tag: noimageindex
X-Robots-Tag: unavailable_after: 25 Jun 2010 15:00:00 PST
(&hellip;)
```

    X-Robots-Tag 也可以在规则前面指定用户代理。例如，下面这组 X-Robots-Tag HTTP 标头可以用于有条件地允许某一网页在不同搜索引擎的搜索结果中显示：

```

HTTP/1.1 200 OK
Date: Tue, 25 May 2010 21:42:43 GMT
(&hellip;)
X-Robots-Tag: googlebot: nofollow
X-Robots-Tag: otherbot: noindex, nofollow
(&hellip;)
```

    规则如果没有指定用户代理，那么对所有抓取工具都有效。HTTP 标头、用户代理名称和指定的值都不区分大小写。

**有冲突的漫游器规则**：如果漫游器规则存在冲突，那么系统会采用限制较为严格的规则。例如，如果某个网页同时包含 max-snippet:50 和 nosnippet 规则，那么系统会应用 nosnippet 规则。

## 有效的索引编制规则和内容显示规则

    您可以使用以下规则（也以[机器可读格式](https://developers.google.com/static/search/apis/ipranges/robots-tags.json?hl=zh-cn)提供），通过robots meta 标记和 X-Robots-Tag 控制[摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)的索引编制和内容显示。每个值代表一个特定的规则。您可以[将多个规则合并](#combined)为一个逗号分隔列表或使用多个 meta 标记。这些规则不区分大小写。

      这些规则在其他搜索引擎中可能会有不同的含义。

        规则

### all

          对索引编制或内容显示无任何限制。该规则为默认值，因此明确列出时并无任何效果。

### noindex

            不在搜索结果中显示此网页、媒体或资源。如果您未指定该规则，则此网页、媒体或资源可能会编入索引并显示在搜索结果中。

            若要从 Google 中移除信息，请按照我们的[分步指南](https://developers.google.com/search/docs/crawling-indexing/remove-information?hl=zh-cn)操作。

### nofollow

          不追踪该网页上的链接。如果您未指定此规则，Google 可能会使用该网页上的链接来发现链接到的网页。详细了解 [nofollow](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn)。

### none

          等同于 noindex, nofollow。

### nosnippet

            不在搜索结果中显示该网页的文本摘要或视频预览。如果有静态图片缩略图，而且它能够实现更好的用户体验，那么系统仍可能显示这类缩略图。这适用于所有形式的搜索结果，包括 Google 网页搜索、Google 图片、Google 探索、AI 概览和 AI 模式，并且还会阻止将内容用作 AI 概览和 AI 模式的直接输入。

            如果您未指定此规则，Google 可能会根据在该网页上找到的信息生成文本片段和视频预览。

若要阻止内容的某些部分显示在搜索结果摘要中，请使用 [data-nosnippet HTML 属性](#data-nosnippet-attr)。

### indexifembedded

            如果网页内容通过 [iframes](https://developer.mozilla.org/docs/Web/HTML/Element/iframe) 或类似 HTML 标记嵌入到其他网页中，那么 Google 可以将该网页内容编入索引（尽管存在 noindex 规则）。

            indexifembedded 仅在与 noindex 一起出现时才有效。

### max-snippet: [number]

            最多只能使用 [number] 个字符作为此搜索结果的文字摘要。（请注意，网址可能会在搜索结果页中显示为多个搜索结果）。这并不会影响图片或视频预览。这适用于所有形式的搜索结果（例如 Google 网页搜索、Google 图片、Google 探索、Google 助理、AI 概览、AI 模式），并且还会限制可将多少内容用作 AI 概览和 AI 模式的直接输入。
            但是，如果发布商已单独授予内容使用权限，则此限制不适用。例如，如果发布商以页内结构化数据的形式提供内容，或者与 Google 签订了许可协议，那么此设置不会妨碍那些更具体的允许用途。如果没有指定可解析的 [number]，此规则会被忽略。

            如果您不指定此规则，则 Google 会选择摘要长度。

特殊值：

- 0：不会显示任何摘要。等同于 nosnippet。
- -1：Google 会选择其认为最有助于用户发现您的内容并将用户定向到您网站的摘要长度。

示例：

阻止摘要显示在搜索结果中：

```
<meta name="robots" content="max-snippet:0">
```

摘要中最多只能有 20 个字符：

```
<meta name="robots" content="max-snippet:20">
```

            指明摘要没有字符数限制：

```
<meta name="robots" content="max-snippet:-1">
```

### max-image-preview: [setting]

设置此网页的图片预览在搜索结果中的尺寸上限。

            如果您未指定 max-image-preview 规则，Google 可能会显示默认尺寸的图片预览。

接受的 [setting] 值：

- none：不会显示图片预览。
- standard：可能会显示默认图片预览。
- large：可能会显示较大的图片预览，最高达到视口宽度。

            这适用于所有形式的搜索结果，例如 Google 网页搜索、Google 图片、Google 探索和 Google 助理。但是，如果发布商已单独授予内容使用权限，则此限制不适用。例如，如果发布商以页内结构化数据的形式提供内容（例如 AMP 版本和规范版本的文章），或与 Google 签订了许可协议，那么此设置不会妨碍那些更具体的允许用途。

            如果您不希望 Google 搜索或 Google 探索在显示其文章的 AMP 网页和规范版本时使用较大的缩略图，请将 max-image-preview 的值指定为 standard 或 none。

示例：

```
<meta name="robots" content="max-image-preview:standard">
```

### max-video-preview: [number]

            此网页上的视频在搜索结果中的视频摘要时长不得超过 [number] 秒。

             如果您未指定 max-video-preview 规则，Google 可能会在搜索结果中显示视频摘要，并且由 Google 决定预览内容的长短。

特殊值：

- 0：根据 max-image-preview 设置，最多只能使用一张静态图片。
- -1：没有限制。

            这适用于所有形式的搜索结果，例如 Google 网页搜索、Google 图片、Google 视频、Google 探索和 Google 助理。如果没有指定可解析的 [number]，此规则会被忽略。

示例：

```
<meta name="robots" content="max-video-preview:-1">
```

### notranslate

          不在搜索结果中提供该网页的译文。如果您未指定此规则，那么对于语言不是搜索查询所用语言的搜索结果，Google 可能会提供搜索结果[标题链接和摘要的翻译版本](https://developers.google.com/search/docs/appearance/translated-results?hl=zh-cn)。如果用户点击翻译后的标题链接，那么用户与该网页之间的进一步互动都是通过谷歌翻译进行的，该工具会自动翻译用户后续访问的链接。

### noimageindex

          不将该网页上的图片编入索引。如果您未指定此值，系统可能会将网页上的图片编入索引并显示在搜索结果中。

### unavailable_after: [date/time]

            在指定日期/时间过后，不在搜索结果中显示该网页。日期/时间必须以广泛采用的格式指定，包括但不限于 [RFC 822](https://www.ietf.org/rfc/rfc0822.txt)、[RFC 850](https://www.ietf.org/rfc/rfc0850.txt) 和 [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html)。
            如果未指定有效的日期/时间，该规则将被忽略。默认情况下，内容没有失效日期。

            如果您未指定此规则，该网页可能会无限期地显示在搜索结果中。Googlebot 将在指定日期和时间之后大幅降低网址的抓取速度。

示例：

```
<meta name="robots" content="unavailable_after: 2020-09-21">
```

### 历史规则和其他未使用的规则的参考

        以下规则不受 Google 搜索支持，将被忽略。我们在此列出这些规则，是因为大家经常询问这些规则，或者我们过去曾使用过这些规则。

          历史规则和其他未使用的规则的列表

### noarchive

            Google 搜索不再使用 noarchive 规则来控制是否在搜索结果中显示缓存链接，因为缓存链接功能已不存在。

### nocache

            Google 搜索不会使用 nocache 规则。

### nositelinkssearchbox

              Google 搜索不再使用 nositelinkssearchbox 规则来控制是否为给定网页显示站点链接搜索框，因为此功能已不存在。

## 如何处理合并的索引编制规则和内容显示规则

您可以将多个以英文逗号分隔的robots meta 标记规则合并起来或使用多个 meta 标记，创建一条包含多个规则的命令。下面是一个robots meta 标记示例，它会指示网页抓取工具不要将该网页编入索引，也不要抓取该网页上的任何链接：

### 逗号分隔列表

```
<meta name="robots" content="noindex, nofollow">
```

### 多个 meta 标记

```
<meta name="robots" content="noindex">
<meta name="robots" content="nofollow">
```

    下面的示例会将文本摘要长度限制为 20 个字符，并允许大图片预览：

```
<meta name="robots" content="max-snippet:20, max-image-preview:large">
```

    如果您指定了多个抓取工具，并且不同的工具对应不同的规则，那么搜索引擎会综合使用所有的否定规则。例如：

```
<meta name="robots" content="nofollow">
<meta name="googlebot" content="noindex">
```

    Googlebot 在抓取包含这些 meta 标记的网页时会将其视为拥有 noindex, nofollow 规则。

## 
    使用 data-nosnippet HTML 属性

    您可以指定不要使用 HTML 网页的哪些文字部分生成摘要。您可以使用 span、div 和 section 元素中的 data-nosnippet HTML 属性，在 HTML 元素级别实现这一点。data-nosnippet 被视为[布尔属性](https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes)。与所有布尔属性一样，指定的任何值都将被忽略。为了确保机器能读懂，HTML 部分必须是有效的 HTML，并且所有标记都有对应的结束标记。

示例：

```
<p>This text can be shown in a snippet
<span data-nosnippet>and this part would not be shown</span>.</p>

<div data-nosnippet>not in snippet</div>
<div data-nosnippet="true">also not in snippet</div>
<div data-nosnippet="false">also not in snippet</div>
<!-- all values are ignored -->

<div data-nosnippet>some text</html>
<!-- unclosed "div" will include all content afterwards -->

<mytag data-nosnippet>some text</mytag>
<!-- NOT VALID: not a span, div, or section -->

<p>This text can be shown in a snippet.</p>
<div data-nosnippet>
<p>However, this is not in snippet.</p>
<ul>
  <li>Stuff not in snippet</li>
  <li>More stuff not in snippet</li>
</ul>
</div>
```

    Google 通常会呈现网页以将其编入索引，但无法保证会呈现。因此，在渲染之前和之后都可能会提取 data-nosnippet。为避免渲染的不确定性，请不要通过 JavaScript 添加或移除现有节点的 data-nosnippet 属性。通过 JavaScript 添加 DOM 元素时，请在最初向网页的 DOM 添加该元素时根据需要包含 data-nosnippet 属性。如果使用了自定义元素，并且您需要使用 data-nosnippet，请通过 div、span 或 section 元素封装或渲染它们。

## 使用结构化数据

    Robots meta 标记会控制 Google 自动从网页中提取并显示为搜索结果的内容量。但是，很多发布商也使用 schema.org 结构化数据为[搜索呈现](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)提供具体信息。Robots meta 标记限制不会影响该结构化数据的使用，但 article.description 和为其他创意作品指定的结构化数据的 description 值除外。如需根据这些 description 值指定预览的最大长度，请使用 max-snippet 规则。例如，即使文本预览会受到限制，网页上的 recipe 结构化数据也可以包含在食谱轮播界面中。您可以使用 max-snippet 限制文本预览的长度，但是在使用结构化数据提供信息以获得富媒体搜索结果时，系统不会应用此robots meta 标记。

    如需管理在网页中使用结构化数据的方式，请修改结构化数据类型和值本身，添加或移除信息，以便只提供您想提供的数据。另外还请注意，在 data-nosnippet 元素内声明结构化数据后，这些数据仍然可以用于显示搜索结果。

## 
    实际添加 X-Robots-Tag

    您可以通过网站的网络服务器软件的配置文件将 X-Robots-Tag 添加到网站的 HTTP 响应中。例如，在基于 Apache 的网络服务器上，您可以使用 .htaccess 和 httpd.conf 文件。在 HTTP 响应中使用 X-Robots-Tag 的好处是，您可以指定要应用于整个网站的抓取规则。系统支持正则表达式，因此带来了很高的灵活性。

例如，如需将 noindex, nofollow X-Robots-Tag 添加到整个网站的所有 .PDF 文件的 HTTP 响应中，请将以下代码段添加到 Apache 型网站的根 .htaccess 文件或 httpd.conf 文件中，或者添加到 NGINX 型网站的 .conf 文件中。

### Apache

```

<Files ~ "\.pdf$">
Header set X-Robots-Tag "noindex, nofollow"
</Files>
```

### NGINX

```

location ~* \.pdf$ {
add_header X-Robots-Tag "noindex, nofollow";
}
```

    对于无法在 HTML 中使用robots meta 标记的非 HTML 文件（如图片文件），您可以使用 X-Robots-Tag。以下示例展示了如何为整个网站上的图片文件（.png、.jpeg、.jpg、.gif）添加 noindex X-Robots-Tag 规则：

### Apache

```

<Files ~ "\.(png|jpe?g|gif)$">
Header set X-Robots-Tag "noindex"
</Files>
```

### NGINX

```

location ~* \.(png|jpe?g|gif)$ {
add_header X-Robots-Tag "noindex";
}
```

    您还可以为单个静态文件设置 X-Robots-Tag 标头：

### Apache

```

# the htaccess file must be placed in the directory of the matched file.
<Files "unicorn.pdf">
Header set X-Robots-Tag "noindex, nofollow"
</Files>
```

### NGINX

```

location = /secrets/unicorn.pdf {
add_header X-Robots-Tag "noindex, nofollow";
}
```

## 合并使用 robots.txt 规则与索引编制及内容显示规则

    只有当网址被抓取时，robots meta 标记和 X-Robots-Tag HTTP 标头才会被抓取工具发现。如果您通过 robots.txt 文件禁止抓取某一网页，那么抓取工具就不会找到任何关于索引编制/内容显示规则的信息，因此会忽略这些信息。如果必须遵循索引编制/内容显示规则，那么您不能禁止抓取工具抓取包含这些规则的网址。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。