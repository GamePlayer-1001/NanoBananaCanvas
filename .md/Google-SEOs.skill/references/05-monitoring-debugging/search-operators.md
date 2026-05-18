# 使用 Google 搜索运算符进行调试 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/monitor-debug/search-operators?hl=zh-cn

---

# Google 搜索运算符概览

  Google 搜索支持[多种搜索运算符](https://support.google.com/websearch/answer/2466433?hl=zh-cn)，您可以使用这些搜索运算符优化或定位搜索。此外，以下搜索运算符还能在调试网站时发挥作用。

  例如，site: 搜索运算符可用于监控网站上的垃圾评论，而图片搜索运算符 imagesize: 可用于查找网站上的小图片。

  不过，由于搜索运算符受索引和检索局限性的制约，因此使用 Search Console 中的[网址检查](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)工具进行调试要更加可靠。

  下表列出了可用于在 Google 搜索结果中检查网页各个方面的搜索运算符：

      搜索运算符

## filetype:

            查找[特定文件类型](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types?hl=zh-cn)（由 content-type HTTP 标头或文件扩展名定义）的搜索结果。例如，您可以搜索以 .rtf 结尾且内容中包含“galway”一词的 RTF 文件和网址：

```
filetype:rtf galway
```

## [imagesize:](https://developers.google.com/search/docs/monitor-debug/search-operators/image-search?hl=zh-cn#imagesize)

            查找包含特定尺寸的图片的网页。此搜索运算符仅适用于 Google 图片。例如：

```
imagesize:1200x800
```

## [site:](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site?hl=zh-cn)

            查找来自特定的网域、网址或网址前缀的搜索结果。例如：

```
site:https://www.google.com/
```

## [src:](https://developers.google.com/search/docs/monitor-debug/search-operators/image-search?hl=zh-cn#src)

查找在 src 属性中引用了特定图片网址的网页。此搜索运算符仅适用于 Google 图片。例如：

```
src:https://www.example.com/images/peanut-butter.png
```

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。