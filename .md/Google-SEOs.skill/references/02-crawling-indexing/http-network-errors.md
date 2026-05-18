# HTTP 状态代码对 Google 抓取工具的影响 | Google 抓取基础设施  |  Crawling infrastructure  |  Google for Developers

> 原文链接: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes?hl=zh-cn

---

- [

          Crawling infrastructure

  ](https://developers.google.com/crawling?hl=zh-cn)
- [

          文档

  ](https://developers.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers?hl=zh-cn)

        使用集合让一切井井有条

      根据您的偏好保存内容并对其进行分类。

# HTTP 状态代码对 Google 抓取工具的影响

  本文将深入探讨不同的 [HTTP 状态代码](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes)如何影响 Google 抓取您的 Web 内容。我们在本文中介绍了 Google 在网络上最常遇到的 20 个状态代码。但未介绍一些较奇特的状态代码，例如 [418 (I'm a teapot)](https://developer.mozilla.org/docs/Web/HTTP/Status/418)。

  除非另有说明，否则受支持协议（HTTP 和 FTP）的实验性功能默认不受支持。

## HTTP 状态代码

  HTTP 状态代码由托管网站的服务器生成，当它响应客户端（例如浏览器或抓取工具）发出的请求时，这些代码便会随之产生。每个 HTTP 状态代码都有不同的含义，但请求结果往往相同。例如，有多个状态代码会发出重定向信号，但它们的结果是相同的。

Search Console 会为 4xx--5xx 范围内的状态代码和失败的重定向 (3xx) 生成错误消息。如果服务器返回 2xx 状态代码，则响应中接收到的内容可能会被考虑编入索引。

  对于 Google 搜索，HTTP 2xx (success) 状态代码并不能保证一定会编入索引。

  下表包含 Google 最常遇到的 HTTP 状态代码，并解释了 Google 如何处理各个状态代码。

    HTTP 状态代码**

### 
      2xx (success)

        Google 会考虑处理相应内容（例如，对于 Google 搜索，会考虑将其编入索引）。如果内容暗示 Google 搜索存在错误，例如显示空白页面或错误消息，Search Console 就会显示 [soft 404 错误](https://support.google.com/webmasters/answer/7440203?hl=zh-cn#zippy=,errors)。

            200 (success)

              Google 会将收到的任何内容传递给下一个处理步骤（具体取决于产品）。
              对于 Google 搜索，下一个系统是索引编制流水线。索引编制系统可能会将内容编入索引，但不保证一定会。

          201 (created)

          202 (accepted)

              Google 会等待内容一段时间，然后将其接收的任何内容传递给下一个处理步骤（具体取决于产品）。超时时长取决于用户代理，例如，Googlebot Smartphone 的超时时长可能与 Googlebot Image 的不同。

          204 (no content)

              Google 无法接收任何内容，因此无法处理这些内容。

### 
      3xx (redirection)

       默认情况下，Google 抓取工具会跟踪最多 10 次重定向。不过，特定产品的抓取工具可能有不同的限制。例如，Googlebot 在抓取一般 Web 内容时通常会跟踪 10 次重定向，但 Google 检查工具不会跟踪重定向。

        Google 会忽略从重定向网址收到的所有内容，转而处理最终目标网址的内容。对于 robots.txt 文件，请了解 [Google 如何处理返回 3xx 状态代码的 robots.txt 文件](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec?hl=zh-cn#redirection)。

          301 (moved permanently)

              Google 会遵循重定向指令，并且 Google 系统会将重定向用作指示应处理重定向目标的**强**信号。

          302 (found)

              默认情况下，Google 抓取工具会跟踪重定向，并且 Google 系统会将该重定向用作指示应处理重定向目标的**弱**信号。其他产品可能会以不同的方式处理重定向。

          303 (see other)

          304 (not modified)

              Google 抓取工具会向下一个处理系统发出信号，指示内容与上次抓取的内容相同。对于 Google 搜索，索引编制流水线可能会重新计算网址的信号，除此之外，此状态代码对索引编制没有任何影响。

          307 (temporary redirect)
          等同于 302。

          308 (moved permanently)
          等同于 301。

      虽然 Google 会以相同的方式处理这些状态代码，但请注意，它们在语义上是不同的。请使用适合重定向的状态代码，以便其他客户端（例如电子阅读器、其他搜索引擎）可以从中受益。

### 
      4xx (client errors)

        Google 不会使用返回 4xx 状态代码的网址中的内容。如果某个网址曾被使用，但现在返回 4xx 状态代码，Google 系统会逐渐停止使用该网址。对于 Google 搜索，Google 不会将返回 4xx 状态代码的网址编入索引，而已编入索引且返回 4xx 状态代码的网址会从索引中移除。

        Google 会忽略从返回 4xx 状态代码的网址收到的任何内容。

          400 (bad request)

              系统对 429 之外的所有 4xx 错误都采用同一种处理方式：Google 抓取工具会通知下一个处理系统内容不存在。

              对于 Google 搜索，如果网址之前已编入索引，索引编制流水线会将该网址从索引中移除。系统不会处理新遇到的 404 网页。
              抓取频率会逐渐降低。

          请勿使用 401 和 403 状态代码限制抓取速度。4xx 状态代码（429 除外）对抓取速度没有影响。
          [了解如何限制抓取速度](https://developers.google.com/crawling/docs/crawlers-fetchers/reduce-crawl-rate?hl=zh-cn)。

          401 (unauthorized)

          403 (forbidden)

          404 (not found)

          410 (gone)

          411 (length required)

          429 (too many requests)

              Google 抓取工具会将 429 状态代码视为服务器过载的信号，这被视为服务器错误。

### 
      5xx (server errors)

        5xx 和 429 服务器错误会提示 Google 抓取工具暂时减慢抓取速度。对于 Google 搜索，已编入索引的网址仍会保留在索引中，但最终会被丢弃。

        Google 会忽略从返回 5xx 状态代码的网址收到的任何内容。对于 robots.txt 文件，请了解 [Google 如何处理返回 5xx 状态代码的 robots.txt 文件](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec?hl=zh-cn#server-error)。

        一旦服务器开始以 2xx 状态代码响应，Google 就会逐渐提高对该网站的抓取速度。

          500 (internal server error)

              Google 会降低网站的抓取速度。抓取速度下降幅度与返回服务器错误的具体网址数量成比例。
                  对于 Google 搜索，Google 的索引编制流水线会从索引网址中移除始终返回服务器错误的网址。

          502 (bad gateway)

          503 (service unavailable)

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。