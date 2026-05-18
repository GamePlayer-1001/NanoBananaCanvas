# 说明出站链接的用意以实现搜索引擎优化 (SEO) | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn

---

  # 向 Google 说明您的出站链接的用意

对于您网站上的某些链接，您可能需要向 Google 说明您的网站与链接页之间的关系。为此，请在 <a> 标记中使用下列 rel 属性值之一。

对于您希望 Google 无任何限定条件便直接提取和解析的常规链接，您无需添加 rel 属性。例如：

```
<p>My favorite horse is the <a href="https://horses.example.com/Palomino">palomino</a>.</p>
```

对于其他链接，请使用以下一个或多个值：

          rel 值

### rel="sponsored"

请使用 sponsored 值标记广告链接或付费展示位置链接（通常称为“付费链接”**）。详细了解 [Google 对付费链接的态度](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#link-spam)。

```
<a rel="sponsored" href="https://cheese.example.com/Appenzeller_cheese">Appenzeller</a>
```

            注意：**对于这类链接，[以前推荐](https://developers.google.com/search/blog/2019/09/evolving-nofollow-new-ways-to-identify?hl=zh-cn)使用 nofollow 属性，现在，您仍可以使用该属性进行标记，但更建议您使用 sponsored 标记。

### rel="ugc"

建议您使用 ugc 值标记用户生成的内容（例如评论和论坛帖子）的链接。

```
<a rel="ugc" href="https://cheese.example.com/Appenzeller_cheese">Appenzeller</a>
```

如果您想对值得信赖的贡献者（始终如一地做出高质量贡献的成员或用户）表示认可和奖励，则可从他们发布的链接中移除此属性。 详细了解如何[防止网站和平台存在用户生成的垃圾内容](https://developers.google.com/search/docs/monitor-debug/prevent-abuse?hl=zh-cn)。

### rel="nofollow"

如果其他值不适用，并且您希望 Google 不跟踪您网站上的出站链接，或不从您的网站上抓取链接页，请使用 nofollow 值。对于您网站中的链接，请使用 [robots.txt disallow 规则](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt?hl=zh-cn#disallow)。

```
<a rel="nofollow" href="https://cheese.example.com/Appenzeller_cheese">Appenzeller</a>
```

### **多个值

您可以使用以空格或英文逗号分隔的列表，指定多个 rel 值。**示例**：

```
<p>I love <a rel="ugc nofollow" href="https://cheese.example.com/Appenzeller_cheese">Appenzeller</a> cheese.</p>
```

```
<p>I hate <a rel="ugc,nofollow" href="https://cheese.example.com/blue_cheese">Blue</a> cheese.</p>
```

Google 通常不会跟踪标有这些 rel 属性的链接。请注意，链接页也可能经由其他途径找到（例如站点地图或其他网站的出站链接），因此仍有可能被抓取。这些 rel 属性仅能在 [Google 可抓取的 <a> 元素](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn#crawlable-links)中使用，但 nofollow 除外，该属性还可用作[漫游器 meta 标记](https://developers.google.com/search/docs/crawling-indexing/special-tags?hl=zh-cn)。

如果您不想让 Google 提取指向您的站内网页的链接，请使用 [robots.txt disallow 规则](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt?hl=zh-cn#disallow)。

如果您不想让 Google 将某个网页编入索引，请允许抓取并使用 [noindex robots 规则](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。