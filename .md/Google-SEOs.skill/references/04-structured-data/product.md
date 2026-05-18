# Google 上的商品结构化数据简介 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn

---

  # Product 结构化数据简介

  向商品页面添加结构化数据后，您的商品信息能以更丰富的方式显示在 Google 搜索结果（包括 [Google 图片](https://images.google.com/?hl=zh-cn)和 [Google 智能镜头](https://lens.google/?hl=zh-cn)）中。例如，用户可以直接在搜索结果中查看价格、库存状况、评价评分、配送信息等。

## 确定要使用的标记

商品结构化数据主要分为两类。请遵循最适合您用例的类型的要求：

- **[商品摘要](https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn)**：适用于用户无法直接从中购买商品的网页。此标记提供了更多用于指定评价信息的选项，例如编辑商品评价页面上的[优缺点](https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn#pros-cons-example)。
- **[商家信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)**：适用于客户可直接从中购买商品的网页。此标记提供了更多选项来指定详细的商品信息，例如[服装尺码](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#size-specification-properties)、[配送详情](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#shipping)和[退货政策](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#returns)信息。

  请注意，这两项产品功能之间存在一些重叠。一般来说，为商家信息添加[必需的商品信息属性](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#product-information)意味着您的商品页面也可以显示商品摘要。
  这两项功能都有自己的增强功能，因此，在决定哪种标记对您的网站来说有意义时，请务必同时参考这两项功能（可添加的属性越多，您的网页有资格使用的增强功能就越多）。

  您是否提供商品的不同款式/规格？**添加[商品款式/规格结构化数据](https://developers.google.com/search/docs/appearance/structured-data/product-variants?hl=zh-cn)可以帮助 Google 更好地了解哪些商品是同一父级商品的款式/规格。商品摘要和商家信息都支持商品款式/规格。

除了您销售的各个商品的结构化数据之外，我们还建议您添加定义电子商务业务政策的结构化数据，并将其嵌套在 Organization 标记下：

- **[商家退货政策](https://developers.google.com/search/docs/appearance/structured-data/return-policy?hl=zh-cn)**：指定您的商家的退货政策。
- **[会员回馈活动](https://developers.google.com/search/docs/appearance/structured-data/loyalty-program?hl=zh-cn)**：指定您提供的会员回馈活动。

## 购物体验如何显示在 Google 搜索中

  购物体验在 Google 搜索结果中的显示效果如下。
    该列表并不详尽。Google 搜索一直在探索更好更新的方式，以帮助用户找到所需内容，这些体验可能会随着时间的推移发生变化。

##### 商品摘要

一种[文本结果](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result)，其中包含评分、评价信息、价格和库存状况等附加商品信息

##### 热门商品

            待售商品以丰富的视觉效果方式呈现

##### 购物知识面板

            包含一系列卖家的详细商品信息（使用商品标识码等详细信息）

##### Google 图片

            可供销售的商品的带注解图片

### 更完善的搜索结果

  是否显示更完善的搜索结果完全取决于每种体验，并且可能会随时间推移而发生变化。因此，我们建议您尽可能提供更丰富的商品信息，而无需担心实际体验是否会用到。
    下面列举了一些示例来说明如何增强商品富媒体搜索结果：

- **评分**：通过提供[客户评价和评分](https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn#product-reviews)，增强搜索结果的显示效果。
- **优缺点**：在商品评价说明中列出[优缺点](https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn#pros-cons)，以便在搜索结果中突出显示这些内容。
- **配送**：分享[运费](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#shipping)（尤其是免运费）信息，以便买家了解总费用。
- **库存状况**：提供[库存状况](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#availability)数据，帮助客户了解目前商品是否有货。
- **降价**：Google 通过观察商品在一段时间内的价格变动来计算降价。降价不保证一定会显示。
- **退货**：提供[退货信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#returns)，例如退货政策、退货所涉及的费用，以及客户需要在多少天内退货。

## 向 Google 搜索提供商品数据

  如需向 Google 搜索提供丰富的商品数据，您可以为网页添加 Product 结构化数据，或通过 Google Merchant Center 上传数据 Feed 并在 Merchant Center 控制台中选择启用非付费商品详情；或者两者都完成。搜索中心文档重点介绍了网页上的结构化数据。

  在网页上提供结构化数据并同时提供 Merchant Center Feed 可最大限度地提高您使用各类体验的资格，并帮助 Google 正确理解和验证您的数据。
    有些体验会结合使用来自结构化数据和 Google Merchant Center Feed（如果两者可用）的数据。例如，如果网页的结构化数据中未提供价格数据，则商品摘要可能会使用 Merchant Center Feed 中的相应数据。[Google Merchant Center Feed 文档](https://support.google.com/merchants/answer/7052112?hl=zh-cn)包含关于 Feed 属性的其他建议和要求。

  除了在 Google 搜索中展示外，符合条件时还可以在[“Google 购物”标签页](https://support.google.com/merchants/answer/9826670?hl=zh-cn)中展示。请参阅 [Google Merchant Center 中的数据和资格要求](https://support.google.com/merchants/answer/9199328?hl=zh-cn)，详细了解具体资格条件。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。