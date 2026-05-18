# 控制您在 Google 搜索中分享的内容 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/crawling-indexing/control-what-you-share?hl=zh-cn

---

  # 控制与 Google 分享的内容

  Google 让网站所有者可通过多种方式控制在 Google 搜索结果中显示的内容。虽然大多数人想要的是将网页编入索引，但有时也可能需要采取与之相反的措施：阻止内容显示在 Google 搜索结果中。您可能会出于多种原因而希望阻止 Google 访问您的某些内容：

- **限制数据**：您可能希望将自己网站上托管的数据仅呈现给已进入您网站的用户。您可以阻止 Google 抓取此类数据，使其不会显示在搜索结果中。

    另请注意，您网站上发布的某些文件可能包含可在 Google 搜索中显示的元数据。
    [详细了解如何让隐去的信息不显示在 Google 搜索中](https://developers.google.com/search/docs/crawling-indexing/keep-redacted-information-out?hl=zh-cn)。
- **避免向受众群体显示价值不大的内容**：您的网站可能包含质量低劣的内容，这类内容不应显示在 Google 搜索中。例如，如果您的网站允许用户创建内容，则其中部分内容可能[质量低劣，甚至是垃圾内容](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#user-generated-spam)。
    如果允许将此类内容编入索引，便可能会对您的网站在 Google 搜索结果中的排名产生负面影响。
- **让 Google 专注于您的重要内容**：如果您的网站非常庞大（包含超过数十万个网址），且具有内容不太重要的网页，或者有大量重复内容，则可能需要阻止 Google 抓取重复或重要性较低的网页，从而使其专注于更重要的内容。

## 如何屏蔽内容

以下是阻止内容显示在 Google 中的主要方式：

  方法

### 从您的网站中移除内容

        适用对象：所有类型的内容**

        要想避免让内容出现在 Google 搜索中或互联网上的任何其他位置，最可靠的方法是将其从网站中移除。

### 通过密码保护文件

        **适用对象：所有类型的内容**

        如果您的网站上有机密或非公开的内容，则需要使用密码对其加以保护，以确保只有授权用户才能访问这些内容。这种方式还能阻止相应内容显示在 Google 搜索中。如果该内容已经显示在我们的搜索结果中，密码保护措施最终也会将其从搜索结果中移除。

    [noindex 规则](https://developers.google.com/search/docs/crawling-indexing/block-indexing?hl=zh-cn)

        **适用对象：所有类型的内容**

        noindex robots meta 标记是一项规则，它能告知 Google 不要将您的内容编入索引，也不要让其显示在 Google 搜索结果中。用户仍然可以通过其他网页链接到并访问您的内容，或直接输入链接来访问您的内容，但您的内容不会显示在 Google 搜索结果中。

### 
        使用 [robots.txt](https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page?hl=zh-cn#for-non-emergency-image-removal) 禁止抓取内容

        **适用对象：图片和视频**

        Google 只会将 Googlebot 可抓取的图片和视频编入索引。如要阻止 Googlebot 访问您的媒体文件，请使用 [robots.txt 规则屏蔽相应文件](https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page?hl=zh-cn#for-non-emergency-image-removal)。

      [停用特定的 Google 产品和服务](https://support.google.com/webmasters/answer/3035947?hl=zh-cn)

        **适用对象：网页**

        您可以告知 Google 不要将您网站上的内容包含在特定的 Google 产品和服务中，例如 [Google 购物](https://www.google.com/shopping?hl=zh-cn)、[Google 酒店](https://www.google.com/travel/hotels?hl=zh-cn)和民宿。

## 从 Google 中移除现有内容

  如果您网站上托管的内容已经显示在 Google 中，您可以要求移除相应搜索结果。不妨了解一下如何[从 Google 中移除托管在您网站上的网页](https://developers.google.com/search/docs/crawling-indexing/remove-information?hl=zh-cn)。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。