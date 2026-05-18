# Google 的 SEO 链接最佳实践 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn

---

  # Google 的链接最佳实践

在确定网页的相关性和查找可抓取的新网页时，Google 会使用链接作为信号。了解如何使您的链接可供抓取，以便 Google 能够通过您网页上的链接发现您网站上的其他网页；还可了解如何改进定位文字，以便用户和 Google 能够更轻松地理解您的内容。

## 确保链接可供抓取

一般来说，仅当链接是包含 href 属性的 <a> HTML 元素（也称为“锚标记元素”**）时，Google 才能抓取该链接。Google 抓取工具不会解析和提取其他格式的大部分链接。Google 无法可靠地从没有 href 属性的 <a> 元素中提取网址，也无法从因脚本事件而作为链接发挥作用的其他标记中提取网址。以下是 Google 可以跟踪以及无法跟踪的链接示例：

推荐（Google 可以解析）**

```
<a href="https://example.com">
```

```
<a href="/products/category/shoes">
```

```
<a href="./products/category/shoes">
```

```
<a href="/products/category/shoes" onclick="javascript:goTo('shoes')">
```

```
<a href="/products/category/shoes" class="pretty">
```

  如果您使用 JavaScript 将链接动态地插入网页，只要链接使用了上述 HTML 标记，也可供抓取。

**不推荐（但 Google 可能仍会尝试解析）：**

```
<a routerLink="products/category">
```

```
<span href="https://example.com">
```

```
<a onclick="goto('https://example.com')">
```

  请确保 <a> 元素中的网址会解析为实际网址（也就是说，它类似于 URI），以便 Google 抓取工具向其发送请求，例如：

**推荐（Google 可以解决）**：

```
<a href="https://example.com/stuff">
```

```
<a href="/products">
```

```
<a href="/products.php?id=123">
```

**不推荐（但 Google 可能仍会尝试解决）：**

```
<a href="javascript:goTo('products')">
```

```
<a href="javascript:window.location.href='/products'">
```

