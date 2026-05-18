# 使用 JavaScript 生成结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn

---

  # 使用 JavaScript 生成结构化数据

现代网站会使用 JavaScript 显示大量动态内容。使用 JavaScript 在网站上生成结构化数据时，您需要注意一些事项，而本指南介绍了最佳做法和实施策略。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

使用 JavaScript 生成结构化数据的方法有多种，最常见的方法有：

- [Google 跟踪代码管理器](#use-google-tag-manager)
- [自定义 JavaScript](#custom-javascript)

使用了 Product 标记？**请注意，动态生成的标记可能会导致购物内容抓取频率降低且不太可靠，这可能会对商品库存状况和价格等快速变化的内容造成影响。如果您是针对所有类型的购物搜索结果进行优化的商家，请确保您的服务器有足够的计算资源来处理来自 Google 的更多流量。

## 使用 Google 跟踪代码管理器动态生成 JSON-LD

通过 [Google 跟踪代码管理器](https://tagmanager.google.com/?hl=zh-cn)这一平台，您无需修改代码即可管理网站上的标记。如需使用 Google 跟踪代码管理器生成结构化数据，请按以下步骤操作：

1. 在您的网站上[设置并安装 Google 跟踪代码管理器](https://support.google.com/tagmanager/answer/6103696?hl=zh-cn)。
2. 向容器添加新的**自定义 HTML** 标记。
3. 将[支持的结构化数据](https://developers.google.com/search/docs/guides/search-gallery?hl=zh-cn)块粘贴到标记内容中。
4. 按照容器管理菜单中的**安装 Google 跟踪代码管理器**部分所示安装容器。
5. 若要将该标记添加到您的网站中，请在 Google 跟踪代码管理器界面中发布容器。
6. [测试实现效果](#testing)。

### 在 Google 跟踪代码管理器中使用变量

Google 跟踪代码管理器 (GTM) 支持[变量](https://support.google.com/tagmanager/topic/7683268?ref_topic=3441647&hl=zh-cn)，使您能够将网页上的信息用在结构化数据中。您可以使用变量从网页中提取结构化数据，而不是在 GTM 中复制信息。在 GTM 中复制信息会导致网页内容与通过 GTM 插入的结构化数据不一致的风险增大。

例如，您可以通过创建以下名为 recipe_name 的自定义变量，动态创建将网页标题用作食谱名称的 [Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn) JSON-LD 块：

```
function() { return document.title; }
```

然后，您可以在自定义 HTML 代码中使用 &#123;&#123;recipe_name&#125;&#125;。

我们建议您创建变量，并使用这些变量从网页中收集所有必要信息。

下面是自定义 HTML 代码内容的示例：

```
<script type="application/ld+json">
  {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    "name": "&#123;&#123;recipe_name&#125;&#125;",
    "image": [ "&#123;&#123;recipe_image&#125;&#125;" ],
    "author": {
      "@type": "Person",
      "name": "&#123;&#123;recipe_author&#125;&#125;"
    }
  }
</script>
```

**注意：**上一个示例假设您在 GTM 中定义了 recipe_name、recipe_image 和 recipe_author 变量。

## 使用自定义 JavaScript 生成结构化数据

您还可以通过另一种方法生成结构化数据：使用 JavaScript 生成所有结构化数据，或者向服务器端呈现的结构化数据添加更多信息。无论采用上述哪种方式，Google 搜索都能在渲染网页时理解和处理 DOM 中提供的结构化数据。如需详细了解 Google 搜索如何处理 JavaScript，请参阅 [JavaScript 基础知识指南](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn)。

下面是 JavaScript 生成的结构化数据的示例：

1. [查找您想使用的结构化数据类型](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)。
2. 修改您网站的 HTML，并添加如以下示例所示的 JavaScript 代码段（请参阅您的 CMS 或托管服务提供商的文档，或者咨询您的开发者）。

```
fetch('https://api.example.com/recipes/123')
.then(response => response.text())
.then(structuredDataText => {
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = structuredDataText;
  document.head.appendChild(script);
});
```
3. [使用富媒体搜索结果测试来测试您的实现效果](#testing)。

## 使用服务器端呈现

如果您使用的是[服务器端渲染](https://developers.google.com/web/updates/2019/02/rendering-on-the-web?hl=zh-cn#server-rendering)，还可以在渲染的输出中包含结构化数据。查看您所用框架的文档，了解如何为您想使用的[结构化数据类型](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)生成 JSON-LD。

## 测试实现效果

若要确保 Google 搜索可以抓取您的结构化数据并将其编入索引，请测试您的实现效果：

1. 打开[富媒体搜索结果测试](https://goo.gle/richresults)。
2. 输入您要测试的网址。
    我们建议您使用网址输入（而非代码输入），因为使用代码输入时存在 JavaScript 限制（例如 CORS 限制）。
3. 点击**测试网址**。

**成功**：如果您的所有操作都正确无误，并且[该工具支持您的结构化数据类型](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)，系统会显示“网页能显示富媒体搜索结果”这一消息。**
      如果您要测试富媒体搜索结果测试工具不支持的结构化数据类型，请检查所呈现的 HTML。
      如果所呈现的 HTML 包含相应结构化数据，Google 搜索将能够处理该结构化数据。

重试**：如果您看到错误或警告，则很可能是语法错误或属性缺失。
      请阅读[您的结构化数据类型对应的文档](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)，并确保您已添加所有属性。如果问题仍然存在，还请务必查看[解决与 Google 搜索相关的 JavaScript 问题](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript?hl=zh-cn)的指南。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。