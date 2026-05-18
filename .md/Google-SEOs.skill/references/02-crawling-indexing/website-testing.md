# 有关在 Google 搜索中进行 A/B 测试的最佳实践 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/website-testing?hl=zh-cn

---

# 最大限度地降低 A/B 测试在 Google 搜索中的影响

  本文将介绍如何确保在测试网页内容或网页网址变体时，最大限度地降低对网站在 Google 搜索中的排名的影响。虽然本文并不会阐述如何构建或设计测试，但您可在本文的末尾处找到更多与测试相关的资源。

## 测试概览

  网站测试是指试用网站（或网站的某一部分）的不同版本并收集与用户对每个版本的反应相关的数据。

- **A/B 测试**是指测试某项变更的两个（或更多）变体。例如，您可以测试为按钮使用不同字体的效果，看看这能否增加按钮点击次数。
- **多变量测试**是指您一次可以测试多种类型的更改，看看每项更改的影响以及更改之间的潜在协同关系。
        例如，您不仅可以为某个按钮试用多种字体，还可以尝试同时更改（和不更改）网页其余部分的字体。新字体是否更便于阅读？是否应该在所有地方使用？或者，按钮字体看起来是否有别于网页的其余部分？这是否有助于吸引用户的注意力？

您可以使用软件比较网页（网页的某些部分、整个网页或整个多页流程）的不同变体的行为，并跟踪哪个版本对用户最有效。

  您可以为某个网页创建多个版本来运行测试，每个版本都要有自己的网址。
  当用户尝试访问原始网址时，您需将部分用户分别重定向到每个变体网址，然后比较用户的行为以了解哪个网页最有效。

  您还可以通过在网页上动态插入变体来运行测试，而无需更改网址。您可以使用 JavaScript 来决定显示哪个变体。

  即使 Google 在您运行测试期间抓取了您的部分内容变体或将其编入了索引，也可能无关紧要，具体取决于您正在测试什么类型的内容。一些细微的更改（例如按钮或图片的尺寸、颜色或放置位置，或“号召性用语”的文字[“加入购物车”/“立即购买！”]）可能会对用户与网页的互动情况产生出乎意料的影响，但对该网页的搜索结果摘要或排名却往往只会产生极小的影响或者毫无影响。

此外，如果我们对您网站的抓取频次足以让系统检测到您的实验内容并将其编入索引，那么在您完成实验后，我们可能也会以足够快的速度将您对网站做出的最终更新编入索引。

## 测试时的最佳做法

  要想避免在测试网站变体期间对网站的 Google 搜索行为造成任何不良影响，请参阅下列最佳做法：

### 不要伪装测试网页的真实内容

  请勿向 Googlebot 呈现一组网址，而向用户呈现另一组网址。这种行为称为[伪装真实内容](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#cloaking)，无论您是否在运行测试，这种做法都违反了我们的[网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)。请注意，违反 Google 的网络垃圾政策可能会导致您的网站从 Google 搜索结果中遭到降位或移除（这可能并不是您想要的测试结果）。

  只要您伪装了真实内容，无论是通过服务器逻辑或 robots.txt 还是通过任何其他方法，都会被视为违规行为。
  因此，您不妨改用下文所述的链接或重定向。

  使用 Cookie 控制测试时请注意，Googlebot 通常不支持 Cookie。这意味着，Googlebot 将只能检测到使用不支持 Cookie 的浏览器的用户可访问的内容版本。

### 使用 rel="canonical" 链接

  如果您针对多个网址运行测试，可对所有备用网址使用 [rel="canonical" 链接属性](https://support.google.com/webmasters/answer/139394?hl=zh-cn)，指明原始网址是首选版本。我们建议您使用 rel="canonical"（而非 noindex meta 标记），因为在这种情况下它更符合您的意图。例如，在测试首页的变体时，您并不想让搜索引擎避免将首页编入索引，而是只想告知搜索引擎，所有测试网址都是原始网址的近似副本或变体，因此应被归为一组且以原始网址作为规范网址。在这种情况下，使用 noindex（而非 rel="canonical"）有时可能会产生意外的不良影响。

### 使用 302（而非 301）重定向

  如果您运行的是会将用户从原始网址重定向到变体网址的测试，请使用 [302 (temporary) 重定向](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn#temporary)，而非 301 (permanent) 重定向。这会让搜索引擎知晓此重定向是临时的，只有当您运行实验时它才会奏效，并且它们应将原始网址保留在各自的索引中，而不应将其替换为重定向的目标（测试网页）。您也可以使用[基于 JavaScript 的重定向](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn#jslocation)。

### 实验仅持续必要的运行时长

  一项可靠的测试所需的时间将取决于转化率以及网站获得的流量等因素；一款优良的测试工具能够在您收集的数据足以得出可靠的结论时告知您。一旦完成测试，尽快使用所需的内容变体更新网站，并移除所有测试元素，例如备用网址或测试脚本和标记。如果我们发现某个网站运行实验的时间过长，我们可能会将此理解为试图欺骗搜索引擎并会采取相应措施，尤其是当您将一个内容变体提供给大量用户时。

## 详细了解测试

- 与内容实验相关的 [Google Analytics 文章](https://support.google.com/analytics/answer/9366791?hl=zh-cn)
- [Google Analytics 内容测试工具](https://marketingplatform.google.com/about/analytics/?hl=zh-cn)
- 在 [Analytics 帮助论坛](https://support.google.com/analytics/community?hl=zh-cn)中询问与测试相关的问题
- 在 [Google 搜索中心帮助论坛](https://support.google.com/webmasters/community?hl=zh-cn)中询问与对搜索结果的影响相关的问题。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。