# 关于优先将移动版网站编入索引的最佳实践 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing?hl=zh-cn

---

  # 关于移动网站和优先将移动版网站编入索引的最佳实践

  Google 使用通过[智能手机代理](https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers?hl=zh-cn)抓取的移动版网站内容进行索引编制和排名。这称为优先将移动版网站编入索引**。

  虽然不要求一定要有网页移动版，才能将您的内容纳入 Google 搜索结果中，但我们强烈建议您提供移动版。这些最佳实践适用于一般移动网站，并且根据定义适合优先将移动版网站编入索引。

  为了确保用户能够获得最佳体验，请遵循本指南中详述的最佳实践。

## 创建适合移动设备的网站

  如果您还没有适合移动设备的网站，请先创建一个。这样，通过手机访问您网站的用户就可以获得出色的体验。如需创建适合移动设备的网站，有三种配置可供选择：

- [**自适应设计**](https://web.dev/learn/design?hl=zh-cn)：通过同一网址提供相同的 HTML 代码，不考虑用户所使用的设备（例如桌面设备、平板电脑、移动设备、非视觉性浏览器），但可以根据屏幕尺寸以不同方式呈现内容。**Google 建议采用自适应设计，因为这是最容易实现和维护的设计模式**。
- **动态提供内容**：无论用户使用何种设备，都使用相同的网址。这种配置依赖 [user-agent 嗅探](https://en.wikipedia.org/wiki/Browser_sniffing)和 [Vary: user-agent HTTP 响应标头](https://developer.mozilla.org/docs/Web/HTTP/Headers/Vary)来向不同的设备提供不同版本的 HTML。
- **单独的网址**：利用单独的网址向每种设备提供不同的 HTML。与动态提供内容一样，这种配置依赖 user-agent 和 Vary HTTP 标头将用户重定向到适合设备的相应网站版本。

  本指南的内容仅适用于动态提供内容和单独的网址配置。如果采用自适应设计，则移动版和桌面版网页的内容和元数据是相同的。

  **如果您使用 Wix 或 Blogger 等 CMS**，并且无法修改现有的主题，则可能需要为网站设置适合移动设备的新主题。请尝试搜索您的 CMS 的名称和“适合移动设备”，例如“wix 适合移动设备”。

## 确保 Google 能够访问并呈现您的内容

确保 Google 能够访问并呈现您的移动版网页内容和资源。

- **在移动版网站和桌面版网站上使用相同的 robots meta 标记。**
    如果您在移动版网站上使用不同的 robots meta 标记（尤其是 noindex 或 nofollow 标记），那么您的网站启用“优先将移动版网站编入索引”机制后，Google 可能无法抓取您的网页并将其编入索引。
- **不要依靠用户互动来延迟加载主要内容**。Google 不会加载需要用户互动（例如滑动、点击或输入）才能加载的内容。[确保 Google 能看到延迟加载的内容](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading?hl=zh-cn)。
- **允许 Google 抓取您的资源**。某些资源在移动版网站上的网址不同于在桌面版网站上的网址。如果您想让 Google 抓取您的网址，请确保您没有使用 [disallow 规则](https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt?hl=zh-cn#disallow)屏蔽相应网址。

## 确保桌面版网站和移动版网站具有相同的内容

  即使是一致的内容，如果桌面版网页和移动版网页的 DOM 或布局存在差异，也可能会导致 Google 对相应内容有不同的理解。不过，在桌面版和移动版中具有相同的内容可确保这两个版本可以针对相同的关键字获得排名。

- **确保移动版网站所含内容与桌面版网站所含内容相同。**如果移动版网站的内容少于桌面版网站，请考虑更新移动版网站，使其主要内容与桌面版网站等同。您可以针对移动设备采用不同的设计，以最大限度地改善用户体验（例如，将内容移至手风琴式折叠界面或标签页）；只需确保内容与桌面版网站相同即可，因为您网站上的索引都来自移动版网站。如果您本打算让移动版网页的内容少于桌面版网页，那么在您的网站启用“优先将移动版网站编入索引”机制后，您可能会损失一些流量，因为 Google 无法从您的网页获取和之前一样多的信息。请考虑将内容移到手风琴式折叠界面或标签页以节省空间，而不是移除内容。
- **在移动版网站上使用与桌面版网站相同的明确且有意义的标题**。

## 检查您的结构化数据

  如果您的网站上有结构化数据，请确保网站的这两个版本中都包含这些数据。以下是一些需要核查的具体事项：

- **确保移动版网站和桌面版网站包含相同的结构化数据。**
    如果您需要确定应向移动版网站优先添加哪些类型的结构化数据，请从 [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb?hl=zh-cn)、[Product](https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn) 以及 [VideoObject](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn) 结构化数据开始。
- **在结构化数据中使用正确的网址**。确保将移动版网站上的结构化数据中的网址更新为移动版网址。
- **如果您使用了数据标注工具，请在移动版网站上训练它**。如果您使用[数据标注工具](https://support.google.com/webmasters/answer/2692911?hl=zh-cn)提供结构化数据，请定期在[数据标注工具信息中心](https://www.google.com/webmasters/tools/data-highlighter?hl=zh-cn)检查是否有提取错误。

## 在网站的两个版本上添加相同的元数据

  确保在网站的两个版本上使用等效的 [title 元素](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn#page-titles)和[元描述](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#meta-descriptions)。

## 检查广告的展示位置

  不要让广告对移动版网页的排名产生不良影响。在移动设备上展示广告时，应遵循[优质广告标准](https://www.betterads.org/standards/)。例如，网页顶部的广告会在移动设备上占据过多空间，这是一种不良的用户体验

## 检查视觉内容

### 检查图片

  确保移动版网站上的图片遵循[图片最佳实践](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)。具体而言，我们建议您：

- **提供[高质量的图片](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#good-quality-photos)。**不要在移动版网站上使用尺寸过小或分辨率较低的图片。
- **使用[支持的图片格式](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#supported-image-formats)。**不要使用不受支持的格式或标记。
      例如，Google 支持 SVG 格式的图片，但我们的系统无法将内嵌 SVG 所含 * 标记中的 .jpg 图片编入索引。
- **不要使用每次网页加载时都会更改的图片网址**。如果您的资源使用了会不断更改的网址，Google 将无法处理这些资源并将其编入索引。
- **确保移动版网站使用的图片替代文本与桌面版网站相同。**对移动版网站上的图片使用与桌面版网站相同的[描述性替代文本](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#descriptive-alt-text)。
- **确保移动版网页的内容质量与桌面版网页一样出色。**对移动版网站上的图片使用与桌面版网站相同的[标题、说明、文件名和文字](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#descriptive-titles-captions-filenames)。

  **如果网站的桌面版和移动版使用了不同的图片网址，那么当网站改用“优先将移动版网站编入索引”机制后，您可能会发现图片流量出现暂时损失。**这是因为：对 Google 的索引编制系统而言，移动版网站上的图片网址是新内容，而新的图片网址需要经过一段时间才能获得足够多的历史搜索结果以提升排名。为防止图片流量出现暂时损失，请在网站的这两个版本上使用相同的图片网址。如果您不介意图片流量出现暂时损失，则无需采取任何措施。

### 检查视频

  确保移动版网站上的视频遵循[视频最佳实践](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)。具体而言，我们建议您：

- **不要使用每次网页加载时都会更改的视频网址**。
    如果您的资源使用了会不断更改的网址，Google 将无法处理这些资源并将其编入索引。
- **请使用[支持的视频格式](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#file-types)**，并将视频放入支持的标记中。系统会根据网页中是否存在某种 HTML 标记（例如：、 或 ）来识别网页中的视频。
- 在移动版网站和桌面版网站上**使用相同的视频结构化数据**。有关详情，请参阅[检查结构化数据](#structured-data)。
- **将视频放在使用移动设备查看网页时易于找到的位置。**例如，如果用户需要将移动版网页向下滚动好几次才能找到其中的视频，视频排名就可能受到不良影响。

## 关于单独网址的其他最佳实践

  如果您网站上某个网页的桌面版和移动版使用了单独网址（也称为 m. 网址），我们建议您遵循一些额外的最佳做法，具体如下：

- **确保桌面版网站和移动版网站上的报错网页状态是相同的。**如果桌面版网站的某个网页可提供正常内容，而移动版网站的相应网页版本显示报错网页，系统便不会将该网页编入索引。
- **确保移动版网站不包含网址片段**。网址的片段部分是网址末尾以 # 开头的部分。在大多数情况下，网址片段是无法编入索引的；当网域启用“优先将移动版网站编入索引”机制后，这些网页不会编入索引。
- **确保提供不同内容的桌面版本分别具有对应的等效移动版本。**如果您的网域在启用“优先将移动版网站编入索引”机制后，多个不同的网址都会重定向到同一网址（例如在移动设备上重定向到首页），那么所有这些网页都不会编入索引。
- **在 [Search Console](https://search.google.com/search-console?hl=zh-cn) 中验证网站的这两个版本**，确保您能访问这两个版本中的数据和消息。当 Google 为您的网站改用“优先将移动版网站编入索引”机制后，您的网站可能会出现数据改变。
- **检查单独网址中的 hreflang 链接。**当您使用 rel=hreflang [link 元素](https://developers.google.com/search/docs/specialty/international/localized-versions?hl=zh-cn)将网站[国际化](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites?hl=zh-cn)时，请分别与移动版网址和桌面版网址建立链接。移动版网址的 hreflang 必须指向移动版网址，同样，桌面版网址的 hreflang 也必须指向桌面版网址。

      以下是对移动版和桌面版使用单独网址的网站的首页 hreflang 示例。

### 移动版

在此示例中，移动版网站网址为 https://m.example.com/。

```

```

### 桌面版

在此示例中，桌面版网站网址为 https://example.com/。

```

```
- **确保移动版网站有足够的容量**来应对可能更快的[抓取速度](https://support.google.com/webmasters/answer/35253?hl=zh-cn)。
- **验证 [robots.txt 规则](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn)**，确保它们在网站的这两个版本上都能达到预期效果。您可以通过 robots.txt 文件指定网站的哪些部分是可抓取的，哪些部分是不可抓取的。在大多数情况下，您应该对移动版网站和桌面版网站使用相同的 robots.txt 规则。
- **在移动版和桌面版之间使用正确的 rel=canonical 和 rel=alternate link 元素**。桌面版网址始终是规范网址，而移动版网址则是该网址的备用网址。

      以下是采用单独网址的网站的 rel=canonical 和 rel=alternate 示例。

### 移动版

          在此示例中，移动网站网址为 https://m.example.com/，并包含 link 元素，该元素指向作为规范网址的桌面版网址。

```

```

### 桌面版

          在此示例中，桌面版网站网址为 https://example.com/，并包含一个 link 元素（指向作为规范网址的自身），后跟另一个 link 元素（指向作为此网址的备用版本的移动版网址）。

```

```

## 问题排查

  下面列出了各种最常见的错误，这些错误可能会导致无法为网站启用“优先将移动版网站编入索引”机制，也可能会导致网站在启用“优先将移动版网站编入索引”机制后出现排名下降。如果您的网站尚未启用“优先将移动版网站编入索引”机制、您在网站启用“优先将移动版网站编入索引”机制后发现排名下降，或者您在 Search Console 中收到了相关消息，请查看常见错误列表并解决可能存在的错误：

  错误

### 缺少结构化数据

      error***导致问题的原因**：移动版网页未包含桌面版网页的所有结构化数据标记。

        *done* **解决问题**

1. 验证网站的桌面版和移动版上是否都有相应的结构化数据。
2. 确保移动版网站和桌面版网站包含相同的结构化数据。
3. 在结构化数据中使用正确的网址。确保将移动版网站上的结构化数据中的网址更新为正确的网址。
4. 检查结构化数据是否存在提取错误。如果您使用[数据标注工具](https://support.google.com/webmasters/answer/2692911?hl=zh-cn)提供结构化数据，请定期在[数据标注工具信息中心](https://www.google.com/webmasters/tools/data-highlighter?hl=zh-cn)检查是否有提取错误。
5. 使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)确保相关内容在呈现的网页上可见（呈现的网页是指向 Google 呈现的网页）。

### 网页上的 noindex 标记

      *error***导致问题的原因**：noindex 标记禁止将某个移动版网页编入索引。

        *done***解决问题**：在移动版网站和桌面版网站上使用相同的 robots meta 标记。不要在移动版网页上使用 noindex 标记（否则，当您的网站启用“优先将移动版网站编入索引”后，Google 无法将您的网页编入索引）。

### 缺少图片

      *error***导致问题的原因**：移动版网页未包含桌面版网页的所有重要图片。

        *done* **解决问题**

1. 确保移动版网站所含内容与桌面版网站所含内容相同。如果移动版网站的内容少于桌面版网站，请考虑更新移动版网站，使其主要内容与桌面版网站等同。系统只会将移动版网站上显示的内容编入索引。
2. 在移动网站和桌面版网站上使用相同的 robots meta 标记。不要在移动版网页上使用 nofollow 标记（否则，当网站启用“优先将移动版网站编入索引”机制后，Google 无法抓取网页上的图片并将其编入索引）。
3. 使用[支持的图片格式和标记](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#supported-image-formats)。例如，Google 支持 SVG 格式的图片，但我们的系统无法将内嵌 SVG 所含 * 标记中的 .jpg 图片编入索引。
4. 不要依靠用户互动来延迟加载主要内容。Google 不会加载需要用户互动（例如滑动、点击或输入）才能加载的内容。
          [确保 Google 能看到延迟加载的内容](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading?hl=zh-cn)。

### 图片被屏蔽

      error***导致问题的原因**：移动版网页上的某张重要图片被 robots.txt 屏蔽了。

        *done***解决问题**：允许 Google 抓取您的资源。某些图片在移动版网站上的网址不同于在桌面版网站上的网址。如果您想让 Google 抓取网址，请不要使用 [disallow 规则](https://developers.google.com/search/doc/crawling-indexing/robots/robots_txt?hl=zh-cn#disallow)屏蔽相应网址。

### 图片质量不佳

      *error***导致问题的原因**：移动版网页上的某张重要图片的尺寸太小或分辨率过低。

        *done***解决问题**：提供[高质量的图片](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#good-quality-photos)。
        不要在移动版网站上使用尺寸过小或分辨率较低的图片。

### 缺少替代文本

      *error***导致问题的原因**：移动版网页上的某张重要图片缺少替代文本。

        *done***解决问题**：对移动版网站上的图片使用与桌面版网站相同的[替代文本](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#descriptive-alt-text)。

### 缺少网页标题

      *error***导致问题的原因**：移动版网页缺少标题。

        *done***解决问题**：确保在网站的这两个版本上使用等效的[标题](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn#page-titles)和[元描述](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#meta-descriptions)。

### 缺少元描述

      *error***导致问题的原因**：移动版网页缺少元描述。

        *done***解决问题**：确保在网站的这两个版本上使用等效的[标题](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn#page-titles)和[元描述](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#meta-descriptions)。

### 移动网址指向报错网页

      *error***导致问题的原因**：移动版网页是报错网页。

        *done***解决问题**：确保桌面版网站和移动版网站上的报错网页状态是相同的。如果桌面版网站的某个网页可提供正常内容，而移动版网站的相应网页版本显示报错网页，系统便不会将该网页编入索引。

### 移动网址包含锚标记片段

      *error***导致问题的原因**：移动版网址包含锚标记片段，而 Google 无法将包含此类片段的网址编入索引。

*done***解决问题**：确保移动版网站不包含网址片段。在大多数情况下，片段网址是无法编入索引的；网域启用“优先将移动版网站编入索引”机制后，系统不会将这些网页编入索引。

### 移动版网页被 robots.txt 屏蔽

      *error***导致问题的原因**：移动版网页被 robots.txt 规则屏蔽了。

        *done***解决问题**：验证 robots.txt 规则和 robots meta 标记，确保它们在网站的这两个版本上都能达到预期效果。对移动版网站和桌面版网站使用相同的 robots.txt 规则。

### 重复定向到同一个移动版网页

      *error***导致问题的原因**：有多个桌面版网页重定向到同一个移动版网页。

        *done***解决问题**：确保提供不同内容的桌面版都有与之对等的移动版。如果不同的网址在移动设备上重定向到相同的网址，网域启用“优先将移动版网站编入索引”机制后，这些网页都不会编入索引中。

### 桌面版网站重定向到移动版网站的首页

      *error***导致问题的原因**：桌面版网站中的大多数或所有网页均会重定向到移动版网站的首页。

        *done***解决问题**：确保桌面版网页有与之等效的移动版网页。如果多个不同的网址都会在移动设备上重定向到首页，那么当网域迁移至“优先将移动版网站编入索引”机制后，所有这些网页都不会编入索引中。

### 网页存在质量问题

      *error***导致问题的原因**：移动版网页缺少内容，或者在广告、标题或图片的描述性元素方面有问题。

        *done* **解决问题**：

1. 不要让广告对移动版网页的排名产生不良影响。在移动设备上展示广告时，应遵循[优质广告标准](https://www.betterads.org/standards/)。
2. 确保移动版网站包含的内容与桌面版网站相同。如果移动版网站的内容少于桌面版网站，请考虑更新移动版网站，使其主要内容与桌面版网站等同。系统只会将移动版网站上显示的内容编入索引。
3. 确保在移动版网站上使用与桌面版网站相同的明确且有意义的标题。
4. 对移动版网站上的图片使用与桌面版网站相同的[标题、说明、文件名和文字](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#descriptive-titles-captions-filenames)。

### 视频问题

      *error***导致问题的原因**：移动版网页包含有以下问题的视频：格式不受支持、所在位置难以找到、缺少元描述，或加载速度很慢。

        *done* **解决问题**：

1. 使用[支持的视频格式](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#file-types)，并将其放入支持的标记中。系统会根据网页中是否存在某种 HTML 标记（例如：、 或 ）来识别网页中的视频。
2. 不要依靠用户互动来延迟加载主要内容。Google 不会加载需要用户互动（例如滑动、点击或输入）才能加载的内容。
          [确保 Google 能看到延迟加载的内容](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading?hl=zh-cn)。
3. 将视频放在移动版网站上易于找到的位置。例如，如果用户需要将移动版网页向下滚动好几次才能找到其中的视频，视频排名就可能受到不良影响。

### 主机负载问题

      *error***导致问题的原因**：部分主机的主机负载不足。

        *done***解决问题**：确保移动版网站有足够的容量来应对可能更快的[抓取速度](https://support.google.com/webmasters/answer/35253?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。