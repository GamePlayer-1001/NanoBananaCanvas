# Google 搜索技术要求 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/essentials/technical?hl=zh-cn

---

# Google 搜索技术要求

      不管他人怎么说，将您的网页显示在搜索结果中无需花费任何费用。只要您的网页满足以下最低技术要求，就可以被 Google 搜索编入索引：

1. Googlebot 未被屏蔽。
2. 网页可正常运行，这意味着 Google 会收到 HTTP 200 (success) 状态代码。
3. 网页包含可编入索引的内容。

    网页符合上述要求并不表示一定会被编入索引；网页是否会编入索引无法保证。

## Googlebot 未被屏蔽（它能够发现和访问相应网页）

      Google 只会将网络上可公开访问且不会阻止我们的抓取工具 [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn) 进行抓取的网页编入索引。如果网页被设为不公开（例如需要登录才能查看），则 Googlebot 不会抓取该网页。同样地，如果网页使用了阻止 Google 将其编入索引的[多种机制](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share?hl=zh-cn)中的一种，则该网页不会被编入索引。

### 检查 Googlebot 能否发现并访问您的网页

      被 [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn) 屏蔽的网页不太可能显示在 Google 搜索结果中。如需查看 Google 无法访问（但您希望显示在搜索结果中）的网页列表，请同时使用 Search Console 中的[“网页索引编制”报告](https://support.google.com/webmasters/answer/7440203?hl=zh-cn)和[“抓取统计信息”报告](https://support.google.com/webmasters/answer/9679690?hl=zh-cn)。每个报告都可能会包含与您的网址相关的不同信息，因此建议这两种报告都看一看。

      如需测试特定网页，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)。

## 网页可以正常运行（不是错误页）

      Google 只会将具有 [HTTP 200 (success) 状态代码](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes?hl=zh-cn#2xx-success)的网页编入索引。客户端和服务器错误页不会被编入索引。您可以使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)检查给定网页的 HTTP 状态代码。

## 网页包含可编入索引的内容

      Googlebot 能够发现并访问正常运行的网页后，会检查该网页是否包含可编入索引的内容。可编入索引的内容指的是：

- 以 [Google 搜索支持的某种文件类型](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types?hl=zh-cn)提供的文本内容。
- 相应内容未违反我们的[网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)。

      尽管使用 robots.txt 文件屏蔽 Googlebot 会阻止其抓取网页，但网页的网址可能仍会显示在搜索结果中。如需指示 Google 不要将某个网页编入索引，请使用 [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn) 并允许 Google 抓取该网址。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。