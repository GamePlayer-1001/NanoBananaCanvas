# 技术型 SEO 技巧与策略 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/fundamentals/get-started?hl=zh-cn

---

  # 网站的 SEO 维护

如果您的网站已收录到 Google 上，并且您熟悉[搜索引擎优化 (SEO) 的基础知识](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn)，则可以采取更多措施来改善您的网站在 Google 中的显示效果。在管理和维护网站时，您可能会遇到一些影响 Google 搜索的独特情形。本指南介绍了更多深入的 SEO 任务，例如为网站迁移做好准备或管理多语言网站。

## 控制 Google 抓取网站和将其编入索引的方式

查看我们的指南以了解 [Google 搜索的运作方式](https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn)；如果您未能充分了解抓取/索引/呈现流水线，则很难进行网站调试或预测 Google 搜索对您网站采取的行为。

### 
      重复内容

请务必了解[规范网页的定义](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn#definition)及其对网站的抓取和索引编制有何影响。

### 
      资源

请确保要让 Google 抓取的所有资源（图片、CSS 文件等）或网页均可供 Google 访问；也就是说，它们没有被任何 robots.txt 规则屏蔽，并且可供匿名用户访问。无法访问的网页不会显示在[“网页索引编制”报告](https://search.google.com/search-console/index?hl=zh-cn)中，而[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)会将其显示为未抓取。被屏蔽的资源仅会在网址检查工具中显示为具体网址级资源。如果网页上的重要资源被屏蔽，这可能会导致 Google 无法正确抓取该网页。使用网址检查工具可以呈现实际网页，以验证 Google 能否看到您所预期的网页样貌。

### 
      Robots.txt

使用 robots.txt 规则可以阻止系统抓取内容，使用站点地图可以帮助系统抓取内容。您可以禁止 Google 抓取网站上的重复内容，或禁止其抓取不太重要的资源（例如图标或徽标之类的常用小图片），以免使您的服务器收到过多请求。不要将 robots.txt 用作一种阻止 Google 将内容编入索引的机制；而应借助 noindex 标记或登录要求实现此目的。[详细了解如何阻止 Google 访问您的内容。](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share?hl=zh-cn)

### 站点地图

站点地图非常关键，可以告知 Google 哪些网页对您的网站很重要，同时还提供其他信息（例如更新频率），并且对于抓取非文字内容（例如图片或视频）也很重要。虽然 Google 不会只抓取站点地图中列出的网页，但它会优先抓取这些网页。对于内容随时变化的网站或可能无法通过链接发现的网页，这一点尤为重要。使用站点地图有助于 Google 发现网站上可供抓取的网页，并优先抓取这些网页。[点击此处可详细了解站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)。

### 国际化网站或多语言网站

如果您的网站包含多种语言，或者以特定语言区域的用户为目标用户，请注意以下几点：

- [了解多区域和多语言网站](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=zh-cn)，获取关于如何管理针对不同语言或区域提供本地化内容的网站的高级建议。
- [使用 hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions?hl=zh-cn) 告知 Google 不同语言版本的网页。
- 如果网站会根据请求的语言区域调整其网页内容，请了解[这对 Google 抓取网站的方式有何影响](https://developers.google.com/search/docs/specialty/international/locale-adaptive-pages?hl=zh-cn)。

### 迁移网页或网站

如果您可能需要迁移单个网址乃至整个网站，请遵循以下指南：

#### 迁移单个网址

如果您将网页永久迁移至其他地址，请记得[为网页实现 301 重定向](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn)。如果由于某种原因而只是暂时迁移，则返回 302 以告知 Google 继续抓取您的网页。

当用户请求访问的网页已被移除时，您可以创建自定义 404 网页以提供更好的体验。请确保当用户请求访问的网页已不存在时，您返回 true 的 404 错误，而不是 [soft 404](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors?hl=zh-cn#soft-404-errors)。

#### 迁移网站

如果您要迁移整个网站，请实施所需的所有 301 和站点地图更改，然后告知 Google 迁移情况，以便我们开始抓取新网站并将您的信号转发到新网站。
      [了解如何迁移网站。](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes?hl=zh-cn)

### 遵循抓取和索引编制最佳实践

- **[确保链接可供抓取](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn#crawlable-links)。**
- **对付费链接、需要登录的链接或不受信任的内容（例如用户提交的内容）[使用 rel=nofollow](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn)**，以免将良好的信号传递给它们，或者让它们的低劣质量牵连到您。
- **[管理抓取预算](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget?hl=zh-cn)**：
        如果您的网站规模过大（包含数亿个会定期更改的网页，或包含数以千万计经常更改的网页），Google 可能无法经常抓取整个网站。因此，您可能需要向 Google 指明网站上最重要的网页。目前实现此目的的最佳机制是在站点地图中列出最近更新的网页或最重要的网页，并使用 robots.txt 规则隐藏不太重要的网页。
- **JavaScript 用法**：遵循 [Google 关于网站 JavaScript 的建议](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn)。
- **多页文章**：如果您的文章分为几个页面，请确保有可供用户点击的下一页和上一页链接，并且这些链接是可抓取的链接。您只需这样做，Google 就可以抓取这种网页集。
- **无限滚动网页**：Google 可能无法滚动浏览无限滚动网页；如果您想让网页可被抓取，则提供分页版本。[详细了解易于搜索的无限滚动式网页](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading?hl=zh-cn#paginated-infinite-scroll)。
- **禁止访问会更改状态的网址**，例如可以在其中发布评论、创建账号、向购物车添加商品或执行其他操作的网页网址。使用 [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn) 屏蔽这些网址。
- 查看[可供 Google 编入索引的文件类型的列表](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types?hl=zh-cn)。
- 在少数情况下，如果 **Google 似乎过于频繁地抓取您的网站**，您可以将网站的[抓取速度调慢一些](https://developers.google.com/search/docs/crawling-indexing/reduce-crawl-rate?hl=zh-cn)。不过，这种情况很罕见。
- 如果网站仍采用 HTTP，我们建议您[改用 HTTPS](https://web.dev/articles/enable-https?hl=zh-cn)，确保[用户的安全以及您自身的安全](https://developers.google.com/search/blog/2018/12/why-how-to-secure-your-website-https?hl=zh-cn)。

## 帮助 Google 了解网站

以文字（而非图形）的形式在网站上展现关键信息。虽然 Google 可以解析[多种文件类型](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types?hl=zh-cn)并将其编入索引，但文字仍然是帮助我们了解网页内容的最安全选择。如果您使用非文字内容，或者想提供网站内容方面的其他导引，请向网页添加[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)，帮助我们了解您的内容（在某些情况下，还要提供[富媒体搜索结果](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)等特殊搜索功能）。

如果您熟悉 HTML 和基本编程技巧，可以按照[开发者指南](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)手动添加结构化数据。如果您需要指导，可以使用所见即所得[结构化数据标记助手](https://support.google.com/webmasters/answer/3069489?hl=zh-cn)帮助您生成基本结构化数据。

如果您无法向网页添加结构化数据，可以使用[数据标注工具](https://support.google.com/webmasters/answer/2753960?hl=zh-cn)突出显示网页的各个部分，并告知 Google 每个部分代表着什么（活动、日期、价格等等）。这很简单，但如果您更改网页的布局，则可能会出现问题。

[详细了解如何帮助 Google 了解您的网站内容](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn#understand_your_content)。

## 遵循我们的指南

    注意**：请务必遵守我们的 [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn) 指南。其中的部分指南是建议和最佳实践；其他的则是您必须遵循的指南，如未遵循可能会导致网站从 Google 索引中移除。

### 针对特定内容的指南

如果您的网站上有特定类型的内容，请参考以下建议，了解如何以最佳方式在 Google 上展示这些内容：

- **视频**：请务必遵循我们的[视频最佳实践](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)，以便 Google 能够找到、抓取托管在您网站上的视频并显示视频搜索结果。
- **图片**：请遵循我们的[图片最佳实践](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)，使您的图片显示在 Google 搜索结果中。您可以在图片托管网页上[提供图片元数据](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata?hl=zh-cn)，以便在 Google 图片中显示图片的其他相关信息。若要禁止将图片编入索引，请[使用 robots.txt Disallow 规则](https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page?hl=zh-cn)。
- **面向儿童**：如果您的内容专门面向儿童，请[将您的网页或网站标记为面向儿童](https://developers.google.com/search/docs/advanced/guidelines/tag-child-directed-treatment?hl=zh-cn)，以便 Google 根据《儿童在线隐私保护法》([COPPA](https://business.ftc.gov/privacy-and-security/childrens-privacy)) 将其视为面向儿童的内容。
- **成人网站**：如果您的网站（或特定网页）包含成人内容，不妨考虑[将其标记为成人内容](https://developers.google.com/search/docs/crawling-indexing/safesearch?hl=zh-cn)，以便系统在安全搜索结果中滤除该内容。
- **新闻**：如果您运营的是新闻网站，请参考以下重要注意事项：如果您有新闻内容，请务必阅读 [Google Publisher Center 帮助文档](https://support.google.com/news/publisher-center/?hl=zh-cn)。
- 此外，您还可以创建 [Google 新闻站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap?hl=zh-cn)，帮助 Google 更快地发现内容。
- 请务必[防止您的网站上的滥用行为](https://developers.google.com/search/docs/monitor-debug/prevent-abuse?hl=zh-cn)。
- 如果您要限制未订阅或未登录的访问者浏览内容的次数，请参阅[灵活抽样](https://developers.google.com/search/docs/appearance/flexible-sampling?hl=zh-cn)一文，了解一些关于限制用户对网站内容的访问次数的最佳实践。
- 了解如何向 Google [指明您网站上的订阅和付费内容](https://developers.google.com/search/docs/appearance/structured-data/paywalled-content?hl=zh-cn)，并让 Google 依然能够抓取这些内容。
- 了解如何使用 meta 标记[限制在生成搜索结果摘要时对文字或图片的使用](https://developers.google.com/search/docs/crawling-indexing/special-tags?hl=zh-cn)。
- 考虑使用 [AMP](https://amp.dev) 或[网络故事](https://amp.dev/about/stories/)快速加载内容。

      **其他网站**（例如，关于商家、图书、应用、学术作品的网站）：查看您可以在其中发布信息的[其他 Google 服务](https://developers.google.com/search/docs/fundamentals/get-on-google?hl=zh-cn)。
      查看 [Google 是否支持专门针对您的内容类型的搜索功能](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)。Google 支持专门针对食谱、活动、招聘信息网站等的搜索功能。

## 管理用户体验

网站应该以提供良好的用户体验为首要目标，良好的用户体验也是决定网站排名的因素。提供良好的用户体验涉及很多要素；下文就介绍了其中的几个。

[我们建议网站使用 HTTPS](https://developers.google.com/search/blog/2018/12/why-how-to-secure-your-website-https?hl=zh-cn)（而不是 HTTP），以提高用户和网站的安全性。使用 HTTP 的网站可能会在 Chrome 浏览器中被标记为“不安全”。
      [了解如何使用 HTTPS 确保网站安全](https://web.dev/articles/enable-https?hl=zh-cn)。

与加载速度较慢的网页相比，加载速度较快的网页通常会获得更高的用户满意度。您可以在[“核心网页指标”报告](https://search.google.com/search-console/core-web-vitals?hl=zh-cn)中查看网站级性能数据，或使用 [PageSpeed Insights](https://pagespeed.web.dev/?hl=zh-cn) 测试各个网页的性能。若要详细了解如何制作能快速加载的网页，请访问 [web.dev 网站](https://web.dev/explore/fast?hl=zh-cn)。此外，您还可以考虑使用 [AMP](https://amp.dev/about/stories/) 提高网页加载速度。

### 移动设备注意事项

[全球 60% 以上的互联网用户会使用移动设备上网](https://www.statista.com/topics/779/mobile-internet/#topicOverview)，因此您的网站适合移动设备非常重要。现在，Google 将移动版抓取工具作为网站的默认抓取工具。[了解如何构建适合移动设备的网站](https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing?hl=zh-cn)。

## 控制搜索结果呈现

Google [在 Google 搜索中提供了多种搜索结果功能和体验](https://developers.google.com/search/docs/appearance/search-result-features?hl=zh-cn)，包括评价星级以及针对特定类型的信息（例如活动或食谱）的特殊搜索结果类型。了解哪些功能适合您的网站，并考虑实现这些功能。
      您可以[提供网站图标](https://developers.google.com/search/docs/appearance/favicon-in-search?hl=zh-cn)，使其显示在对您网站的搜索结果中；也可以[提供要在搜索结果中显示的文章日期](https://developers.google.com/search/docs/appearance/publication-dates?hl=zh-cn)。

请务必阅读关于如何帮助 Google 提供良好的[标题链接](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn)和[搜索结果摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)的文章。您还可以限制摘要长度，或根据需要完全省略摘要。了解如何使用 meta 标记[限制在生成搜索结果摘要时对文字或图片的使用](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#nosnippet)。

## 使用 Search Console

      Search Console 提供了各种报告，帮助您监控和优化网站在 Google 搜索中的表现。详细了解[要使用哪些报告](https://developers.google.com/search/docs/advanced/guidelines/search-console?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。