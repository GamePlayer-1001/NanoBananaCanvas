# 使用 noindex 阻止搜索引擎编入索引 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn

---

  # 使用 noindex 阻止搜索引擎编入索引

      noindex 是一个包含 <meta> 标记或 HTTP 响应标头的规则集，用于防止支持 noindex 规则的搜索引擎（例如 Google）将内容编入索引。当 Googlebot 抓取该网页并发现该标记或标头时，Google 就会完全阻止该网页出现在 Google 搜索结果中，不论是否有其他网站链接到该网页。

      重要提示**：为让 noindex 规则生效，网页或资源**不得**被 robots.txt 文件屏蔽，并且必须能被抓取工具访问。如果该网页被 robots.txt 文件屏蔽或抓取工具无法访问该网页，那么抓取工具将永远无法看到 noindex 规则，因此该网页可能仍会显示在搜索结果中，例如，如果有其他网页链接到该网页。

      如果您不具备服务器的 root 权限，可借助非常实用的 noindex 控制对您网站中各个网页的访问权限。

## 实施 noindex

      实施 noindex 的方法有两种：将其作为 <meta> 标记实施，或作为 HTTP 响应标头实施。这两种方法的效果相同，从中选择更方便您网站采用并且更适合相应内容类型的那一种方法即可。Google 不支持在 robots.txt 文件中指定 noindex 规则。

      您还可以将 noindex 规则与其他控制索引的规则结合使用。例如，您可以结合使用 nofollow 提示和 noindex 规则：
      <meta name="robots" content="**noindex, nofollow**" />。

### <meta> 标记

      为防止支持 noindex 规则的所有搜索引擎**将您网站上的某个网页编入索引，并将以下 <meta> 标记添加到网页的 <head> 部分：

```

<meta name="robots" content="noindex">
```

若想仅阻止 Google 网页抓取工具将网页编入索引，请使用以下元标记**：

```

<meta name="googlebot" content="noindex">
```

      请注意，某些搜索引擎对 noindex 规则可能会有不同的解读。因此，您的网页可能仍会出现在其他搜索引擎的结果中。

      [详细了解 noindex <meta> 标记](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#robotsmeta)。

        **如果您使用 Wix、WordPress 或 Blogger 等 CMS**，则可能无法直接修改 HTML，也可能不希望修改 HTML。实际上，您的 CMS 可能具有搜索引擎设置页面或其他某种机制，能够将 meta 标记告知搜索引擎。

        如果您要向网站添加 meta 标记，请在您的 CMS 上搜索有关修改网页 <head> 的说明（例如，搜索“wix add meta tags”）。

### HTTP 响应标头

      您可以在响应中返回值为 noindex 或 none 的 X-Robots-Tag HTTP 标头，而不是 <meta> 标记。
      响应标头可用于非 HTML 资源，例如 PDF、视频文件和图片文件。下面是一个 HTTP 响应示例，它含有一个 X-Robots-Tag 标头，用来指示搜索引擎不要将某一网页编入索引：

```

HTTP/1.1 200 OK
(...)
X-Robots-Tag: noindex
(...)
```

      [详细了解 noindex 响应标头](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#xrobotstag)。

### 调试 noindex 问题

      我们必须抓取您的网页，才能看到 <meta> 标记和 HTTP 标头。如果某个网页仍显示在搜索结果中，可能是因为在您添加 noindex 规则后我们尚未抓取过该网页。根据该网页在互联网中的重要性，Googlebot 可能需要数月时间才能重新访问该网页。您可以使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)请求 Google 重新抓取您的网页。

      如果您需要从 Google 搜索结果中快速移除网站上的某个网页，请参阅我们的[移除说明文档](https://developers.google.com/search/docs/crawling-indexing/remove-information?hl=zh-cn)。

      此外，也可能是因为 robots.txt 文件阻止 Google 网页抓取工具访问该网址，因此这些抓取工具无法发现此标记。若要允许 Google 访问您的网页，您必须[修改 robots.txt 文件](https://developers.google.com/search/docs/crawling-indexing/robots/submit-updated-robots-txt?hl=zh-cn)。

      最后，请确保 noindex 规则对 Googlebot 可见。如需测试您的 noindex 实现是否正确，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)查看 Googlebot 在抓取该网页时收到的 HTML。
      您还可以使用 Search Console 中的[“网页索引编制”报告](https://support.google.com/webmasters/answer/7440203?hl=zh-cn)监控您网站上 Googlebot 从中发现 noindex 规则的网页。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。