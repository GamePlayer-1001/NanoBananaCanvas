# 精选摘要和您的网站 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/featured-snippets?hl=zh-cn

---

# 精选摘要和您的网站

精选摘要位于特殊方框中，其中呈现的搜索结果格式和常规格式相反，会首先显示描述性[摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)。它们还可出现在[相关问题组](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#related-questions-group)（也称为“其他用户还问了以下问题”）中。
  [详细了解 Google 精选摘要的运作方式。](https://support.google.com/websearch/answer/9351707?hl=zh-cn)

  图示：搜索结果中的精选摘要

7-10 分钟

[如何制作全熟水煮蛋](https://wikipedia.org/wiki/Boiled_egg)

## 如何选择停用精选摘要？

您可以通过以下两种方式来选择停用精选摘要：

- [同时屏蔽精选和常规搜索摘要](#block-both)
- [仅屏蔽精选摘要](#block-fs)

### 屏蔽所有摘要

若要阻止显示某个网页的所有摘要（包括精选摘要和常规摘要），请为该网页添加 [nosnippet 规则](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#nosnippet)。

- 带有 [data-nosnippet HTML 属性](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#data-nosnippet-attr)标记的文本不会出现在精选摘要或常规摘要中。
- 如果某个网页同时有 nosnippet 和 data-nosnippet 规则，则优先适用 nosnippet 规则，不显示该网页的任何摘要。

### 仅屏蔽精选摘要

如果您希望保留常规搜索摘要，但又不想显示为精选摘要，请尝试缩小 [max-snippet 规则](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#max-snippet)的值。仅当可显示的文本长度足以生成有用的精选摘要时，才会显示精选摘要。

如果网页继续显示为精选摘要，请继续缩小此值。一般来说，max-snippet 规则的值越小，网页显示为精选摘要的可能性就越小。

Google 没有严格规定显示为精选摘要所需的最小长度。
  这是因为最小长度取决于多种因素，包括但不限于摘要中的信息、语言和平台（移动设备、应用或桌面设备）。

  将 max-snippet 设置为较小的值并不能保证 Google 不会为您的网页显示精选摘要。如果您需要确保您的网页绝对不会显示为精选摘要，请使用 nosnippet 规则。

## 如何将我的网页标记为精选摘要？

您无法这样做。Google 系统会根据用户的搜索请求来判断某个网页是否适合显示为精选摘要，如果适合，就会将其升级为精选摘要。

## 用户点击精选摘要后会发生什么？

点击精选摘要后，用户会直接转到网页中出现在精选摘要里的部分。系统会自动滚动到出现在摘要中的位置，无需网站添加任何其他注解。如果浏览器不支持所需的底层技术，或者我们的系统无法准确确定要将点击操作定位到网页中的哪个具体位置，那么用户在点击精选摘要后会被转到源网页的顶部。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。