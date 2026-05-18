---

---
source: https://developers.google.com/search/docs/crawling-indexing/amp
---

# 与 Google 搜索中的 AMP 网页相关的准则

- 

# 与 Google 搜索中的 AMP 网页相关的准则

我们所有关于如何使网站便于 Google 处理的指南均适用于 AMP 网页。本文档将介绍我们专为 Google 搜索中的 AMP 网页制定的一些其他指南。若要详细了解 Google 搜索中的 AMP 网页，请阅读我们的开发者指南。

- AMP 网页必须遵守 AMP HTML 规范。如果您是新手，请了解如何创建您的首个 AMP HTML 网页。
- 就可浏览的内容和可完成的操作而言，您必须尽可能地让用户能在 AMP 网页上获得与在对应的规范网页上相同的体验。
- AMP 的 URL scheme 必须易于用户理解。
        例如，如果规范网页是 example.com/giraffes，请将 AMP 网页托管在 amp.example.com/giraffes 或 example.com/amp/giraffes 这样的位置，而不是托管在 test.com/giraffes 上。
          这是因为当用户在 Google 搜索结果中点击某个指向 AMP 网页的链接时，浏览器即会像显示任何网页的网址一样显示相应的 AMP 网址；倘若所显示的网址与主网站完全不相关，则可能会令用户感到困惑。
- AMP 网页必须有效，这样才能按预期向用户呈现，并使用与 AMP 相关的功能。包含无效 AMP 标记的网页将无法使用部分搜索功能。
- 如果您向网页中添加结构化数据，请务必遵守我们的结构化数据政策。

```
example.com/giraffes
```

```
amp.example.com/giraffes
```

```
example.com/amp/giraffes
```

```
test.com/giraffes
```

## 其他 AMP 主题

以下主题介绍了如何使用 AMP 及它在 Google 搜索中的运作原理。

## 常见问题解答

### AMP 网页只能在移动设备上显示吗？

不是。AMP 网页可在所有类型的设备上查看，因此请使用自适应设计构建 AMP 网页。

### AMP 网页在桌面设备上的呈现效果如何？

AMP 网页在移动设备屏幕和桌面设备屏幕上的显示效果一样好。如果 AMP 支持您所需的全部功能，您不妨考虑将网页创建为独立的 AMP 网页，以满足使用桌面设备的访问者和使用移动设备的访问者对同一网页的不同需求。但是，当桌面设备上的 AMP 网页出现在 Google 搜索结果中时，它们无法使用搜索专用功能。