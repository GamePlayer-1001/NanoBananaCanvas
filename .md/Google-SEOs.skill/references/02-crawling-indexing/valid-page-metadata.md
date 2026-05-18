# Google 搜索的有效页面元数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/valid-page-metadata?hl=zh-cn

---

# 使用有效的 HTML 指定网页元数据

      使用有效的 HTML 指定页面元数据可确保 Google 能够使用所指定的元数据。
      即使 HTML 无效或与 [HTML 标准](https://html.spec.whatwg.org/multipage/)不符，Google 也会尽力理解 HTML，但标记中的错误可能会导致 Google 搜索利用元数据的方式出现问题。
      用于指定网页元数据的主要元素是 HTML 文档的 <head> 元素。如果您在 <head> 元素中使用了无效元素，Google 会忽略该无效元素之后显示的所有元素。

## 在 <head> 元素中使用有效元素

      根据 HTML 标准，<head> 元素只能包含以下有效元素（不得包含其他无效元素）：

- title
- meta
- link
- script
- style
- base
- noscript
- template

## 请勿在 <head> 元素中使用无效元素

      HTML 标准仅允许在 <head> 元素中使用上述元素。出现在 <head> 元素中会使其失效的常见元素包括：

- iframe
- img

      我们强烈建议您不要在 <head> 元素中使用这些无效元素，但如果必须使用，请将这些无效元素放置在您希望 Google 看到的元素之后。Google 检测到其中一个无效元素后，会假定到达 <head> 元素末尾，并停止读取 <head> 元素中的任何其他元素。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。