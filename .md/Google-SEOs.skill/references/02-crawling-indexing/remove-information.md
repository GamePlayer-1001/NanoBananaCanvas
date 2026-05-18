# 从 Google 搜索结果中移除您的网站信息 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/remove-information?hl=zh-cn

---

# 从 Google 搜索结果中移除您网站上托管的网页

    **如果您不是相应网页的所有者**，请改为参阅[从 Google 搜索结果中移除个人信息](https://support.google.com/websearch/troubleshooter/3111061?hl=zh-cn)。

如需快速移除网页，不妨使用[“移除”工具](https://support.google.com/webmasters/answer/9689846?hl=zh-cn)，这样 1 天内即可从 Google 搜索结果中移除托管在您网站上的网页。

      对于您想移除的内容，请为其网址的所有变体设置保护机制或予以移除。在许多情况下，不同的网址可能会指向同一网页。例如，example.com/puppies、example.com/PUPPIES 和 example.com/petchooser?pet=puppies 都指向同一网页。[了解如何查找要屏蔽的网页的正确网址](https://support.google.com/webmasters/answer/9689846?hl=zh-cn#zippy=,web-page-url)。

## 
      永久移除内容

      在“移除”工具中发出的请求的有效期大约为 6 个月。若要永久阻止某个网页显示在 Google 搜索结果中，请采取以下做法之一：

- **移除或更新您网页上的内容**。这是一种最为安全的方式，可防止您的信息显示在可能不遵循 noindex 标记的其他搜索引擎中，还可确保其他人无法访问您的网页。
- **通过密码保护您的网页**。通过限制对网页的访问，可让合适的用户查看您的网页，同时阻止 Googlebot 和其他网页抓取工具访问该网页。
- **向网页中添加 [noindex 标记](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn)**。noindex 标记仅会阻止您的网页显示在 Google 搜索结果中。用户和其他不支持 noindex 的搜索引擎仍可访问您的网页。

    请勿使用 robots.txt 屏蔽您的网页。详细了解 [robots.txt 的限制](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=zh-cn#understand-the-limitations-of-a-robots.txt-file)。

## 
      从搜索结果中移除图片

      了解如何[从搜索结果中移除您网站上托管的图片](https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page?hl=zh-cn)。

## 
      从其他 Google 产品和服务中移除信息

      若要从其他 Google 产品和服务中移除内容，请搜索相应产品的帮助文档，了解具体的移除方法。例如：

- **Google 购物以及一些其他 Google 产品和服务**：您可以[选择不让您的内容出现在特定 Google 产品和服务的搜索结果中](https://support.google.com/webmasters/answer/3035947?hl=zh-cn)。
- **商家信息**：您可以[修改您在商家资料中添加的商家信息](https://support.google.com/business/answer/3039617?hl=zh-cn)。
- **Google 知识面板**：您可以[更新您的 Google 知识面板](https://support.google.com/knowledgepanel/answer/7534842?hl=zh-cn)。

## 如何从不归我所有的网站中移除内容？

      请参阅这篇关于如何[从 Google 搜索结果中移除个人信息](https://support.google.com/websearch/troubleshooter/3111061?hl=zh-cn)的帮助文章。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。