## 定位文字放置方式

  **定位文字（也称为链接文字**）是链接的可见文字。这类文字旨在将您会链接到的网页的相关信息告诉用户和 Google。定位文字的放置位置在 [Google 可抓取的 <a> 元素](#crawlable-links)之间。

**良好**：

**
  <a href="https://example.com/ghost-peppers">鬼椒**</a>

**欠佳（链接文字为空）**：

**
  <a href="https://example.com"></a>

  作为后备方案，如果 <a> 元素出于某种原因为空，Google 可以使用 title 属性作为定位文字。

  <a href="https://example.com/ghost-pepper-recipe" title="如何腌制鬼椒**"></a>

  对于图片作为链接的情况，Google 会使用 img 元素的 alt 属性作为定位文字，因此请务必[为图片添加描述性替代文本](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#descriptive-alt-text)：

**良好**：

**
  <a href="/add-to-cart.html"><img src="enchiladas-in-shopping-cart.jpg" alt="将辣椒肉馅玉米卷饼添加到购物车**"/></a>

**效果欠佳（替代文本和链接文字为空）：**

**
  <a href="/add-to-cart.html"><img src="enchiladas-in-shopping-cart.jpg" alt=""/></a>

  如果您使用 JavaScript 插入定位文字，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)确保它存在于所渲染的 HTML 中。

## 撰写优质定位文字

  优质定位文字应描述清楚、措辞简洁，且与其所在网页和链接到的网页相关。它可提供链接的背景信息，并为读者设定预期。
  定位文字越优质，用户就越容易浏览您的网站，Google 也就越能轻松地理解您所链接到的网页的内容。

欠佳（太宽泛）**：

**
      <a href="https://example.com">点击此处**</a>了解详情。

**
  <a href="https://example.com">了解详情**</a>。

    **
      在我们的<a href="https://example.com">网站**</a>上详细了解我们的奶酪。

    **
      我们有一篇<a href="https://example.com">文章**</a>提供了奶酪制作方式的更多背景信息。

    **提示**：不妨尝试仅阅读定位文字（不考虑上下文），看看其自身是否具体到可以说得通。如果您不知道网页的内容，则需要更具描述性的定位文字。

**较好（较具描述性）：**

     **如需查看可购买的奶酪的完整列表，请参阅<a href="https://example.com">奶酪类型列表**</a>。

**欠佳（长到离谱）**：

      **从下周二开始，<a href="https://example.com">Knitted Cow 会邀请威斯康星州当地居民参加其盛大的重开仪式，同时还会向前 20 名客户赠送奶牛形状的冰雕**</a>。

**较好（较简洁）：**

      **从下周二开始，<a href="https://example.com">Knitted Cow 会邀请威斯康星州当地居民**</a>参加其盛大的重开仪式，同时还会向前 20 名客户赠送奶牛形状的冰雕。

  撰写文字时应尽可能自然，且应克制自己的冲动，不要将与链接到的网页相关的每个关键字都强塞到链接内（请注意，[关键字堆砌](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#keyword-stuffing)违反了我们的网络垃圾政策）。扪心自问一下，读者是否需要这些关键字来理解下一页？如果您觉得您是在将关键字强塞到定位文字内，很可能就意味着关键字太多了。

  务必要提供链接的背景信息：链接前后的文字非常重要，因此要注意整个句子。切勿让链接彼此相连；会致使读者更难以区分链接，并且每个链接的周围文本会丢失。

**欠佳（太多链接彼此相连）**：

      **我<a href="https://example.com/page4">今**</a><a href="https://example.com/page5">**年**</a><a href="https://example.com/page1">**很**</a><a href="https://example.com/page2">**多**</a><a href="https://example.com/page3">**次**</a>写过奶酪的相关文章。

**更好（每个链接的周围都有背景信息）**：

      **我今年写了很多与奶酪相关的文章：谁能忘记<a href="https://example.com/blue-cheese-vs-gorgonzola">对蓝纹奶酪和戈尔根朱勒干酪的争议**</a>、获得 Cheesiest Research Medal 殊荣的<a href="https://example.com/worlds-oldest-brie">**全球最古老的那块布里干酪**</a>、对<a href="https://example.com/the-lost-cheese">**丢失的奶酪**</a>的史诗般复述，以及我个人的最爱即<a href="https://example.com/boy-and-his-cheese">**男孩与奶酪：两个不可思议的朋友的故事**</a>。

## 内部链接：交叉引荐您自己的内容

  您通常可能会考虑链接能否正常指向外部网站，但如果能加大对用于内部链接的定位文字的关注，则可帮助用户和 Google 更轻松地了解您的网站并找到您网站上的其他网页。对于您重视的每个网页，您都应在您网站上至少 1 个其他网页中提供相应的引荐链接。想想您网站上的哪些其他资源可帮助读者理解您网站上的某个给定网页，并在上下文中提供指向相应网页的链接。

至于给定网页应包含的链接数，不存在神奇的理想值。
  不过，如果您认为数量太多了，很可能就是太多了。

## 外部链接：指向其他网站的链接

  链接到其他网站并不可怕；事实上，使用外部链接可以帮助您建立可信度（例如引用您的内容来源）。合理地链接到外部网站，并提供相关背景信息为读者设定预期。

  **良好（引用您的内容来源）**：

      **根据瑞士研究人员近期开展的一项研究，与对照组中未用音乐熏陶过的奶酪轮相较而言，用音乐熏陶过的奶酪轮的味道略微清淡些；若想查看详尽的发现结果，请参阅<a href="https://example.com">环绕声孕育的奶酪 - 一项烹饪艺术实验**</a>。

  请仅在您不信任内容来源的情况下使用 [nofollow](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn#nofollow)，而且不要对您网站上的每个外部链接都使用它。例如，假设您是一名奶酪爱好者，但有人发布了一篇报道诋毁您最喜爱的奶酪，于是您想写篇文章回击；不过，您不想通过链接让网站受到此事的影响。这时候就非常适合使用 nofollow。

  如果您以某种方式收取了链接费用，请使用 [sponsored](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn#sponsored) 或 nofollow 确保这些链接合格。如果用户可以在您的网站上插入链接（例如您有论坛版块或问答网站），请也在这些链接中添加 [ugc](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn#ugc) 或 nofollow。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。