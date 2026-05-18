# Google 搜索的网站生成式 AI 内容指南 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content?hl=zh-cn

---

# Google 搜索关于在网站上使用生成式 AI 内容的指南

  在研究某个主题以及为原创内容添加结构时，生成式 AI 特别有用。不过，使用生成式 AI 工具或其他类似工具生成大量网页，而未为用户增加价值，可能会违反 [Google 关于滥用规模化内容的网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#scaled-content)。
  如果您在网站上使用生成式 AI 内容，请**确保您的内容符合[搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)标准和我们的[网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#scaled-content)。**

  建议参考[搜索质量评分者指南](https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf)，了解如何评估规模化内容滥用（第 4.6.5 节），以及主要内容几乎未经处理、几乎没有任何原创性以及几乎没有附加值的情形（第 4.6.6 节）。这些指南的作用并非提升 Google 搜索排名，而是[搜索评分者](https://support.google.com/websearch/answer/9281931?hl=zh-cn)用来评估[各种搜索排名系统](https://developers.google.com/search/docs/appearance/ranking-systems-guide?hl=zh-cn)的表现时遵从的依据，这类评分并不会直接影响排名。

### 注重准确性、质量和相关性

  为网站创建内容时，请注重准确性、质量和相关性，尤其是在自动生成内容时。这包括元数据，例如 [<title> 元素](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn)、[元描述元素](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)、[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)和[图片的替代文本](https://developers.google.com/tech-writing/accessibility/self-study/write-alt-text?hl=zh-cn)，这些元数据可能会显示在 Google 搜索结果中。

  对于结构化数据，还应确保遵守[常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)、各个搜索功能的具体政策，并[验证标记](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)，以确保符合[搜索功能](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)的使用资格。

### 为用户提供背景信息

  分享[有关内容制作方式的信息](https://developers.google.com/search/docs/fundamentals/creating-helpful-content?hl=zh-cn#how-the-content-was-created)有助于为读者提供更多背景信息。如果您是自动生成内容，不妨考虑添加有关内容创建方式的信息，以便受众群体能够理解，例如提供有关如何使用自动化功能的更多背景信息并添加[图片元数据](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata?hl=zh-cn#add-metadata)。

  对于电子商务网站，Google Merchant Center [就 AI 生成的内容制定了相关政策](https://support.google.com/merchants/answer/14743464?hl=zh-cn)。具体而言，由 AI 生成的图片必须包含 IPTC 元数据，指明 DigitalSourceType 为 [TrainedAlgorithmicMedia](https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia)。必须单独指定 AI 生成的商品数据（例如商品名和说明属性），并将其标记为 AI 生成。

  如需了解详情，请参阅[我们关于 AI 生成的内容的博文中的常见问题解答](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。