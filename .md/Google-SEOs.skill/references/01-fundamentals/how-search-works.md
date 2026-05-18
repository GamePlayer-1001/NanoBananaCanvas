# Google 搜索运作方式的深度指南 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn

---

# 关于 Google 搜索运作方式的深度指南

  Google 搜索是一款全自动搜索引擎，会使用名为“网页抓取工具”的软件定期探索网络，找出可添加到 Google 索引中的网页。实际上，Google 搜索结果中收录的大多数网页都不是手动提交的，而是我们的网页抓取工具在探索网络时找到并自动添加的。本文档从网站的角度介绍了 Google 搜索运作方式的各个阶段。掌握这些基础知识可以帮助您解决抓取问题、让您的网页编入索引，并且了解如何优化您的网站在 Google 搜索结果中的呈现效果。

      想要查看专业性较低的内容？请查看我们的 [Google 搜索的运作方式](https://www.google.com/search/howsearchworks/?hl=zh-cn)网站，该网站从搜索用户的角度介绍了 Google 搜索的运作方式。

## 开始之前的一些注意事项

  在深入了解 Google 搜索的运作方式之前，请务必注意，Google 不会通过收取费用来提高网站抓取频率或网站排名。任何与此不符的消息均是子虚乌有。

  Google 不保证一定会抓取您的网页、将其编入索引或在搜索结果中显示您的网页，即使您的网页遵循 [Google 搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)也是如此。

## Google 搜索的 3 个阶段简介

Google 搜索的工作流程分为 3 个阶段，并非每个网页都会经历这 3 个阶段：

1. [**抓取**](#crawling)：Google 会使用名为“抓取工具”的自动程序从互联网上发现各类网页，并下载其中的文本、图片和视频。
2. [**索引编制**](#indexing)：Google 会分析网页上的文本、图片和视频文件，并将信息存储在大型数据库 Google 索引中。
3. [**呈现搜索结果**](#serving)：当用户在 Google 中搜索时，Google 会返回与用户查询相关的信息。

## 抓取

  第一阶段是找出网络上存在哪些网页。不存在包含所有网页的中央注册表，因此 Google 必须不断搜索新网页和更新过的网页，并将其添加到已知网页列表中。此过程称为“网址发现”。由于 Google 之前已经访问过某些网页，因此这些网页是 Google 已知的网页。在提取已知网页上指向新网页的链接时，Google 会发现其他网页，例如类别网页等中心页会链接到新的博文。当您以列表形式（[站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)）提交一系列网页供 Google 抓取时，Google 也会发现其他网页。

  Google 发现网页的网址后，可能会访问（或“抓取”）该网页以了解其中的内容。我们使用大量计算机抓取网络上的数十亿个网页。执行抓取任务的程序叫做 [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn)（也称为抓取工具、漫游器或“蜘蛛”程序）。Googlebot 使用算法流程确定要抓取的网站、抓取频率以及要从每个网站抓取的网页数量。[Google 的抓取工具](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers?hl=zh-cn)也经过编程，确保不会过快地抓取网站，避免网站收到过多请求。此机制基于网站的响应（例如，[HTTP 500 错误意味着“降低抓取速度”](https://developers.google.com/search/docs/crawling-indexing/http-network-errors?hl=zh-cn#http-status-codes)）。

  但是，Googlebot 不会抓取它发现的所有网页。某些网页可能被网站所有者设置为[禁止抓取](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt?hl=zh-cn#disallow)，而其他网页可能必须登录网站才能访问。

  在抓取过程中，Google 会使用最新版 [Chrome](https://www.google.com/chrome/?hl=zh-cn) 渲染网页并[运行它找到的所有 JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn#how-googlebot-processes-javascript)，此过程与浏览器渲染您访问的网页的方式类似。渲染很重要，因为网站经常依靠 JavaScript 将内容引入网页，缺少了渲染过程，Google 可能就看不到相应内容。

  能否抓取取决于 Google 的抓取工具能否访问网站。Googlebot 访问网站时的一些常见问题包括：

- [服务器在处理网站时出现问题](https://developers.google.com/search/docs/crawling-indexing/http-network-errors?hl=zh-cn#http-status-codes)
- [网络问题](https://developers.google.com/crawling/docs/troubleshooting/dns-network-errors?hl=zh-cn)
- [robots.txt 规则阻止 Googlebot 访问网页](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn)

## 编入索引

  抓取网页后，Google 会尝试了解该网页的内容。这一阶段称为“索引编制”，包括处理和分析文字内容以及关键内容标记和属性，例如 [<title> 元素](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn)和 Alt 属性、[图片](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)、[视频](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)等。

  在索引编制过程中，Google 会确定网页是否[与互联网上的其他网页重复或是否为规范网页](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)。
      规范网页是可能会显示在搜索结果中的网页。为了选择规范网页，我们首先会将在互联网上找到的内容类似的网页归为一组（也称为聚类），然后从中选择最具代表性的网页。该组网页中的其他网页可作为备用版本在不同情况下提供，例如用户在移动设备上进行搜索时，或他们正在查找该组网页中的某个具体网页时。

  Google 还会收集关于规范网页及其内容的信号，这些信号可能会在下一阶段（即在搜索结果中呈现网页）时用到。一些信号包括网页语言、内容所针对的国家/地区、网页易用性。

  所收集的关于规范网页及其网页群组的相关信息可能会存储在 Google 索引（托管在数千台计算机上的大型数据库）中。我们无法保证网页一定会编入索引；并非 Google 处理的每个网页都会编入索引。

  是否会编入索引还取决于网页内容及其元数据。一些常见的索引编制问题可能包括：

- [网页内容质量低](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [Robots meta 规则禁止编入索引](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn)
- [网站的设计可能使索引编制难以进行](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn)

## 呈现搜索结果

      Google 不会通过收取费用来提高网页排名，网页排名是程序化地完成的。
      [详细了解 Google 搜索结果中的广告](https://www.google.com/search/howsearchworks/our-approach/ads-on-search/?hl=zh-cn)。

  用户输入查询时，我们的机器会在索引中搜索匹配的网页，并返回我们认为与用户的搜索内容最相关的优质结果。相关性是由数百个因素决定的，其中可能包括用户的位置、语言和设备（桌面设备或手机）等信息。例如，在用户搜索“自行车维修店”后，Google 向巴黎用户显示的结果与向香港用户显示的结果有所不同。

  根据用户的查询，搜索结果页上显示的搜索功能也会发生变化。例如，如果您搜索“自行车维修店”，系统可能会显示本地搜索结果，而不会显示[图片搜索结果](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#image-result)；不过，搜索“现代自行车”更有可能显示图片搜索结果，但不会显示本地搜索结果。您可以在我们的[视觉元素库](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn)中探索 Google 网页搜索中最常见的界面元素。

  Search Console 可能提示您某个网页已编入索引，但您在搜索结果中看不到该网页。
  这可能是因为：

- [网页内容与用户查询无关](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn#expect-search-terms)
- [内容质量低](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [Robots meta 规则阻止提供内容](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn)

  虽然本指南介绍了 Google 搜索的运作方式，但我们一直在努力改进算法。
  您可以关注 [Google 搜索中心博客](https://developers.google.com/search/blog?hl=zh-cn)，及时了解这些更改。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。