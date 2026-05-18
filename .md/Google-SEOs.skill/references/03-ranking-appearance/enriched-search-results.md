# 丰富且互动的搜索结果 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/enriched-search-results?hl=zh-cn

---

  # 丰富搜索结果

除了标准富媒体搜索结果之外，Google 搜索还支持一类互动性更强的增强型富媒体搜索结果，称为“丰富搜索结果”。**丰富搜索结果中通常包含沉浸式体验或其他高级互动功能。例如，当用户搜索“美国的招聘信息”时，可能会出现如下所示的招聘信息丰富结果：

借助丰富搜索，用户能够搜索结构化数据内容的各种属性；例如，用户可以搜索热量低于 200 卡的鸡汤食谱，或搜索制备时间不足 1 小时的食谱。

## 实现丰富搜索

丰富搜索是一种富媒体搜索结果，且是使用[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)实现的。有些富媒体搜索结果类型只能以丰富搜索类型（例如食谱、招聘信息和活动）呈现；其他富媒体搜索结果类型则可通过添加几项属性而扩展为丰富搜索类型。富媒体搜索结果类型的文档会指出，该类型可否以及如何从基本富媒体搜索结果扩展为丰富结果。

[如需查看技术信息和结果库，请点击此处。](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)

丰富搜索由 Google 搜索排名算法提供支持；除了在您的网页上添加正确的结构化数据外，您还必须遵循下列质量指南，以便 Google 能够将您的网页正确编入索引并对其进行排名。

- [结构化数据质量指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn#quality-guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [丰富搜索质量指南](#guidelines)
与重复的结构化数据内容相关的注意事项**：通常，您可在某一个网站的许多网页中使用重复的结构化数据，并且有充分的理由这样做。例如，您可能会针对多个地点的同一个空缺职位发布多条招聘信息。这些信息将具有相同的说明值，但具有不同的地点值。丰富搜索算法会考虑到这一点，因而不会将这些对象视为重复内容。
## 丰富搜索类型

以下搜索类型均支持丰富搜索体验：

- [招聘信息](https://developers.google.com/search/docs/appearance/structured-data/job-posting?hl=zh-cn)
- [食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)
- [活动](https://developers.google.com/search/docs/appearance/structured-data/event?hl=zh-cn)

## 丰富搜索质量指南

您必须遵循这些网络垃圾政策，才能使用丰富搜索功能。如果丰富搜索排名算法认为某个网站的大部分内容都不符合质量标准，就可能会将整个网站从丰富搜索结果中排除。

- **必需属性**：每个丰富搜索类型都定义了一组必需属性。缺少必需属性的内容均会被视为不符合条件。
- **完整性**：您提供的附加（建议）属性越多，相应内容的质量就越高，也就越能吸引我们的用户。对于招聘信息，用户会首选明确标注薪资（而非未明确标注薪资）的职位信息，而搜索排名也会考虑到这一点。如果您的食谱具有真实的用户评价和名副其实的星级，则也会让您的网站更有吸引力并获得较高的丰富搜索排名。完整性是丰富搜索的最重要排名衡量因素之一。
- **相关性**：标记的数据必须与您要采用的丰富搜索相关。以下是不相关数据的一些示例：

体育赛事直播网站将广播标记为本地活动。
- 木工技艺网站将说明标记为食谱。

**叶级内容**：丰富搜索仅适用于叶级页，而不适用于列表页。叶级页是描述项目详细属性的页面。列表页则是一种链接到多个叶级页的类别页面。以下是一些列表页示例：

- 某个页面描述了“10 种最佳的火鸡烹饪方法”，其中包含指向每道食谱的链接。
- 某个页面列出了加利福尼亚州山景城的所有招聘信息，其中包含指向每条招聘信息的链接。

**内容政策**：个别丰富搜索针对每种数据类型提供了额外的内容类型专用政策，如其文档中所述。违反这些内容政策的文档或网站可能会获得不够理想的排名或者无法使用这项功能。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。