---

---
source: https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript
---

# 使用 JavaScript 生成结构化数据

- 

# 使用 JavaScript 生成结构化数据

现代网站会使用 JavaScript 显示大量动态内容。使用 JavaScript 在网站上生成结构化数据时，您需要注意一些事项，而本指南介绍了最佳做法和实施策略。如果您不熟悉结构化数据，可以详细了解结构化数据的运作方式。

使用 JavaScript 生成结构化数据的方法有多种，最常见的方法有：

- Google 跟踪代码管理器
- 自定义 JavaScript

```
Product
```

## 使用 Google 跟踪代码管理器动态生成 JSON-LD

通过 Google 跟踪代码管理器这一平台，您无需修改代码即可管理网站上的标记。如需使用 Google 跟踪代码管理器生成结构化数据，请按以下步骤操作：

- 在您的网站上设置并安装 Google 跟踪代码管理器。
- 向容器添加新的自定义 HTML 标记。
- 将支持的结构化数据块粘贴到标记内容中。
- 按照容器管理菜单中的安装 Google 跟踪代码管理器部分所示安装容器。
- 若要将该标记添加到您的网站中，请在 Google 跟踪代码管理器界面中发布容器。
- 测试实现效果。

### 在 Google 跟踪代码管理器中使用变量

Google 跟踪代码管理器 (GTM) 支持变量，使您能够将网页上的信息用在结构化数据中。您可以使用变量从网页中提取结构化数据，而不是在 GTM 中复制信息。在 GTM 中复制信息会导致网页内容与通过 GTM 插入的结构化数据不一致的风险增大。

例如，您可以通过创建以下名为 recipe_name 的自定义变量，动态创建将网页标题用作食谱名称的 Recipe JSON-LD 块：

```
recipe_name
```

```
function() { return document.title; }
```

然后，您可以在自定义 HTML 代码中使用 {{recipe_name}}。

```
{{recipe_name}}
```

我们建议您创建变量，并使用这些变量从网页中收集所有必要信息。

下面是自定义 HTML 代码内容的示例：

```

```

```
recipe_name
```

```
recipe_image
```

```
recipe_author
```

## 使用自定义 JavaScript 生成结构化数据

您还可以通过另一种方法生成结构化数据：使用 JavaScript 生成所有结构化数据，或者向服务器端呈现的结构化数据添加更多信息。无论采用上述哪种方式，Google 搜索都能在渲染网页时理解和处理 DOM 中提供的结构化数据。如需详细了解 Google 搜索如何处理 JavaScript，请参阅 JavaScript 基础知识指南。

下面是 JavaScript 生成的结构化数据的示例：

- 查找您想使用的结构化数据类型。
- 修改您网站的 HTML，并添加如以下示例所示的 JavaScript 代码段（请参阅您的 CMS 或托管服务提供商的文档，或者咨询您的开发者）。
fetch('https://api.example.com/recipes/123')
.then(response => response.text())
.then(structuredDataText => {
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = structuredDataText;
  document.head.appendChild(script);
});
- 使用富媒体搜索结果测试来测试您的实现效果。

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

## 使用服务器端呈现

如果您使用的是服务器端渲染，还可以在渲染的输出中包含结构化数据。查看您所用框架的文档，了解如何为您想使用的结构化数据类型生成 JSON-LD。

## 测试实现效果

若要确保 Google 搜索可以抓取您的结构化数据并将其编入索引，请测试您的实现效果：

- 打开富媒体搜索结果测试。
- 输入您要测试的网址。
    我们建议您使用网址输入（而非代码输入），因为使用代码输入时存在 JavaScript 限制（例如 CORS 限制）。
- 点击测试网址。
    成功：如果您的所有操作都正确无误，并且该工具支持您的结构化数据类型，系统会显示“网页能显示富媒体搜索结果”这一消息。
      如果您要测试富媒体搜索结果测试工具不支持的结构化数据类型，请检查所呈现的 HTML。
      如果所呈现的 HTML 包含相应结构化数据，Google 搜索将能够处理该结构化数据。

重试：如果您看到错误或警告，则很可能是语法错误或属性缺失。
      请阅读您的结构化数据类型对应的文档，并确保您已添加所有属性。如果问题仍然存在，还请务必查看解决与 Google 搜索相关的 JavaScript 问题的指南。

成功：如果您的所有操作都正确无误，并且该工具支持您的结构化数据类型，系统会显示“网页能显示富媒体搜索结果”这一消息。
      如果您要测试富媒体搜索结果测试工具不支持的结构化数据类型，请检查所呈现的 HTML。
      如果所呈现的 HTML 包含相应结构化数据，Google 搜索将能够处理该结构化数据。

重试：如果您看到错误或警告，则很可能是语法错误或属性缺失。
      请阅读您的结构化数据类型对应的文档，并确保您已添加所有属性。如果问题仍然存在，还请务必查看解决与 Google 搜索相关的 JavaScript 问题的指南。