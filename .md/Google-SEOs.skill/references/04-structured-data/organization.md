# 组织架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn

---

  # 组织 (Organization) 结构化数据

    Google 搜索结果中的商家知识面板

  向首页添加组织结构化数据有助于 Google 更好地了解贵组织的管理详细信息，并在搜索结果中清晰地识别和区分贵组织。系统会在后台通过某些属性将贵组织与其他组织区分开来（例如 iso6523 和 naics），而其他属性则会影响搜索结果中的视觉元素（例如，在搜索结果和[知识面板](https://support.google.com/knowledgepanel/answer/9163198?hl=zh-cn)中显示哪个 logo）。
  如果您是商家，则可以影响[商家知识面板](https://blog.google/products/shopping/google-merchant-new-features-holiday/?hl=zh-cn)和[品牌资料](https://support.google.com/merchants/answer/14998338?hl=zh-cn)中的更多详细信息，例如退货政策、地址和联系信息。没有必需添加的属性，但我们建议您添加尽可能多的与贵组织相关的属性。

## 
    如何添加结构化数据

    结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

    下面概述了如何构建、测试和发布结构化数据。

1. 添加尽可能多的适用于您网页的[建议属性](#structured-data-type-definitions)。没有必需添加的属性，根据您的内容按需添加即可。 根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
      **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
2. 遵循[指南](#guidelines)。
3. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码，并修复所有严重错误。此外，您还可以考虑修正该工具中可能会标记的任何非严重问题，因为这些这样有助于提升结构化数据的质量（不过，要使内容能够显示为富媒体搜索结果，并非必须这么做）。
4. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
    **注意**：Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
5. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/v1/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 示例

### Organization

下面是一个 JSON-LD 代码格式的组织信息示例。

<html>
  <head>
    <title>About Us</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "url": "https://www.example.com",
      "sameAs": ["https://example.net/profile/example1234", "https://example.org/example1234"],
      "logo": "https://www.example.com/images/logo.png",
      "name": "Example Corporation",
      "description": "The example corporation is well-known for producing high-quality widgets",
      "email": "contact@example.com",
      "telephone": "+47-99-999-9999",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rue Improbable 99",
        "addressLocality": "Paris",
        "addressCountry": "FR",
        "addressRegion": "Ile-de-France",
        "postalCode": "75001"
      },
      "vatID": "FR12345678901",
      "iso6523Code": "0199:724500PMK2A2M1SQQ228"
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>About Us</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "url": "https://www.example.com",
      "sameAs": ["https://example.net/profile/example1234", "https://example.org/example1234"],
      "logo": "https://www.example.com/images/logo.png",
      "name": "Example Corporation",
      "description": "The example corporation is well-known for producing high-quality widgets",
      "email": "contact@example.com",
      "telephone": "+47-99-999-9999",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Rue Improbable 99",
        "addressLocality": "Paris",
        "addressCountry": "FR",
        "addressRegion": "Ile-de-France",
        "postalCode": "75001"
      },
      "vatID": "FR12345678901",
      "iso6523Code": "0199:724500PMK2A2M1SQQ228"
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 具有配送政策和退货政策的 OnlineStore（Organization 的子类型）

下面是一个具有 JSON-LD 代码格式的配送政策和退货政策的网店示例。

如需查看更多示例并详细了解商家级标准退货政策，请参阅单独的[商家退货政策标记](https://developers.google.com/search/docs/appearance/structured-data/return-policy?hl=zh-cn)文档。

<html>
  <head>
    <title>About Us</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "name": "Example Online Store",
      "url": "https://www.example.com",
      "sameAs": ["https://example.net/profile/example12", "https://example.org/@example34"],
      "logo": "https://www.example.com/assets/images/logo.png",
      "contactPoint": {
        "contactType": "Customer Service",
        "email": "support@example.com",
        "telephone": "+47-99-999-9900"
      },
      "vatID": "FR12345678901",
      "iso6523Code": "0199:724500PMK2A2M1SQQ228",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": ["FR", "CH"],
        "returnPolicyCountry": "FR",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn",
        "refundType": "https://schema.org/FullRefund"
      }
      // Other Organization-level properties
      // ...
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>About Us</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "name": "Example Online Store",
      "url": "https://www.example.com",
      "sameAs": ["https://example.net/profile/example12", "https://example.org/@example34"],
      "logo": "https://www.example.com/assets/images/logo.png",
      "contactPoint": {
        "contactType": "Customer Service",
        "email": "support@example.com",
        "telephone": "+47-99-999-9900"
      },
      "vatID": "FR12345678901",
      "iso6523Code": "0199:724500PMK2A2M1SQQ228",
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": ["FR", "CH"],
        "returnPolicyCountry": "FR",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn",
        "refundType": "https://schema.org/FullRefund"
      }
      // Other Organization-level properties
      // ...
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 指南

要使您的结构化数据能够显示在 Google 搜索结果中，您必须遵循以下指南。

警告：**如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [技术指南](#technical-guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 
  技术指南

  我们建议您将此信息放在首页或描述贵组织的单个页面中，例如“关于我们”页面。**您无需在网站的每个网页中添加此标记。

  我们建议您使用与贵组织相符的最具体 schema.org 子类型 [Organization](https://schema.org/Organization)。例如，如果您拥有电子商务网站，我们建议您使用 [OnlineStore](https://schema.org/OnlineStore) 子类型，而不是 [OnlineBusiness](https://schema.org/OnlineBusiness)。如果您的网站是关于本地商家（例如餐厅或实体店），建议您使用最具体的 [LocalBusiness](https://schema.org/LocalBusiness) [子类型](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn#local-business-properties)提供组织管理详情；除了本指南中建议的字段外，也请遵守面向[本地商家](https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=zh-cn)的必需和建议字段规定。

## 不同结构化数据类型的定义

Google 可识别 [Organization](https://schema.org/Organization) 的以下属性。为了帮助 Google 更好地了解您的网页，请添加尽可能多的适用于该网页的建议属性。没有必需添加的属性，按需添加适用于贵组织的属性即可。

  我们建议您着重于对用户有用的属性，例如提供 name 或 alternateName 指明商家名称，并指明商家实际/在线形象的相关信息（前者示例有 address 或 telephone；后者示例有 url 或 logo）。

    建议属性

      address

[PostalAddress](https://schema.org/PostalAddress)

        如果您使用的是 LocalBusiness 类型或其任一子类型，则该属性为必需属性。

贵组织的实际地址或邮寄地址（如果适用）。请添加适用于您所在国家/地区的所有属性。提供的属性越多，搜索结果对用户来说就质量越高。如果贵组织在多个城市、省级行政区或国家/地区都有分支地点，可以提供多个地址。
        例如：

```
"address": [{
  "@type": "PostalAddress",
  "streetAddress": "999 W Example St Suite 99 Unit 9",
  "addressLocality": "New York",
  "addressRegion": "NY",
  "postalCode": "10019",
  "addressCountry": "US"
},{
  "streetAddress": "999 Rue due exemple",
  "addressLocality": "Paris",
  "postalCode": "75001",
  "addressCountry": "FR"
}]
```

      address.addressCountry

[Text](https://schema.org/Text)

贵组织邮政地址所属的国家/地区，使用两个字母组成的 [ISO 3166-1 alpha-2 国家/地区代码](https://wikipedia.org/wiki/ISO_3166-1)。

      address.addressLocality

[Text](https://schema.org/Text)

贵组织邮政地址所属的城市。

      address.addressRegion

[Text](https://schema.org/Text)

贵组织邮政地址所属的区域（如果适用）。例如，省级行政区。

      address.postalCode

[Text](https://schema.org/Text)

贵组织所在地址的邮政编码。

      address.streetAddress

[Text](https://schema.org/Text)

贵组织邮政地址的完整街道地址。

      alternateName

[Text](https://schema.org/Text)

贵组织使用的另一个常用名称（如果适用）。

      contactPoint

[ContactPoint](https://schema.org/ContactPoint)

用户联系贵商家的最佳方式（如果适用）。按照 Google 推荐的[最佳实践](https://developers.google.com/search/blog/2021/07/customer-support?hl=zh-cn)添加用户可用的所有支持方法。例如：

```
"contactPoint": {
  "@type": "ContactPoint",
  "telephone": "+9-999-999-9999",
  "email": "contact@example.com"
}
```

      contactPoint.email

[Text](https://schema.org/Text)

用于联系贵商家的电子邮件地址（如果适用）。
        如果您使用的是 LocalBusiness 类型，请先在 LocalBusiness 级别指定主电子邮件地址，然后再使用 contactPoint 指定多种与贵组织联系的方式。

      contactPoint.telephone

[Text](https://schema.org/Text)

用于联系贵商家的电话号码（如果适用）。
        请务必在电话号码中包含国家/地区代码和区号。
        如果您使用的是 LocalBusiness 类型，请先在 LocalBusiness 级别指定主要电话号码，然后再使用 contactPoint 指定多种与贵组织联系的方式。

      description

[Text](https://schema.org/Text)

对贵组织的详细说明（如果适用）。

      duns

[Text](https://schema.org/Text)

用于标识您的 Organization 的邓白氏编码（如果适用）。我们建议改用前缀为 0060: 的 iso6523Code 字段。

        email

[Text](https://schema.org/Text)

用于联系贵商家的电子邮件地址（如果适用）。

      foundingDate

[Date](https://schema.org/Date)

贵 Organization 的创立日期，采用 [ISO 8601 日期格式](https://en.wikipedia.org/wiki/ISO_8601)（如果适用）。

      globalLocationNumber

[Text](https://schema.org/Text)

用于标识您的 Organization 位置的 GS1 全球位置编码（如果适用）。

        hasMerchantReturnPolicy

重复 [MerchantReturnPolicy](https://schema.org/MerchantReturnPolicy)

          您的 Organization 的退货政策（如果适用）。如需详细了解 MerchantReturnPolicy 的必需属性和可选属性，请参阅[商家退货政策标记](https://developers.google.com/search/docs/appearance/structured-data/return-policy?hl=zh-cn#merchant-return-policy-properties)。

            如果您未为 Organization 提供退货政策，或者您的部分商品有特定的退货政策，而您需要替换为为 Organization 定义的退货政策，请在[商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#merchant-return-policy-properties)下也使用此属性。

        hasMemberProgram

重复 [MemberProgram](https://schema.org/MemberProgram)

          您提供的会员（回馈）计划（如果适用）。
         如需详细了解 MemberProgram 的必需属性和可选属性，请参阅[会员计划标记](https://developers.google.com/search/docs/appearance/structured-data/loyalty-program?hl=zh-cn#member-program-properties)。

        hasShippingService

重复 [ShippingService](https://schema.org/ShippingService)

          您的 Organization 的配送政策（如果适用）。如需详细了解 ShippingService 的必需属性和可选属性，请参阅[商家配送政策标记](https://developers.google.com/search/docs/appearance/structured-data/shipping-policy?hl=zh-cn#merchant-shipping-policy-properties)。

            如果您未为自己的 Organization 提供配送政策，或者您的部分商品有特定的配送政策，而您需要替换为您的 Organization 定义的配送政策，请在[商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#merchant-shipping-policy-properties)下也使用此属性。

        iso6523Code

[Text](https://schema.org/Text)

贵组织的 ISO 6523 标识符（如果适用）。
          ISO 6523 标识符的第一部分是 [ICD（国际代码标识符）](http://iso6523.info/icd_list.pdf)，用于定义使用哪种标识方案。第二部分是实际标识符。我们建议使用英文冒号字符 (U+003A) 分隔 ICD 和标识符。常见的 ICD 值包括：

- 0060：邓白氏数据通用编码系统 (DUNS)
- 0088：GS1 全球位置编号 (GLN)
- 0199：法律实体标识符 (LEI)

      legalName

[Text](https://schema.org/Text)

Organization 的法定注册名称（如果适用），并且与 name 属性不同。

      leiCode

[Text](https://schema.org/Text)

ISO 17442 中定义的 Organization 的标识符（如果适用）。
        我们建议改用前缀为 0199: 的 iso6523Code 字段。

      logo

[URL](https://schema.org/URL) 或 [ImageObject](https://schema.org/ImageObject)

可代表贵组织的徽标（如果适用）。添加此属性有助于 Google 更好地了解您要显示哪个徽标，例如在搜索结果和知识面板中显示此徽标。

图片准则：

- 图片必须至少为 112x112 像素。
- 图片网址必须可抓取且可编入索引。
- 图片必须采用[受 Google 图片支持](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#supported-image-formats)的文件格式。
- 确保图片在纯白背景下具有预期的显示效果（例如，如果徽标基本为白色或灰色，那么在白色背景中显示徽标时，效果可能不符合预期）。

如果您使用 [ImageObject](https://schema.org/ImageObject) 类型，请确保它具有有效的 [contentUrl](https://schema.org/contentUrl) 属性或 [url](https://schema.org/url) 属性，并且与 [URL](https://schema.org/URL) 类型遵循相同的指南。

      naics

[Text](https://schema.org/Text)

您 Organization 的[北美行业分类系统 (NAICS) 代码](https://www.census.gov/naics/)（如果适用）。

      name

[Text](https://schema.org/Text)

        您的组织的名称。请使用与[网站名称](https://developers.google.com/search/docs/appearance/site-names?hl=zh-cn)相同的 name 和 alternateName。

      numberOfEmployees

[QuantitativeValue](https://schema.org/QuantitativeValue)

贵 Organization 的员工人数（如果适用）。

包含特定员工人数的示例：

```
"numberOfEmployees": {
  "@type": "QuantitativeValue",
  "value": 2056
}
```

包含特定范围内员工人数的示例：

```
"numberOfEmployees": {
  "@type": "QuantitativeValue",
  "minValue": 100,
  "maxValue": 999
}
```

        sameAs

[URL](https://schema.org/URL)

另一网站中包含贵组织其他相关信息的网页的网址（如果适用）。例如，社交媒体或评价网站中的贵组织资料页面的网址。您可以提供多个 sameAs 网址。

      taxID

[Text](https://schema.org/Text)

与您的 Organization 相关联的税号（如果适用）。请确保 taxID 与您在 address 字段中提供的国家/地区一致。

      telephone

[Text](https://schema.org/Text)

商家电话号码应该是面向客户的主要联系方式（如果适用）。
        请务必在电话号码中包含国家/地区代码和区号。

      url

[URL](https://schema.org/URL)

贵组织的网站网址（如果适用）。这有助于 Google 唯一性识别您的组织。

      vatID

[Text](https://schema.org/Text)

与您的 Organization 关联的增值税 (VAT) 号（如果适用于您所在的国家/地区和贵商家）。这对用户而言是一个重要的信任信号，举例来说，用户可借此在公开的增值税登记数据库中查询贵商家。

## 问题排查

    如果您在实施或调试结构化数据时遇到问题，请查看下面列出的一些实用资源。

- 如果您使用了内容管理系统 (CMS) 或其他人负责管理您的网站，请向其寻求帮助。请务必向其转发列明问题细节的任何 Search Console 消息。
- Google 不能保证使用结构化数据的功能一定会显示在搜索结果中。如需查看导致 Google 无法将您的内容显示为富媒体搜索结果的各种常见原因，请参阅[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。
- 您的结构化数据可能存在错误。请参阅[结构化数据错误列表](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#error_list)。
- 如果您的网页受到结构化数据手动操作的影响，其中的结构化数据将会被忽略（但该网页仍可能会出现在 Google 搜索结果中）。如需修正[结构化数据问题](https://support.google.com/webmasters/answer/9044175?hl=zh-cn#zippy=,structured-data-issue)，请使用[“人工处置措施”报告](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)。
- 再次查看相关[指南](#guidelines)，确认您的内容是否未遵循指南。问题可能是因为出现垃圾内容或使用垃圾标记导致的。不过，问题可能不是语法问题，因此富媒体搜索结果测试无法识别这些问题。
- [针对富媒体搜索结果缺失/富媒体搜索结果总数下降进行问题排查](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#missing-jobs)。
- 请等待一段时间，以便 Google 重新抓取您的网页并重新将其编入索引。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。有关抓取和索引编制的常见问题，请参阅 [Google 搜索抓取和索引编制常见问题解答](https://developers.google.com/search/help/crawling-index-faq?hl=zh-cn)。
- 在 [Google 搜索中心论坛](https://support.google.com/webmasters/community?hl=zh-cn)中发帖提问。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。