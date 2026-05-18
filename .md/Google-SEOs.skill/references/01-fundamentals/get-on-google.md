# 如何使信息显示在 Google 搜索结果中 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/fundamentals/get-on-google?hl=zh-cn

---

  # 使您的网站显示在 Google 搜索结果中

Google 会自动查找可添加到 Google 索引中的网站；通常您无需执行任何操作，只需将网站发布到网络上即可。但是，网站有时会被遗漏。检查您的网站是否已收录到 Google 中，并了解如何让您的内容在 Google 搜索中更易于被发现。

## 
  让网页出现在 Google 搜索结果中的基本核对清单

  首先，您需要问自己以下几个有关网站的基本问题。您可在 [SEO 入门指南](https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn)中找到更多入门信息。

### 
  您的网站是否会显示在 Google 搜索结果中？

  如需查看您的网页是否已经[编入索引](https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn#indexing)，请在 Google 搜索中按以下查询格式搜索您的网站。请将“example.com”换成您的网站地址。

```
site:example.com
```

  site: 运算符不一定会返回按照查询中指定的前缀编入索引的所有网址。[详细了解 site: 运算符](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site?hl=zh-cn)。

  虽然 Google 可抓取数十亿个网页，但难免也会遗漏部分网站。造成抓取工具遗漏网站的常见原因如下：

- **您的网站没有链接到网络上的其他网站。**看看能否让其他网站链接到您的网站（但请不要为了让其他网站链接到您的网站而向他们付费；这可能会被视为[违反了 Google 的网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#link-spam)）。
- **您刚刚推出新的网站，Google 还没来得及[抓取](https://developers.google.com/search/docs/fundamentals/how-search-works?hl=zh-cn#crawling)。**Google 可能需要几周的时间才会注意到新网站或您对现有网站做出的任何更改。
- **网站设计致使 Google 很难有效抓取其内容。**如果您的网站是基于其他一些专业技术（而非 HTML）构建的，Google 可能会无法正确抓取该网站。请务必在您的网站上使用文字（不要仅使用图片或视频）。
- **Google 尝试抓取您的网站时遇到了错误。**最常见的原因是：您的网站设有登录页面，或者出于某种原因禁止 Google 访问。请确保您可在[无痕式窗口](https://support.google.com/chrome/answer/95464?hl=zh-cn)中访问您的网站。
- **Google 漏掉了您的网站**：虽然 Google 能抓取数十亿网页，但不可避免地会漏掉一些网站，特别是小网站。请稍作等待，并设法让其他网站链接到您的网站。

      如果您想尝试新鲜事物，可以[在 Search Console 中添加您的网站](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)，看看是否存在可能会导致 Google 无法理解您网站的错误。您也可以[向我们发送最重要的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)，让我们知道应该抓取这些网址并可能将其编入索引。

  遵循 [Google 搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)，确保您满足了要显示在 Google 上需遵循的网站指南要求。

### 
  您是否为用户提供了优质内容？

  您的首要任务是确保用户在您的网站上获得最好的体验。想一想是什么让您的网站变得独一无二、具有价值或吸引力。为帮助您评估内容，我们在[创建实用、可靠且以用户为中心的内容](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=zh-cn)指南中列出了一些自我评估问题供您参考。
  若要确保您管理网站的做法方便 Google 抓取您的网站内容，请阅读[搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)。

### 
  您的本地商家是否会显示在 Google 搜索结果中？

  商家资料可帮助您管理商家信息在 Google 搜索和 Google 地图等各种 Google 平台中的展示方式。您可以考虑[声明对商家资料的所有权](https://www.google.com/business/?hl=zh-cn)。

### 
  使用各种设备的用户都能轻松快速地访问您的网站内容吗？

  如今大多数搜索都是通过移动设备完成的；所以请确保优化您的内容，使其能在各种尺寸的屏幕上快速加载并正常显示。
  您可以使用 [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview?hl=zh-cn) 等工具来测试您的网页是否适合在移动设备上浏览。

### 
  您的网站是否安全？

  当今用户都希望能获得安全的在线体验，
  [因此请使用 HTTPS 确保网站连接的安全性](https://web.dev/articles/enable-https?hl=zh-cn)。

### 
  您是否需要其他帮助？

  SEO（搜索引擎优化）人员是协助您改善网站的专业人士，可以帮助提高您的网站在搜索引擎上的曝光度。详细了解[雇佣搜索引擎优化人员的原因和方式](https://developers.google.com/search/docs/fundamentals/do-i-need-seo?hl=zh-cn)。

### 
  您的内容是否与某个专门化的主题有关？

  根据内容的要旨，您可以通过多种方式在 Google 上展示该内容。下表提供了 Google 提供的不同途径的链接，这些途径可用于将您的与某个商家或个人相关的内容显示在 Google 上。

  商家或个人

    [Google for Retail**](https://www.google.com/ads/shopping/index.html?hl=zh-cn)
    若要在 Google 购物、Google 优惠以及其他产品/服务上宣传您的商品，您可以向 Google 搜索提交您的电子版商品清单。

    [**Google for Small Business**](https://smallbusiness.withgoogle.com)
    了解 Google 提供了哪些能助力小型企业发展壮大的资源。

    [**街景**](https://www.google.com/streetview/earn/?hl=zh-cn)
    邀请客户以虚拟方式游览您的商家。

    [**知识面板**](https://support.google.com/knowledgepanel/answer/9163198?hl=zh-cn)
    若想在 Google 上管理自己的个人、商家或组织身份，您可以[针对自己的知识面板条目提出更改建议](https://support.google.com/knowledgepanel/answer/7534842?hl=zh-cn)。

  如需详细了解如何在 Google 上展示数字内容，请查看以下资源：

  数字内容

    [**Google 图书和电子书**](https://support.google.com/books/partner/answer/3324395?hl=zh-cn)
     在线推广您的图书，并通过我们的电子书商店出售您的图书。

    [**学术搜索**](https://scholar.google.com/intl/en/scholar/about.html?hl=zh-cn)
    将学术作品收录在 Google 的学术索引中。

    [**Google 新闻**](https://support.google.com/news/publisher-center/answer/9607025?hl=zh-cn)
    显示在 Google 新闻搜索结果中，或提供数字版本供订阅。

  如需在 Google 上展示本地信息，以下资源可能会对您有所帮助：

  本地信息

    [**Google 地图内容合作伙伴**](https://contentpartners.maps.google.com/?hl=zh-cn)
    如果您是区域数据的权威或官方来源，请通过 Google 发布数据。

    [**全景照片**](https://www.google.com/maps/about/contribute/photosphere/?hl=zh-cn)
    拍摄 360° 照片并分享世界各地的美景。

    [**街景**](https://www.google.com/streetview/contributors/?hl=zh-cn)
    提供对您所拥有的建筑物的全景虚拟导览。

    [**公交合作伙伴计划**](https://support.google.com/transitpartners/answer/1111481?hl=zh-cn)
    提供简便的路线、时刻表和票价查询服务，鼓励大家使用公共交通工具。

  媒体

    [**Google 地图内容合作伙伴**](https://contentpartners.maps.google.com/?hl=zh-cn)
    如果您是区域数据的权威或官方来源，请通过 Google 发布数据。

    [**Google 搜索中的视频**](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)
    使 Google 搜索能找到和抓取您的视频。

    [**YouTube**](https://www.youtube.com/t/partnerships_faq?hl=zh-cn)
    上传、分发视频，并从中获利。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。