---

---
source: https://developers.google.com/search/docs/appearance/favicon-in-search
---

# 定义要在搜索结果中显示的网站图标

- 

# 定义要在搜索结果中显示的网站图标

如果您的网站有网站图标，则它可以显示在与您网站对应的 Google 搜索结果中。

网站图标

## 实现

下面介绍了在 Google 搜索结果中显示网站图标需要满足的条件：

- 按照指南中的说明创建网站图标。
- 使用以下语法将  标记添加到您网站首页的标头中：

      为了提取网站图标信息，Google 依赖于 link 元素的以下属性：

属性

rel

            Google 支持使用以下 rel 属性值来指定网站图标；请根据您的使用场景选择最合适的选项：

icon

                  代表您网站的图标，如 HTML 标准中所定义。

出于历史原因，我们还支持 shortcut icon，它是 icon 的早期替代版本。

apple-touch-icon

一个适合 iOS 的图标，代表您的网站，详情请参阅 Apple 开发者文档。

apple-touch-icon-precomposed

早期版本的 iOS 的备用图标，详情请参阅 Apple 开发者文档。

href

            网站图标的网址。该网址可以是相对路径 (/smile.ico)，也可以是绝对路径 (https://example.com/smile.ico)。该网址无需托管在您的网站上（例如，您的网站图标可以托管在内容分发网络 [CDN] 上）。
- 请为 Google 留出相应的时间来重新抓取并处理首页上的新信息。请注意，抓取用时可能会从几天到几周不等，具体取决于系统判断内容所需的刷新频率。您可以使用网址检查工具请求将网站首页编入索引。

```

```

```

```

为了提取网站图标信息，Google 依赖于 link 元素的以下属性：

```
link
```

```
rel
```

Google 支持使用以下 rel 属性值来指定网站图标；请根据您的使用场景选择最合适的选项：

```
rel
```

```
icon
```

代表您网站的图标，如 HTML 标准中所定义。

```
shortcut icon
```

```
icon
```

```
apple-touch-icon
```

一个适合 iOS 的图标，代表您的网站，详情请参阅 Apple 开发者文档。

```
apple-touch-icon-precomposed
```

早期版本的 iOS 的备用图标，详情请参阅 Apple 开发者文档。

```
href
```

网站图标的网址。该网址可以是相对路径 (/smile.ico)，也可以是绝对路径 (https://example.com/smile.ico)。该网址无需托管在您的网站上（例如，您的网站图标可以托管在内容分发网络 [CDN] 上）。

```
/smile.ico
```

```
https://example.com/smile.ico
```

## 指南

您必须遵循以下指南，才能使网站图标显示在 Google 搜索结果中。

- Google 搜索仅支持每个网站一个网站图标，其中“网站”由主机名定义。例如，https://www.example.com/ 和 https://code.example.com/ 是两个不同的主机名，因此可以设置两个不同的网站图标。但是，https://www.example.com/sub-site 是网站的子目录，您只能为 https://www.example.com/ 设置一个网站图标，该图标适用于相应网站及其子目录。

受支持：https://example.com（这是网域级首页）

受支持：https://news.example.com（这是子网域级首页）

不受支持：https://example.com/news（这是子目录级首页）
- Googlebot-Image 必须能够抓取网站图标文件，并且 Googlebot 必须能够抓取首页；它们不能被禁止抓取。
- 为便于用户在浏览搜索结果时快速识别您的网站，请确保网站图标的视觉设计能够代表您的网站品牌。
- 网站图标必须是方形（宽高比为 1:1），且尺寸至少为 8x8 像素。虽然最小尺寸要求为 8x8 像素，但我们建议使用尺寸大于 48x48 像素的网站图标，以便在各种平台上看起来效果不错。系统支持任何有效的网站图标格式。
- 网站图标网址必须保持稳定（请勿经常更改该网址）。
- Google 不会显示任何被其视为不当内容的网站图标，包括色情图像或有仇恨含义的符号（例如 卐）。如果在网站图标中发现了此类图像，则 Google 会将该网站图标替换为默认图标。

```
https://www.example.com/
```

```
https://code.example.com/
```

```
https://www.example.com/sub-site
```

```
https://www.example.com/
```

```
https://example.com
```

```
https://news.example.com
```

```
https://example.com/news
```

## 提交有关搜索结果中网站图标的反馈

如果您对 Google 在搜索结果中处理网站图标的方式有任何反馈意见，请填写我们的网站图标反馈表单。
  请注意，您在此处提交的反馈旨在帮助我们的团队改进 Google 搜索的整体系统，但我们无法保证会针对您的每条反馈单独采取行动。