# 与 Google 搜索中的 AMP 网页相关的指南 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/amp?hl=zh-cn

---

# 与 Google 搜索中的 AMP 网页相关的准则

我们所有关于如何使网站便于 Google 处理的[指南](https://support.google.com/webmasters/answer/40349?hl=zh-cn)均适用于 AMP 网页。本文档将介绍我们专为 Google 搜索中的 AMP 网页制定的一些其他指南。若要详细了解 Google 搜索中的 AMP 网页，请阅读我们的[开发者指南](https://developers.google.com/search/docs/crawling-indexing/amp/about-amp?hl=zh-cn)。

- AMP 网页必须遵守 [AMP HTML 规范](https://www.ampproject.org/docs/reference/spec.html)。如果您是新手，请了解如何[创建您的首个 AMP HTML 网页](https://www.ampproject.org/docs/get_started/create.html)。
- 就可浏览的内容和可完成的操作而言，您必须尽可能地让用户能在 AMP 网页上获得与在对应的规范网页上相同的体验。
- AMP 的 URL scheme 必须易于用户理解。
        例如，如果规范网页是 example.com/giraffes，请将 AMP 网页托管在 amp.example.com/giraffes 或 example.com/amp/giraffes 这样的位置，而不是托管在 test.com/giraffes 上。
          这是因为当用户在 Google 搜索结果中点击某个指向 AMP 网页的链接时，浏览器即会像显示任何网页的网址一样显示相应的 AMP 网址；倘若所显示的网址与主网站完全不相关，则可能会令用户感到困惑。
- AMP 网页必须[有效](https://search.google.com/test/amp?hl=zh-cn)，这样才能按预期向用户呈现，并使用与 AMP 相关的功能。包含无效 AMP 标记的网页将无法使用部分搜索功能。
- 如果您向网页中添加结构化数据，请务必遵守我们的[结构化数据政策](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。

## 其他 AMP 主题

以下主题介绍了如何使用 AMP 及它在 Google 搜索中的运作原理。

      主题

        [了解 AMP 在搜索结果中的运作原理](https://developers.google.com/search/docs/crawling-indexing/amp/about-amp?hl=zh-cn)
        了解 AMP 网页在 Google 搜索结果中的显示方式。

        [增强在 Google 搜索结果中显示的 AMP 内容](https://developers.google.com/search/docs/crawling-indexing/amp/enhance-amp?hl=zh-cn)
        了解如何增强和监控 AMP 网页。

        [验证 AMP 内容是否可以在 Google 搜索结果中显示](https://developers.google.com/search/docs/crawling-indexing/amp/validate-amp?hl=zh-cn)
        本文中包含关于如何验证 AMP 网页的提示和建议。

        [从 Google 搜索结果中移除 AMP 网页](https://developers.google.com/search/docs/crawling-indexing/amp/remove-amp?hl=zh-cn)
        了解如何从 Google 搜索结果中移除 AMP 网页。

## 常见问题解答

### AMP 网页只能在移动设备上显示吗？

不是。AMP 网页可在所有类型的设备上查看，因此请使用[自适应设计](https://www.ampproject.org/docs/guides/author-develop/responsive_amp)构建 AMP 网页。

### AMP 网页在桌面设备上的呈现效果如何？

AMP 网页在移动设备屏幕和桌面设备屏幕上的显示效果一样好。如果 AMP 支持您所需的全部功能，您不妨考虑将网页创建为[独立的 AMP 网页](https://www.ampproject.org/docs/guides/deploy/discovery#what-if-i-only-have-one-page)，以满足使用桌面设备的访问者和使用移动设备的访问者对同一网页的不同需求。但是，当桌面设备上的 AMP 网页出现在 Google 搜索结果中时，它们无法使用搜索专用功能。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。