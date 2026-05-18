# Google 抓取工具（用户代理）概览 | Google 抓取基础设施  |  Crawling infrastructure  |  Google for Developers

> 原文链接: https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers?hl=zh-cn

---

- [

          Crawling infrastructure

  ](https://developers.google.com/crawling?hl=zh-cn)
- [

          文档

  ](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers?hl=zh-cn)

        使用集合让一切井井有条

      根据您的偏好保存内容并对其进行分类。

# Google 抓取工具和抓取器（用户代理）概览

  Google 使用抓取工具和抓取器针对其产品执行自动或用户请求的操作。 “抓取工具”（有时也称为“漫游器”或“蜘蛛”程序）是一个通用术语，泛指[自动发现和扫描网站](https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn#crawling)的任何程序。
  抓取工具会像 [wget](https://www.gnu.org/software/wget/) 这类程序一样运行，通常代表用户发出单个请求。Google 客户端分为三类：

  想了解本页面的最新动态？**
  请参阅我们的[文档更新](https://developers.google.com/crawling/docs/changelog?hl=zh-cn)。

    [常见抓取工具](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers?hl=zh-cn)

      用于 Google 产品的常见抓取工具（例如 [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn)）。它们始终会遵循自动抓取的 robots.txt 规则。

    [特殊情况下的抓取工具](https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers?hl=zh-cn)

      特殊爬虫与常见爬虫类似，但由特定产品使用，并且被抓取的网站与 Google 产品之间会就抓取过程达成协议。例如，AdsBot 会在广告发布商许可的情况下忽略全局 robots.txt 用户代理 (*)。

    [用户触发的抓取器](https://developers.google.com/crawling/docs/crawlers-fetchers/google-user-triggered-fetchers?hl=zh-cn)

      用户触发的抓取工具是最终用户触发抓取操作的工具和产品功能。例如，[Google 网站验证工具](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)会响应用户请求。

## Google 抓取工具和抓取器的技术特性

  Google 的抓取工具和抓取器可在数千台计算机上同时运行，以提高性能并随着网络规模的扩大而扩展其作用范围。为了优化带宽使用情况，这些客户端会分布在全球各地的许多数据中心，以便位于它们可能会访问的网站附近。因此，您的日志可能会显示来自多个 IP 地址的访问。Google 主要会从美国境内的 IP 地址发出请求。如果 Google 检测到某个网站屏蔽了来自美国的请求，则可能会尝试从位于其他国家/地区的 IP 地址进行抓取。

### 支持的传输协议

  Google 抓取工具支持 HTTP/1.1 和 [HTTP/2](https://en.wikipedia.org/wiki/HTTP/2)。抓取工具将使用可提供最佳抓取性能的协议版本，并且可能会在抓取会话之间切换协议，具体取决于之前的抓取统计信息。Google 抓取工具使用的默认协议版本为 HTTP/1.1；通过 HTTP/2 抓取可以为网站和 Googlebot 节省计算资源（例如 CPU、RAM），但不会为网站带来任何 Google 产品专属优势（例如，不会在 Google 搜索中提升排名）。
  如需禁止通过 HTTP/2 抓取，请对托管您网站的服务器做出以下指示：当 Google 尝试通过 HTTP/2 访问您的网站时，返回 421 HTTP 状态代码。如果这种方法不可行，您[可以向抓取团队发送消息](https://www.google.com/webmasters/tools/googlebot-report?hl=zh-cn)（但这只是临时解决方案）。

  Google 抓取工具基础架构还支持通过 FTP（如 [RFC959](https://datatracker.ietf.org/doc/html/rfc959) 及其更新所定义）和 FTPS（如 [RFC4217](https://datatracker.ietf.org/doc/html/rfc4217) 及其更新所定义）进行抓取，但通过这些协议进行抓取的情况很少发生。

### 支持的内容编码

  Google 的抓取工具和抓取器支持以下内容编码（压缩）方式：[gzip](https://en.wikipedia.org/wiki/Gzip)、[deflate](https://en.wikipedia.org/wiki/Deflate) 和 [Brotli (br)](https://en.wikipedia.org/wiki/Brotli)。每个 Google 用户代理支持的内容编码都会在其发出的每个请求的 Accept-Encoding 标头中进行通告。例如：Accept-Encoding: gzip, deflate, br。

### 文件大小限制

  默认情况下，Google 抓取工具只会抓取文件的前 15MB 内容，超出此限制的任何内容都会被忽略。但是，各个项目可能会为其抓取工具设置不同的限制，也会为不同的文件类型设置不同的限制。例如，[Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn) 等 Google 抓取工具可能具有较小的文件大小限制（例如 2MB），或者为 PDF 指定的文件大小限制比为 HTML 指定的文件大小限制更高。

### 抓取速度和主机负载

  我们的目标是，每次访问您的网站时都尽可能多地抓取网页，但不会过多地占用服务器的带宽。如果您的网站跟不上 Google 的抓取请求频率，您可以[减慢抓取速度](https://developers.google.com/crawling/docs/crawlers-fetchers/reduce-crawl-rate?hl=zh-cn)。
请注意，向 Google 抓取工具发送不适当的 [HTTP 响应代码](https://developers.google.com/search/docs/crawling-indexing/http-network-errors?hl=zh-cn)可能会影响您的网站在 Google 产品中的呈现效果。

### HTTP 缓存

  Google 的抓取基础架构支持 [HTTP 缓存标准](https://httpwg.org/specs/rfc9111.html)所定义的启发式 HTTP 缓存，具体而言，就是通过 ETag 响应标头和 If-None-Match 请求标头以及 Last-Modified 响应标头和 If-Modified-Since 请求标头提供支持。

  注意：无论 Google 抓取工具的偏好设置如何，都应考虑同时设置 Etag 和 Last-Modified 值。这些标头也可供其他应用（例如 CMS）使用。

  如果 HTTP 响应中同时包含 ETag 和 Last-Modified 响应标头字段，Google 抓取工具会使用 ETag 值（根据[ HTTP 标准的要求](https://www.rfc-editor.org/rfc/rfc9110.html#section-13.1.3)）。具体而言，对于 Google 抓取工具，我们建议您使用 [ETag](https://www.rfc-editor.org/rfc/rfc9110#name-etag) 而非 Last-Modified 标头来指明缓存偏好设置，因为 ETag 不会出现日期格式问题。

  不支持其他 HTTP 缓存指令。

  各个 Google 抓取工具和抓取器可能会但也可能不会使用缓存，具体取决于它们所关联的产品的需求。例如，Googlebot 在为 Google 搜索重新抓取网址时支持缓存，而 Storebot-Google 仅在特定条件下支持缓存。

  如需为您的网站实现 HTTP 缓存，请与您的托管或内容管理系统提供商联系。

#### ETag 和 If-None-Match

  Google 的抓取基础架构支持 [HTTP 缓存标准](https://httpwg.org/specs/rfc9111.html)所定义的 ETag 和 If-None-Match。详细了解 [ETag](https://www.rfc-editor.org/rfc/rfc9110#name-etag) 响应标头和与之对应的请求标头 [If-None-Match](https://www.rfc-editor.org/rfc/rfc9110#name-if-none-match)。

#### Last-Modified 和 If-Modified-Since

  Google 的抓取基础架构支持 [HTTP 缓存标准](https://httpwg.org/specs/rfc9111.html)所定义的 Last-Modified 和 If-Modified-Since，但要注意以下事项：

- Last-Modified 标头中的日期格式必须符合 [HTTP 标准](https://www.rfc-editor.org/rfc/rfc9110.html)。为了避免出现解析问题，我们建议您使用以下日期格式：“星期几，DD Mon YYYY HH:MM:SS 时区”。例如，“Fri, 4 Sep 1998 19:15:56 GMT”。
- 虽然并非强制性要求，但建议您设置 [Cache-Control 响应标头的 max-age 字段](https://www.rfc-editor.org/rfc/rfc9111.html#name-max-age-2)，从而帮助抓取工具确定何时重新抓取特定网址。将 max-age 字段的值设置为预计内容保持不变的秒数。例如 Cache-Control: max-age=94043。

  详细了解 [Last-Modified](https://www.rfc-editor.org/rfc/rfc9110#name-last-modified) 响应标头和与之对应的请求标头 [If-Modified-Since](https://www.rfc-editor.org/rfc/rfc9110#name-if-modified-since)。

## 验证 Google 抓取工具和抓取器

  Google 抓取工具会通过以下三种方式表明自己的身份：

1. HTTP user-agent 请求标头。
2. 请求的源 IP 地址。
3. 源 IP 的反向 DNS 主机名。

  了解如何使用这些详细信息[验证 Google 抓取工具和抓取器](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。