# 适用于 Google 搜索的网址结构最佳实践 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/url-structure?hl=zh-cn

---

# 适用于 Google 搜索的网址结构最佳实践

  为了确保 Google 搜索可以有效地抓取您的网站，请使用符合以下要求的可抓取网址结构。如果您的网址不符合以下条件，Google 搜索可能会以低效的方式抓取您的网站，包括但不限于抓取速度极高或根本不抓取。

## 可抓取网址结构的要求

### 遵循 [IETF STD 66](https://datatracker.ietf.org/doc/std66/)

Google 搜索支持 [IETF STD 66](https://datatracker.ietf.org/doc/std66/) 中定义的网址。所有被这项标准定义为[预留](https://www.rfc-editor.org/rfc/rfc3986#section-2.2)的字符都必须采用[百分比编码](https://developer.mozilla.org/docs/Glossary/Percent-encoding)。

### 请勿使用网址片段更改内容

          请勿使用[片段](https://wikipedia.org/wiki/URI_fragment)更改网页内容，因为 Google 搜索通常不支持网址片段。以下是网址片段示例：

```
https://example.com/#/potatoes
```

          如果您要使用 JavaScript 更改内容，请改为[使用 History API](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn#use-history-api)。

### 对网址参数使用常见编码

指定网址参数时，请使用以下常见编码：使用等号 (=) 分隔键值对，并使用和号 & 添加其他参数。如需在键值对中列出同一键的多个值，您可以使用与 [IETF STD 66 LINK](https://datatracker.ietf.org/doc/std66/) 不冲突的任何字符，例如逗号 (,)。

              推荐

              不推荐

            使用等号 (=) 分隔键值对，并使用和号 (&) 添加其他参数：
```
https://example.com/category?category=dresses&sort=low-to-high&sid=789
```

              使用冒号 (:) 分隔键值对，并使用大括号 ([ ]) 添加其他参数：

```
https://example.com/category?[category:dresses][sort:price-low-to-high][sid:789]
```

            使用逗号 (,) 列出同一键的多个值，使用等号 (=) 分隔键值对，并使用和号 (&) 添加其他参数：
```
https://example.com/category?category=dresses&color=purple,pink,salmon&sort=low-to-high&sid=789
```

              使用单个逗号 (,) 分隔键值对，并使用双逗号 (,,) 添加其他参数：

```
https://example.com/category?category,dresses,,sort,lowtohigh,,sid,789
```

## 让网址结构

  为了帮助 Google 搜索（以及用户）更好地了解您的网站，我们建议您创建简单的网址结构，并尽可能遵循以下最佳实践。

建议您组织一下内容，使网址结构合乎逻辑并特别易于人类理解。
  如需了解如何整体构建网站，请参阅 [SEO 入门指南中的此部分](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn#group-topically)。

    最佳做法

### 使用描述性网址

尽可能在网址中使用易读的字词，而非冗长的 ID 编号。

              推荐（简单、说明性字词）

              不推荐（不易读、冗长的 ID 编号）

```
https://example.com/wiki/Aviation
```

```
https://example.com/index.php?topic=42&area=3a5ebc944f41daa6f849f730f1
```

### 使用受众群体的语言

在网址中使用受众群体的语言（以及如适用的话，使用音译字词）。例如，如果受众群体使用德语搜索，请在网址中使用德语字词：

```
https://example.com/lebensmittel/pfefferminz
```

          或者，如果受众群体使用日语搜索，请在网址中使用日语字词：

```
https://example.com/ペパーミント
```

### 根据需要使用百分比编码

[链接到您网站上的网页](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn)时，请根据需要在链接的 href 属性中使用百分比编码。非预留 ASCII 字符可以保留未编码形式。此外，非 ASCII 范围内的字符应采用百分比编码。例如：

          推荐（百分比编码）
          不推荐（非 ASCII 字符）

```
https://example.com/%D9%86%D8%B9%D9%86%D8%A7%D8%B9/%D8%A8%D9%82%D8%A7%D9%84%D8%A9
```

```
https://example.com/نعناع
```

```
https://example.com/%E6%9D%82%E8%B4%A7/%E8%96%84%E8%8D%B7
```

```
https://example.com/杂货/薄荷
```

```
https://example.com/gem%C3%BCse
```

```
https://example.com/gemüse
```

```
https://example.com/%F0%9F%A6%99%E2%9C%A8
```

```
https://example.com/🦙✨
```

### 使用连字符分隔字词

建议您尽可能在网址中分隔字词。具体而言，我们建议您使用连字符 (-) 而非下划线 (_) 来分隔网址中的字词，因为这有助于用户和搜索引擎更好地识别网址中的概念。出于历史原因，我们不建议使用下划线，因为这种样式已被广泛用于表示应保持在一起的概念，例如，各种编程语言用来命名函数（例如 format_date）。

            推荐

            不推荐

使用连字符 (-) 分隔字词：

```
https://example.com/summer-clothing/filter?color-profile=dark-grey
```

使用下划线 (_) 分隔字词：

```
https://example.com/summer_clothing/filter?color_profile=dark_grey
```

将网址中的字词连接在一起：

```
https://example.com/greendress
```

### 尽可能少地使用参数

    尽可能删去不必要的参数（即不会更改内容的参数），缩短网址。

### 请注意，网址区分大小写

    与遵循 IETF STD 66 的任何其他 HTTP 客户端一样，Google 搜索的网址处理功能也区分大小写（例如，Google 会将 /APPLE 和 /apple 视为具有各自内容的不同网址）。
    如果网络服务器对网址中的大小写文本的处理方式相同，请将所有文本转换为同一大小写形式，以便 Google 能够更轻松地确定网址引用的是同一网页。

### 对于多区域网站

如果您的网站是多区域网站，请考虑使用一种便于对您的网站进行地理位置定位的网址结构。如要查看更多示例，了解如何处理网址结构，请参阅[使用基于语言区域的网址](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=zh-cn#locale-specific-urls)。

        推荐（使用特定国家/地区网域）：

```
https://example.de
```

        推荐（使用特定国家/地区子目录搭配 gTLD）：

```
https://example.com/de/
```

## 避免与网址相关的常见问题

  过于复杂的网址，特别是那些包含多个参数的网址，可能会给抓取工具带来麻烦，因为它们可能会产生大量不必要的网址，全都指向您网站上相同或相似的内容。Googlebot 可能会因此而消耗大量不必要的带宽，Google 搜索也可能无法将网站上的所有内容完整编入索引。

  导致网址过多可能有多种原因，其中包括：

    常见问题

### 累加过滤一组项目

很多网站都会针对同一组项目或搜索结果提供不同的视图，通常让用户能够使用指定的条件（例如：显示海景酒店）过滤出该组。当过滤条件可按累加模式组合时（例如：海景酒店，且配有健身中心），网站中网址（数据视图）的数量就会急剧增加。由于 Googlebot 只需查看少量列表就能访问各个酒店的网页，所以没必要创建大量只有细微差异的酒店列表。例如：

- “特价”酒店：

```
https://example.com/hotel-search-results.jsp?Ne=292&N=461
```
- “特价”海景酒店：

```
https://example.com/hotel-search-results.jsp?Ne=292&N=461+4294967240
```
- 带健身中心的“特价”海景酒店：

```
https://example.com/hotel-search-results.jsp?Ne=292&N=461+4294967240+4294967270
```

### 不相关的参数

网址中存在不相关的参数可能会导致大量网址，例如：

- 推荐参数：

```
https://example.com/search/noheaders?click=6EE2BF1AF6A3D705D5561B7C3564D9C2&clickPage=OPD+Product+Page&cat=79
```

```
https://example.com/discuss/showthread.php?referrerid=249406&threadid=535913
```

```
https://example.com/products/products.asp?N=200063&Ne=500955&ref=foo%2Cbar&Cn=Accessories
```
- 购物排序参数：

```
https://example.com/results?search_type=search_videos&search_query=tpb&search_sort=relevance&search_category=25
```
- 会话 ID：
```
https://example.com/search/noheaders?sessionid=6EE2BF1AF6A3D705D5561B7C3564D9C2
```

          尽可能避免在网址中使用会话 ID，而应考虑使用 Cookie。

          考虑使用 [robots.txt 文件](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn)阻止 Googlebot 访问这些有问题的网址。

### 日历问题

动态生成的日历可能会生成指向未来及过去日期的链接，而这些日期没有开始或结束日期的限制。例如：

```
https://example.com/calendar.php?d=13&m=8&y=2011
```

如果您的网站具有未设置期限的日历，请为指向动态创建的未来日历页的链接添加 [nofollow](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn#nofollow) 属性。

### 损坏的相对链接

      如果服务器未针对不存在的网页返回正确的 HTTP 状态代码，那么在错误的网页上放置[父级相对链接](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references#parent-directory_relative)可能会导致无限空间。例如，https://example.com/category/community/070413/html/FAQ.htm 上的 <a href="../../category/stuff">...</a> 等父级相对链接可能会导致 https://example.com/category/community/category/stuff 等虚假网址。
        要解决此问题，请在链接中使用根相对网址（而不是父级相对网址）。

## 解决与抓取相关的网址结构问题

  如果您发现 Google 搜索正在抓取这些有问题的网址，我们建议您执行以下操作：

- 考虑使用 [robots.txt 文件](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn)阻止 Googlebot 访问[有问题的网址](#common-issues)。一般情况下，可以考虑阻止动态网址，例如会生成搜索结果或无限空间（如日历）的网址，以及排序和过滤函数。
- 如果您的网站有分面导航，请了解如何[管理对这些分面导航网址的抓取](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation?hl=zh-cn#prevent-crawling-of-faceted-navigation-urls)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。