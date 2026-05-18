# 了解 JavaScript SEO 基础知识 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics?hl=zh-cn

---

# 了解 JavaScript SEO 基础知识

      您是否怀疑 JavaScript 问题可能导致您的网页或网页上的部分内容无法显示在 Google 搜索结果中？请参阅我们的[问题排查指南](https://developers.google.com/search/docs/guides/fix-search-javascript?hl=zh-cn)，了解如何解决 JavaScript 相关问题。

  JavaScript 是网络平台的重要组成部分，因为它提供的很多功能可将网络转变成一个非常强大的应用平台。请设法让用户能够通过 Google 搜索轻松找到您的由 JavaScript 提供支持的 Web 应用，这样做有助于您在用户搜索您的 Web 应用所提供的内容时找到新用户并再度吸引现有用户。
      虽然 Google 搜索使用[常青 Chromium](https://developers.google.com/search/blog/2019/05/the-new-evergreen-googlebot?hl=zh-cn) 来运行 JavaScript，但[您可从几个方面进行优化](https://developers.google.com/search/docs/guides/fix-search-javascript?hl=zh-cn)。

本指南将介绍 Google 搜索如何处理 JavaScript，以及与针对 Google 搜索改进 JavaScript 网络应用相关的最佳实践。

## Google 如何处理 JavaScript

Google 对 JavaScript 网络应用的处理流程分为 3 大阶段：

1. 抓取
2. 呈现
3. 编入索引

  *

  Googlebot 会将网页加入队列以进行抓取和呈现。当某个网页正在等待被抓取/被渲染时，这种状态很难直接判断出来。
    当 Googlebot 尝试通过发出 HTTP 请求从抓取队列中抓取某个网址时，它首先会检查您是否允许抓取。Googlebot 会读取 [robots.txt](https://developers.google.com/search/reference/robots_txt?hl=zh-cn) 文件。如果此文件将该网址标记为“disallowed”，Googlebot 就会跳过向该网址发出 HTTP 请求的操作，然后会跳过该网址。Google 搜索不会渲染来自屏蔽文件或屏蔽网页的 JavaScript。

  接下来，Googlebot 会解析 HTML 链接的 href 属性中其他网址的响应，并将这些网址添加到抓取队列中。若不想让 Googlebot 发现链接，请使用 [ nofollow机制](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links?hl=zh-cn)。

  您可以使用 JavaScript 将链接注入 DOM，前提是此类链接遵循[适用于可供抓取的链接的最佳实践](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn#crawlable-links)。

  抓取网址并解析 HTML 响应非常适用于经典网站或服务器端渲染的网页（在这些网站或网页中，HTTP 响应中的 HTML 包含所有内容）。某些 JavaScript 网站可能会使用[应用 Shell 模型](https://developers.google.com/web/fundamentals/architecture/app-shell?hl=zh-cn)（在该模型中，初始 HTML 不包含实际内容，并且 Google 需要执行 JavaScript，然后才能查看 JavaScript 生成的实际网页内容）。

  Googlebot 会将所有具有 200 HTTP 状态代码的网页都加入渲染队列，除非 [robots meta 标记或标头](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn)告知 Google 不要将网页编入索引。
  网页在此队列中的存在时长可能会是几秒钟，但也可能会是更长时间。一旦 Google 的资源允许，无头 Chromium 便会渲染相应网页并执行 JavaScript。Googlebot 会再次解析所渲染的链接 HTML，并将找到的网址加入抓取队列。Google 还会使用所呈现的 HTML 将网页编入索引。

  所有具有 200 HTTP 状态代码的网页都会发送到渲染队列，无论网页上是否存在 JavaScript。
  如果 HTTP 状态代码不是 200（例如，在状态代码为 404 的错误页面上），则可能会跳过渲染。

  请注意，依然建议您采取[服务器端渲染或预渲染](https://developers.google.com/web/updates/2019/02/rendering-on-the-web?hl=zh-cn)，因为：(1) 它可让用户和抓取工具更快速地看到您的网站内容；(2) 并非所有漫游器都能运行 JavaScript。

## 用独特的标题和摘要来描述网页

  独特的描述性 [<title> 元素](https://developers.google.com/search/docs/appearance/title-link?hl=zh-cn#page-titles)和[元描述](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#meta-descriptions)可帮助用户快速找到符合其目标的理想结果。
  您可以使用 JavaScript 设置或更改元描述及 <title> 元素。

## 设置规范网址

  [rel="canonical" 链接标记](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn#rel-canonical-link-method)可帮助 Google 找到网页的规范版本。
  您可以使用 JavaScript 设置规范网址，但请注意，您不应使用 JavaScript 将规范网址更改为在原始 HTML 中指定的规范网址以外的其他网址。
  设置规范网址的最佳方式是使用 HTML，但如果您必须使用 JavaScript，请确保您始终将规范网址设置为与原始 HTML 相同的值。
  如果您无法在 HTML 中设置规范网址，则可以使用 JavaScript 设置规范网址，并将其从原始 HTML 中移除。

## 编写兼容的代码

  浏览器提供了很多 API，而 JavaScript 是一种快速演变的语言。Google 对所支持的 API 和 JavaScript 功能有一些限制。若要确保您的代码与 Google 兼容，请遵循我们的 [JavaScript 问题排查指南](https://developers.google.com/search/docs/guides/fix-search-javascript?hl=zh-cn)。

  如果您使用功能检测机制检测到您所需的某个浏览器 API 缺失了，我们建议您[使用差异化呈现和 polyfill](https://web.dev/articles/codelab-serve-modern-code?hl=zh-cn)。
  由于无法对一些浏览器功能使用 polyfill，因此我们建议您查看 polyfill 文档以了解是否存在某些限制条件。

## 使用有意义的 HTTP 状态代码

      Googlebot 会通过 [HTTP 状态代码](https://developers.google.com/search/docs/crawling-indexing/http-network-errors?hl=zh-cn)确定抓取网页时是否出现了问题。

  如需告知 Googlebot 无法抓取某个网页或无法将某个网页编入索引，请使用有意义的状态代码（例如：404 表示找不到网页，401 代码表示必须登录才能访问网页）。您可以使用 HTTP 状态代码告知 Googlebot 某个网页是否已移至新网址，以便系统相应地更新索引。

下面列出了 [HTTP 状态代码](https://developers.google.com/search/docs/crawling-indexing/http-network-errors?hl=zh-cn#http-status-codes)及其对 Google 搜索的影响。

### 避免单页应用中出现 soft 404 错误

  在客户端呈现的单页应用中，路由通常实现为客户端路由。
  在这种情况下，使用有意义的 HTTP 状态代码可能是无法实现或不实际的。
  为避免在使用客户端渲染和路由时出现 [soft 404 错误](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors?hl=zh-cn#soft-404-errors)，请采用以下策略之一：

- 使用 [JavaScript 重定向](https://developers.google.com/search/docs/crawling-indexing/301-redirects?hl=zh-cn#jslocation)至服务器响应 404 HTTP 状态代码（例如 /not-found）的网址。
- 使用 JavaScript 向错误页面添加 。

以下是重定向方法的示例代码：

```
fetch(`/api/products/${productId}`)
.then(response => response.json())
.then(product => {
  if(product.exists) {
    showProductDetails(product); // shows the product information on the page
  } else {
    // this product does not exist, so this is an error page.
    window.location.href = '/not-found'; // redirect to 404 page on the server.
  }
})
```

以下是 noindex 标记方法的示例代码：

```
fetch(`/api/products/${productId}`)
.then(response => response.json())
.then(product => {
  if(product.exists) {
    showProductDetails(product); // shows the product information on the page
  } else {
    // this product does not exist, so this is an error page.
    // Note: This example assumes there is no other robots meta tag present in the HTML.
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex';
    document.head.appendChild(metaRobots);
  }
})
```

## 使用 History API 而非片段

  只有当链接是[包含 href 属性的 <a> HTML 元素](https://developers.google.com/search/docs/crawling-indexing/links-crawlable?hl=zh-cn)时，Google 才能发现您的链接。

  对于实现客户端路由的单页应用，请使用 [History API](https://developer.mozilla.org/en-US/docs/Web/API/History) 在 Web 应用的不同视图之间实现路由。为确保 Googlebot 能够解析并抓取您的网址，请不要使用片段加载不同的网页内容。以下示例是一个不好的做法，因为 Googlebot 无法可靠地解析网址：

```
<nav>
  <ul>
    <li><a href="#/products">Our products</a></li>
    <li><a href="#/services">Our services</a></li>
  </ul>
</nav>

<h1>Welcome to example.com!</h1>
<div id="placeholder">
  <p>Learn more about <a href="#/products">our products</a> and <a href="#/services">our services</a></p>
</div>
<script>
window.addEventListener('hashchange', function goToPage() {
  // this function loads different content based on the current URL fragment
  const pageToLoad = window.location.hash.slice(1); // URL fragment
  document.getElementById('placeholder').innerHTML = load(pageToLoad);
});
</script>
```

不过，您可以通过实现 History API，确保 Googlebot 可以访问您的网址：

```
<nav>
  <ul>
    <li><a href="/products">Our products</a></li>
    <li><a href="/services">Our services</a></li>
  </ul>
</nav>

<h1>Welcome to example.com!</h1>
<div id="placeholder">
  <p>Learn more about <a href="/products">our products</a> and <a href="/services">our services</a></p>
</div>
<script>
function goToPage(event) {
  event.preventDefault(); // stop the browser from navigating to the destination URL.
  const hrefUrl = event.target.getAttribute('href');
  const pageToLoad = hrefUrl.slice(1); // remove the leading slash
  document.getElementById('placeholder').innerHTML = load(pageToLoad);
  window.history.pushState({}, window.title, hrefUrl) // Update URL as well as browser history.
}

// Enable client-side routing for all links on the page
document.querySelectorAll('a').forEach(link => link.addEventListener('click', goToPage));

</script>
```

## 正确注入 rel="canonical" 链接标记

  您可以使用 JavaScript 注入 [rel="canonical" 链接标记](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn#rel-canonical-link-method)，但我们不建议这样做。
  在呈现网页时，Google 搜索会提取注入的规范网址。 下例展示了如何使用 JavaScript 注入 rel="canonical" 链接标记：

```
fetch('/api/cats/' + id)
  .then(function (response) { return response.json(); })
  .then(function (cat) {
    // creates a canonical link tag and dynamically builds the URL
    // e.g. https://example.com/cats/simba
    const linkTag = document.createElement('link');
    linkTag.setAttribute('rel', 'canonical');
    linkTag.href = 'https://example.com/cats/' + cat.urlFriendlyName;
    document.head.appendChild(linkTag);
  });
```

  使用 JavaScript 注入 rel="canonical" 链接标记时，请确保这是网页上唯一的 rel="canonical" 链接标记。
  不正确的实现方式可能会创建多个 rel="canonical" 链接标记或更改现有的 rel="canonical" 链接标记。存在冲突或有多个 rel="canonical" 链接标记可能会导致意外结果。

## 谨慎使用 robots meta 标记

  您可以通过 robots meta 标记阻止 Google 将某个网页编入索引或跟踪链接。
  例如，在网页顶部添加以下 meta 标记可阻止 Google 将该网页编入索引：

```
<!-- Google won't index this page or follow links on this page -->
<meta name="robots" content="noindex, nofollow">
```

  您可以使用 JavaScript 将 robots meta 标记添加到网页中或更改其内容。
  以下示例代码展示了如何使用 JavaScript 更改 robots meta 标记，防止在 API 调用未返回内容时将当前网页编入索引。

```
fetch('/api/products/' + productId)
  .then(function (response) { return response.json(); })
  .then(function (apiResponse) {
    if (apiResponse.isError) {
      // get the robots meta tag
      var metaRobots = document.querySelector('meta[name="robots"]');
      // if there was no robots meta tag, add one
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      // tell Google to exclude this page from the index
      metaRobots.setAttribute('content', 'noindex');
      // display an error message to the user
      errorMsg.textContent = 'This product is no longer available';
      return;
    }
    // display product information
    // ...
  });
```

  如果 Google 遇到 noindex 标记，可能会跳过渲染和 JavaScript 执行步骤，这意味着使用 JavaScript 更改或移除 noindex 中的 robots meta 标记可能无法实现预期效果。如果您确实希望将网页编入索引，*请勿在原始网页代码中使用 noindex 标记。

## 使用长效缓存

        Googlebot 会主动缓存内容，以减少网络请求和资源使用量。WRS 可能会忽略缓存标头。这可能会导致 WRS 使用过时的 JavaScript 或 CSS 资源。为了避免这个问题，您可以创建内容指纹，使其成为文件名的一部分（如 main.2bb85551.js）。
            指纹取决于文件的内容，因此每次更新都会生成不同的文件名。
  如需了解详情，请参阅 [web.dev 长效缓存策略指南](https://web.dev/articles/http-cache?hl=zh-cn#versioned-urls)。

## 使用结构化数据

  在您的网页上使用[结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)时，您可以使用 [JavaScript 生成所需的 JSON-LD 并将其注入网页中](https://developers.google.com/search/docs/guides/generate-structured-data-with-javascript?hl=zh-cn#testing)。请务必[测试您的实现效果](https://developers.google.com/search/docs/guides/debug?hl=zh-cn)，避免出现问题。

## 遵循网络组件最佳做法

  Google 支持网络组件。
  当 Google 呈现某个网页时，它会[扁平化 shadow DOM 和 light DOM](https://developers.google.com/web/fundamentals/web-components/shadowdom?hl=zh-cn#lightdom) 内容。
  这意味着 Google 只能看到在所呈现的 HTML 中可见的内容。若要确保 Google 在您的内容渲染后仍能看到该内容，请使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)或[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)查看所渲染的 HTML。

  如果该内容在所呈现的 HTML 中不可见，Google 将无法将其编入索引。

  以下示例会创建一个网络组件，以便在其 shadow DOM 内显示 light DOM 内容。
  确保 light DOM 和 shadow DOM 内容均能显示在所呈现的 HTML 中的一种方法是使用 [Slot](https://developers.google.com/web/fundamentals/web-components/shadowdom?hl=zh-cn#slots) 元素。

```
<script>
  class MyComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
      let p = document.createElement('p');
      p.innerHTML = 'Hello World, this is shadow DOM content. Here comes the light DOM: <slot></slot>';
      this.shadowRoot.appendChild(p);
    }
  }

  window.customElements.define('my-component', MyComponent);
</script>

<my-component>
  <p>This is light DOM content. It's projected into the shadow DOM.</p>
  <p>WRS renders this content as well as the shadow DOM content.</p>
</my-component>
```

呈现后，Google 可以将此内容编入索引：

```
<my-component>
  Hello World, this is shadow DOM content. Here comes the light DOM:
  <p>This is light DOM content. It's projected into the shadow DOM<p>
  <p>WRS renders this content as well as the shadow DOM content.</p>
</my-component>

```

## 修正图片和延迟加载的内容

  图片在带宽和性能方面的开销可能会非常高昂。一种可取的策略是：使用延迟加载方法，仅在用户即将看到图片时才加载图片。若要确保以方便用户搜索的方式实现延迟加载，请遵循[我们的延迟加载指南](https://developers.google.com/search/docs/guides/lazy-loading?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。