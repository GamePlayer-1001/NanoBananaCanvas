# 经过翻译的 Google 搜索结果 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/translated-results?hl=zh-cn

---

# Google 搜索中的翻译搜索结果功能

    Google 搜索致力于让信息可供所有用户使用，使人人受益。用户通常会使用自己的本地语言搜索内容，但搜索结果中的内容不一定会使用相同的语言。为了弥合这种语言差异带来的内容和观点差距，如果搜索结果的语言与用户的搜索查询语言不一致，且系统支持将搜索结果翻译成用户搜索查询的语言，Google 可能会将搜索结果的标题链接和摘要翻译成用户搜索查询时使用的语言。经过翻译的搜索结果能让用户查看以其所用语言显示的其他语言的结果，并且可以帮助发布商覆盖更广泛的受众群体。

## 功能可用性

    目前，Google 可以将搜索结果翻译成以下语言：阿拉伯语、孟加拉语、英语、法语、德语、古吉拉特语、印地语、印度尼西亚语、卡纳达语、韩语、马拉雅拉姆语、马拉地语、波斯语、葡萄牙语、西班牙语、泰米尔语、泰卢固语、泰语、土耳其语、乌尔都语、越南语。此功能既支持移动设备，也支持桌面设备。

## 翻译搜索结果功能的运作方式

    如果用户点击翻译后的标题链接，则会看到一个经过机器翻译的网页。用户也可以选择查看原始搜索结果，并查看以原始语言显示的整个网页。

    Google 并不托管任何翻译版网页。通过翻译搜索结果打开网页与通过[谷歌翻译](https://support.google.com/translate/answer/2534559?hl=zh-cn)打开原始搜索结果或使用 [Chrome 浏览器内翻译功能](https://support.google.com/chrome/answer/173424?hl=zh-cn)查看网页没有区别。也就是说，网页上的 JavaScript 以及嵌入的图片和其他网页功能通常都受支持。

  如果您运营一个广告网络，则可能需要执行额外的操作，以确保在用户点击翻译搜索结果后，该广告网络可正确显示。详细了解如何[让广告网络能够使用与翻译相关的 Google 搜索功能](https://developers.google.com/search/docs/appearance/ad-network-and-translation?hl=zh-cn)。

## 
    在 Search Console 中监控效果

    如需监控翻译搜索结果的点击次数和展示次数，您可以使用[效果报告](https://support.google.com/webmasters/answer/7576553?hl=zh-cn)中的[搜索结果呈现过滤条件](https://support.google.com/webmasters/answer/7576553?hl=zh-cn#zippy=,search-appearance)。

## 选择启用或停用翻译搜索结果功能

    此功能适用于所有网页和基于用户语言的搜索结果。此功能默认即已启用，您无需进行任何操作。

    翻译搜索结果功能与 Google 搜索中的其他翻译相关功能类似。如需选择停用 Google 搜索中的所有翻译功能，请使用 [notranslate 规则](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#notranslate)，该规则可以实现为 meta 标记或 HTTP 标头：

```
<!-- opt out of translation features on all search engines that support this rule -->
<meta name="robots" content="notranslate">
```

```
<!-- opt out of translation features on Google -->
<meta name="googlebot" content="notranslate">
```

或者，您也可以将该规则指定为 HTTP 响应标头：

```
HTTP/1.1 200 OK
Date: Tue, 25 May 2010 21:42:43 GMT
(...)
X-Robots-Tag: notranslate
(...)
```

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。