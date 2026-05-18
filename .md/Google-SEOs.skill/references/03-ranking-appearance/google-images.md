# 图片搜索引擎优化 (SEO) 最佳实践 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn

---

  # Google 图片 SEO 最佳实践

  Google 提供了多种搜索功能和产品（例如[文字结果图片](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result-image)、Google 探索和 Google 图片），以便帮助用户以直观的方式在网络上发掘信息。虽然每个功能和产品看起来都不同，但有关如何使图片出现在这些功能和产品中的一般建议是相同的。

  您可以按照以下最佳实践优化您的图片，使其能够出现在 Google 搜索结果中：

1. [帮助我们发现您的图片并将其编入索引](#discover-images)
2. [优化图片着陆页](#optimize-landing-page)

## 帮助我们发现您的图片并将其编入索引

  若要使您的内容出现在 Google 的搜索结果中，需要遵守一些[技术要求](https://developers.google.com/search/docs/essentials/technical?hl=zh-cn)，这些要求同样适用于图片。图片的格式与 HTML 有很大不同，这意味着要使图片被编入索引，需要满足更多要求；例如，在您的网站上查找图片的方式不同，而且图片的呈现方式也会影响图片是否会被编入索引，并影响图片是否对应于适当的关键字。

### 使用 HTML 图片元素来嵌入图片

  使用标准 HTML 图片元素有助于抓取工具找到和处理图片。Google 可以在 <img> 元素的 src 属性中找到图片（即使该元素是 <picture> 等其他元素的子元素）。Google 不会将 CSS 图片编入索引。

  良好**：

**
  <img src="puppy.jpg" alt="金毛寻回犬" />

  效果欠佳**：

**
  <div style="background-image:url(puppy.jpg)">金毛寻回犬</div>

### 使用图片站点地图

  您可以通过[提交图片站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps?hl=zh-cn)，提供我们可能无法通过其他方式发现的图片的网址。

  与常规站点地图不同，您可以在图片站点地图的 <image:loc> 元素中添加其他网域的网址。这意味着您可以使用 CDN（内容分发网络）来托管图片。如果您使用了 CDN，建议您在 Search Console 中[验证该 CDN 的域名的所有权](https://support.google.com/webmasters/answer/9008080?hl=zh-cn)，以便我们能在发现任何抓取错误时通知您。

### 自适应图片

  设计自适应网页可以带来更好的用户体验，因为用户可以在多种设备上访问这些网页。请参阅我们的[自适应图片指南](https://web.dev/articles/responsive-images?hl=zh-cn)，了解关于处理您网站上的图片的最佳实践。

  网页会使用 <picture> 元素或使用 img 元素的 srcset 属性来指定自适应图片。不过，某些浏览器和抓取工具无法理解这些属性。我们建议您一律通过 src 属性指定后备网址。

  借助 srcset 属性，您可指定同一图片的不同版本，特别是针对不同屏幕尺寸指定不同版本。例如：

```
<img
  srcset="maine-coon-nap-320w.jpg 320w, maine-coon-nap-480w.jpg 480w, maine-coon-nap-800w.jpg 800w"
  sizes="(max-width: 320px) 280px, (max-width: 480px) 440px, 800px"
  src="maine-coon-nap-800w.jpg"
  alt="A watercolor illustration of a maine coon napping leisurely in front of a fireplace">
```

  <picture> 元素是一个容器，用于对同一图片的不同 <source> 版本进行分组。它提供了一种后备方法，让浏览器能够根据设备特征（例如像素密度和屏幕尺寸）选择合适的图片。对于尚不支持新图片格式的客户端而言，picture 元素也非常便于利用内置的优雅降级功能处理新图片格式。

  根据 [HTML 标准第 4.8.1 节](https://html.spec.whatwg.org/multipage/embedded-content.html#the-picture-element)的规定，在使用 picture 元素时，请务必提供 img 元素（带 src 属性）作为后备，格式如下：

```
<picture>
  <source type="image/svg+xml" srcset="pyramid.svg">
  <source type="image/webp" srcset="pyramid.webp">
  <img src="pyramid.png" alt="An 1800s oil painting of The Great Pyramid">
</picture>
```

### 使用支持的图片格式

  Google 搜索支持在 img 的 src 属性中引用采用以下文件格式的图片： 

    BMP、GIF、JPEG、PNG、WebP、SVG 和 AVIF
。另外，最好让文件扩展名与文件类型相匹配。

  您还可以将图片内嵌为数据 URI。数据 URI 提供了一种内嵌图片等文件的方式，可以通过将 img 元素的 src 属性设置为采用 Base64 编码的字符串来实现，格式如下：

```
<img src="data:image/svg+xml;base64,[data]">
```

  虽然内嵌图片能够减少 HTTP 请求，但需要慎重判断何时使用这种图片，因为这种图片可能会导致网页大小大幅增加。如需了解详情，请参阅 [web.dev 页面中的“内嵌图片的优势和劣势”部分](https://web.dev/articles/responsive-images?hl=zh-cn#inlining_pros_cons)。

### 进行优化以提升速度和质量

  与模糊不清的图片相比，高画质图片对用户更有吸引力。另外，搜索结果略缩图中的清晰图片也更能吸引用户，并提高获取用户流量的可能性。也就是说，图片通常是影响整体网页大小的最大因素，可能会导致网页在加载时速度缓慢、开销巨大。请务必采用[最新的图片优化技术](https://web.dev/fast?hl=zh-cn#optimize-your-images)和[自适应图片技术](https://web.dev/learn/design?hl=zh-cn)，以提供优质且高速的用户体验。

  您可以使用 [PageSpeed Insights](https://pagespeed.web.dev/?hl=zh-cn) 分析网站速度，并访问我们的[为什么速度很重要？](https://web.dev/learn/performance/why-speed-matters?hl=zh-cn)页面。
  了解提高网站性能的最佳实践和技巧。

## 优化图片着陆页

  虽然不是立竿见影，但嵌入图片的页面的内容和元数据可以对图片在 Google 搜索结果中的显示方式和位置产生很大影响。

### 通过元数据指定首选图片

  Google 对图片预览的选择是完全自动化的，并且会考虑多种不同的来源，以选择在 Google 上显示给定网页上的哪张图片（例如[文字结果图片](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result-image)或 Google 探索中的预览图片）。

  您可以通过以下元数据来源提供您首选的图片，从而引导系统选择您偏好的图片：

- 使用 URL 或 ImageObject 指定 schema.org [primaryImageOfPage](https://schema.org/primaryImageOfPage) 属性。

```
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "url": "https://example.com/url",
  "primaryImageOfPage": "https://example.com/images/cat.png"
}
```

或者，指定图片 URL 或 ImageObject 属性，并将其附加到主实体（使用 schema.org [mainEntity](https://schema.org/mainEntity) 或 [mainEntityOfPage](https://schema.org/mainEntityOfPage) 属性）：

```
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "mainEntityOfPage": "https://example.com/url",
  "image": "https://example.com/images/cat.png"
}
```
- 指定 [og:image](https://ogp.me/) meta 标记。

```

```

  在选择要在 schema.org 标记或 og:image meta 标记中使用的首选图片时，请遵循以下最佳实践：

- 选择一张与网页内容相关且能代表网页的图片。
- 避免在 schema.org 标记或 og:image meta 标记中使用通用图片（例如网站徽标）或包含文字的图片。
- 避免使用宽高比过于极端（例如过窄或过宽）的图片。
- 尽可能使用高分辨率的图片。

### 检查网页标题和说明

  Google 搜索会自动生成标题链接和摘要，以充分描述每条结果并表明结果与用户查询有何关系。这可帮助用户决定是否要点击某条搜索结果。
  下面这两个示例展示了标题链接和摘要在 Google 搜索结果页上可能的显示效果：

  我们会使用很多不同的来源生成此信息，例如每个网页的 title 和 meta 标记中的信息。

  通过遵循 Google 的[标题](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn)和[摘要](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn)指南，您可以帮助我们改善为您的网页显示的标题链接和摘要的质量。

### 添加结构化数据

  如果您添加了结构化数据，Google 就能以特定[富媒体搜索结果](https://developers.google.com/search/docs/appearance/structured-data/search-gallery?hl=zh-cn)的形式（包括使用[醒目标记](https://developers.google.com/search/blog/2017/08/badges-on-image-search-help-users-find?hl=zh-cn)）在 Google 图片中展示您的图片，这不仅可为用户提供关于您的网页的相关信息，还能为您的网站带来更有针对性的流量。

  请遵循[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)以及专门针对您的结构化数据类型的指南，否则您的结构化数据可能无法在 Google 图片中显示为富媒体搜索结果。对于上述每一种结构化数据类型，您都必须提供图片属性字段，才能在 Google 图片中显示相应标记和富媒体搜索结果。下面这两个示例展示了富媒体搜索结果在 Google 图片上可能的显示效果：

### 使用具有描述性的文件名、标题和替代文本

  Google 会从图片所在网页的内容中提取与图片主题有关的信息，包括图片说明和图片标题。请尽可能确保将图片放置在相关文字附近，以及与其主题相关的网页上。

  同样，Google 也可将文件名作为细微的线索来推断图片的主题。
  尽可能使用简短但具有描述性的文件名。例如，my-new-black-kitten.jpg 比 IMG00023.JPG 更好。尽可能避免使用 image1.jpg、pic.gif、1.jpg 等通用文件名。
  如果您的网站包含数以千计的图片，建议您让系统自动为图片命名。如果要本地化您的图片，请记得还要翻译文件名；如果您使用的是非拉丁字符或特殊字符，请遵守[网址编码指南](https://developers.google.com/search/docs/crawling-indexing/url-structure?hl=zh-cn)。

  在为图片提供更多元数据时，最重要的属性是替代文本（描述图片的文本），它还有助于无法在网页上看到图片的用户更好地访问图片，包括使用屏幕阅读器的用户或网络连接带宽较低的用户。

  Google 会结合使用替代文本与计算机视觉算法和页面内容来理解图片的主题。如果您决定将图片用作链接，图片的替代文本还可作为定位文字发挥作用。

  在编写替代文本时，请创建实用、信息丰富的内容，并且内容要恰当使用关键字且与网页内容相符。请避免在 alt 属性中滥用关键字（亦称为[关键字堆砌](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#keyword-stuffing)），因为这会导致不良的用户体验，并且可能会导致您的网站被视为垃圾网站。

  效果欠佳（缺少替代文本）**：

**
  <img src="puppy.jpg"/>

  效果欠佳（关键字堆砌）**：

**
  <img src="puppy.jpg" alt="puppy dog baby dog pup pups puppies
      doggies pups litter puppies dog retriever labrador wolfhound setter pointer puppy jack russell
      terrier puppies dog food cheap dogfood puppy food"/>

  效果较佳**：

**
  <img src="puppy.jpg" alt="puppy"/>

  效果最佳**：

**
  <img src="puppy.jpg" alt="Dalmatian puppy playing fetch"/>

  此外，还要考虑替代文本的无障碍性，以遵守 [W3 准则](https://www.w3.org/WAI/tutorials/images/)。对于 <img> 元素，您可以添加该元素的 alt 属性；对于内嵌 <svg> 元素，您可以使用 <title> 元素。例如：

```
<svg aria-labelledby="svgtitle1">
  <title id="svgtitle1">Googlebot wearing an apron and chef hat, struggling to make pancakes on the stovetop</title>
</svg>
```

  我们建议您通过[审核无障碍性](https://developer.chrome.com/docs/devtools/accessibility/reference?hl=zh-cn)和[使用慢速网络连接模拟器](https://developer.chrome.com/docs/devtools/network/reference?hl=zh-cn#throttling)测试您的内容。

  如果某个图片在较大的网站中的多个网页上被引用，请考虑[网站的总体抓取预算](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget?hl=zh-cn)。
  特别是，请始终使用相同的网址引用该图片，以便 Google 可以缓存和重复使用该图片，而无需多次请求该图片。

## 选择停用 Google 图片内嵌链接

  选择停用 Google 图片搜索结果页中的内嵌链接，即可阻止完整尺寸的图片显示在 Google 图片搜索结果页中。
  要选择停用内嵌链接，请按照以下步骤操作：**

1. 当有人请求访问您的图片时，检查该请求中的 [HTTP 引荐来源网址标头](https://en.wikipedia.org/wiki/HTTP_referer)。
2. 如果该请求来自 Google 域名，请回复 200 HTTP 状态代码，或回复 204 HTTP 状态代码，但不包含任何内容。

  Google 仍会抓取您的网页并会看到该图片，但会在搜索结果中显示抓取时生成的缩略图。您随时都可选择停用内嵌链接，且无需重新处理网站上的图片。该行为不会被视为图片[伪装真实内容](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#cloaking)，也不会引发人工处置措施。

  或者，您可以[彻底阻止图片显示在搜索结果中](https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page?hl=zh-cn)。

## 针对安全搜索进行优化

  安全搜索是 Google 用户账号中的一项设置，用于指定是要在 Google 搜索结果中显示、模糊处理还是屏蔽包含露骨内容的图片、视频和网站。请确保 Google 了解您网站的性质，以便 Google 酌情为您的网站应用安全搜索过滤条件。[详细了解如何针对安全搜索标记网页](https://developers.google.com/search/docs/crawling-indexing/safesearch?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。