# 商家退货政策结构化数据 (MerchantReturnPolicy) | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/return-policy?hl=zh-cn

---

# 商家退货政策 (MerchantReturnPolicy) 结构化数据

  许多商家都有退货政策，其中概述了客户退回所购商品的流程。
  当您向网站添加 MerchantReturnPolicy 结构化数据后，Google 搜索可以使用此信息在搜索结果中的商品旁边以及知识面板中显示退货政策。借助 MerchantReturnPolicy，您可以指定指向退货政策页面的链接，或提供详细信息，例如客户可以退货的条件、退货方式、退货费用、退款选项等。

  您可以使用 MerchantReturnPolicy 结构化数据类型（使用 hasMerchantReturnPolicy 属性嵌套在 Organization 结构化数据类型下）指定适用于您销售的大部分或所有商品的标准退货政策。

  如果您需要针对特定商品替换标准退货政策，请在 Offer 类型下指定一个或多个 MerchantReturnPolicy 实例。如需详细了解各个商品的退货政策，请参阅[商家信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#merchant-return-policy-properties)文档。
  与此处描述的属性相比，Offer 下指定的各个商品的退货政策支持的属性更少。

## 
    如何添加结构化数据

    结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

    下面概述了如何构建、测试和发布结构化数据。如需获得向网页添加结构化数据的分步指南，请查看[结构化数据 Codelab](https://codelabs.developers.google.com/codelabs/structured-data/index.html?hl=zh-cn)。

1. 添加[必要属性](#structured-data-type-definitions)。根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
      **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
2. 遵循[指南](#guidelines)。
3. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码，并修复所有严重错误。此外，您还可以考虑修正该工具中可能会标记的任何非严重问题，因为这些这样有助于提升结构化数据的质量（不过，要使内容能够显示为富媒体搜索结果，并非必须这么做）。
4. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
    **注意**：Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
5. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/v1/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 示例

以下示例展示了完整的 OnlineStore 标记，其中包含一项退货政策，该政策适用于向德国、奥地利和瑞士客户销售的商品，并且需要通过邮寄方式退回爱尔兰。
  退货期为 60 天，且免费退货，并提供全额退款。只有新品才能退货。

```
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
      "applicableCountry": [ "DE", "AT", "CH"],
      "returnPolicyCountry": "IE",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 60,
      "itemCondition": "https://schema.org/NewCondition",
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn",
      "refundType": "https://schema.org/FullRefund",
      "returnLabelSource": "https://schema.org/ReturnLabelCustomerResponsibility"
    }

  }
```

下面是一个完整的 MerchantReturnPolicy 结构化数据标记示例，其中包含针对客户因商品存在问题或不满意而退货的选项，以及限制退货期限为 30 天的季节性替换政策。

<html>
  <head>
    <title>Our return policy</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": [ "DE", "AT", "CH"],
          "returnPolicyCountry": "IE",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 60,
          "itemCondition": [ "https://schema.org/NewCondition", "https://schema.org/DamagedCondition" ],
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/ReturnShippingFees",
          "refundType": "https://schema.org/FullRefund",
          "returnShippingFeesAmount": {
            "@type": "MonetaryAmount",
            "value": 2.99,
            "currency": "EUR"
          },
          "returnLabelSource": "https://schema.org/ReturnLabelInBox",
          "customerRemorseReturnFees": "https://schema.org/ReturnShippingFees",
          "customerRemorseReturnShippingFeesAmount": {
            "@type": "MonetaryAmount",
            "value": 5.99,
            "currency": "EUR"
          },
          "customerRemorseReturnLabelSource": "https://schema.org/ReturnLabelDownloadAndPrint",
          "itemDefectReturnFees": "https://schema.org/FreeReturn",
          "itemDefectReturnLabelSource": "https://schema.org/ReturnLabelInBox",
          "returnPolicySeasonalOverride": {
            "@type": "MerchantReturnPolicySeasonalOverride",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "startDate": "2025-12-01",
            "endDate": "2025-01-05",
            "merchantReturnDays": 30
          }
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
    <title>Our return policy</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        "hasMerchantReturnPolicy": {
          "@type": "MerchantReturnPolicy",
          "applicableCountry": [ "DE", "AT", "CH"],
          "returnPolicyCountry": "IE",
          "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
          "merchantReturnDays": 60,
          "itemCondition": [ "https://schema.org/NewCondition", "https://schema.org/DamagedCondition" ],
          "returnMethod": "https://schema.org/ReturnByMail",
          "returnFees": "https://schema.org/ReturnShippingFees",
          "refundType": "https://schema.org/FullRefund",
          "returnShippingFeesAmount": {
            "@type": "MonetaryAmount",
            "value": 2.99,
            "currency": "EUR"
          },
          "returnLabelSource": "https://schema.org/ReturnLabelInBox",
          "customerRemorseReturnFees": "https://schema.org/ReturnShippingFees",
          "customerRemorseReturnShippingFeesAmount": {
            "@type": "MonetaryAmount",
            "value": 5.99,
            "currency": "EUR"
          },
          "customerRemorseReturnLabelSource": "https://schema.org/ReturnLabelDownloadAndPrint",
          "itemDefectReturnFees": "https://schema.org/FreeReturn",
          "itemDefectReturnLabelSource": "https://schema.org/ReturnLabelInBox",
          "returnPolicySeasonalOverride": {
            "@type": "MerchantReturnPolicySeasonalOverride",
            "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
            "startDate": "2025-12-01",
            "endDate": "2025-01-05",
            "merchantReturnDays": 30
          }
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

为了让您的退货政策标记能够在 Google 搜索中使用，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)

### 技术指南

- 我们建议您将退货信息放在您网站上描述商家退货政策的单个页面中。您无需在网站的每个网页中添加此标记。
将 MerchantReturnPolicy 结构化数据类型添加到 Organization 结构化数据类型下。
  如需了解详情，另请参阅[组织标记](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn)。
- 如果您对特定商品有非标准退货政策，请在 Offer 结构化数据类型下指定 MerchantReturnPolicy 结构化数据类型。请注意，offer 级退货政策支持的属性是组织级退货政策支持的属性的子集。如需查看商品级退货政策支持的属性子集，请参阅[商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)。

## 结构化数据类型定义

您必须为结构化数据添加必需的属性，才能在 Google 搜索中使用这些数据。您还可添加建议的属性，以便添加与您的退货政策相关的更多信息，进而提供更好的用户体验。

### MerchantReturnPolicy（使用 hasMerchantReturnPolicy 属性嵌套在 Organization 下）

请使用以下属性描述商家标准退货政策。

      必需属性（请选择最适合您的使用场景的选项）

        选项 A

          applicableCountry

            [Text](https://schema.org/Text)

退货政策适用的国家/地区代码（商品的销售地和退货地）。
              请使用由 2 个字母表示的 [ISO 3166-1 alpha-2 国家/地区代码](https://en.wikipedia.org/wiki/ISO_3166-1)。
        您最多可以指定 50 个国家/地区。

          returnPolicyCategory

[MerchantReturnEnumeration](https://schema.org/MerchantReturnEnumeration)

退货政策的类型。请使用以下某个值：

- https://schema.org/MerchantReturnFiniteReturnWindow：退货期限有规定的天数。
- https://schema.org/MerchantReturnNotPermitted：不允许退货。
- https://schema.org/MerchantReturnUnlimitedWindow：商品退货期限不限。

              如果您使用 MerchantReturnFiniteReturnWindow，则必须提供 [merchantReturnDays](#merchant-return-days) 属性。

        选项 B

          merchantReturnLink

[URL](https://schema.org/URL)

              指定向客户说明退货政策的网页的网址。可以是您自己的退货政策，或来自负责处理退货的服务的第三方政策。

#### 有限或无限的退货期限

将 [returnPolicyCategory](#return-policy-category) 设置为 MerchantReturnFiniteReturnWindow 或 MerchantReturnUnlimitedWindow 时，建议使用以下属性。

    建议属性

        merchantReturnDays

            [Integer](https://schema.org/Integer)

从商品送达日期起计算的退货期限天数。仅当 [returnPolicyCategory](#return-policy-category) 等于 MerchantReturnFiniteReturnWindow 时，才必须提供此属性。

        returnFees

[ReturnFeesEnumeration](https://schema.org/ReturnFeesEnumeration)

退货费用的默认类型。请使用以下某个受支持的值：

- https://schema.org/FreeReturn：消费者可免费退货。如果使用此参数，请勿添加 [returnShippingFeesAmount](#return-shipping-fees-amount) 属性。
- https://schema.org/ReturnFeesCustomerResponsibility：消费者需要自行处理并支付退货运费。如果使用此参数，请勿添加 [returnShippingFeesAmount](#return-shipping-fees-amount) 属性。
- https://schema.org/ReturnShippingFees：商家会向消费者收取退回商品的运费。请使用 [returnShippingFeesAmount](#return-shipping-fees-amount) 属性指定（非零）运费。

        returnMethod

[ReturnMethodEnumeration](https://schema.org/ReturnMethodEnumeration)

提供的退货方式类型。请使用以下一个或多个值：

- https://schema.org/ReturnAtKiosk：商品可以在自助服务终端退货。
- https://schema.org/ReturnByMail：商品可以通过邮寄方式退货。
- https://schema.org/ReturnInStore：商品可在实体店内退货。

        returnShippingFeesAmount

[MonetaryAmount](https://schema.org/MonetaryAmount)

退货商品的运费。仅当 [returnFees](#return-fees) 等于 https://schema.org/ReturnShippingFees 时，才必须指定此属性。

#### 有限或无限的退货期限

如果 [returnPolicyCategory](#return-policy-category) 设置为 MerchantReturnFiniteReturnWindow 或 MerchantReturnUnlimitedWindow，建议还要使用以下属性。

    建议属性

        customerRemorseReturnFees

[ReturnFeesEnumeration](https://schema.org/ReturnFeesEnumeration)

因客户反悔而退货的特定类型的退货费用。
            如需了解可能的值，请参阅 [returnFees](#return-fees)。

        customerRemorseReturnLabelSource

[ReturnLabelSourceEnumeration](https://schema.org/ReturnLabelSourceEnumeration)

            消费者获取商品退货配送标签的方式。
            如需了解可能的值，请参阅 [returnLabelSource](#return-label-source)。

        customerRemorseReturnShippingFeesAmount

[MonetaryAmount](https://schema.org/MonetaryAmount)

            因客户反悔而退回商品的运费。仅当消费者退回商品需支付非零运费时，才需要提供此属性。
          如需了解详情，请参阅 [returnShippingFeesAmount](#return-shipping-fees-amount)。

        itemCondition

[OfferItemCondition](https://schema.org/OfferItemCondition)

            退回商品时可接受的条件。您可以提供多个可接受的条件。
            请使用以下值：

- https://schema.org/DamagedCondition：接受损坏的商品。
- https://schema.org/NewCondition：接受新商品。
- https://schema.org/RefurbishedCondition：接受翻新商品。
- https://schema.org/UsedCondition：接受二手商品。

        itemDefectReturnFees

[ReturnFeesEnumeration](https://schema.org/ReturnFeesEnumeration)

针对有缺陷商品的特定类型的退货费用。如需了解可能的值，请参阅 [returnFees](#return-fees)。

        itemDefectReturnLabelSource

[ReturnLabelSourceEnumeration](https://schema.org/ReturnLabelSourceEnumeration)

            消费者获取商品退货配送标签的方式。
            如需了解可能的值，请参阅 [returnLabelSource](#return-label-source)。

        itemDefectReturnShippingFeesAmount

[MonetaryAmount](https://schema.org/MonetaryAmount)

            因商品有缺陷而退货的运费。仅当消费者退回商品需支付非零运费时，才需要提供此属性。
          如需了解详情，请参阅 [returnShippingFeesAmount](#return-shipping-fees-amount)。

        refundType

[RefundType](https://schema.org/RefundTypeEnumeration)

消费者在退货时可以采用的退款类型。

- https://schema.org/ExchangeRefund：商品可以换成同款商品。
- https://schema.org/FullRefund：商品可以全额退款。
- https://schema.org/StoreCreditRefund：商品可以以商店抵用金的形式退款。

        restockingFee

[MonetaryAmount](https://schema.org/MonetaryAmount) 或 [Number](https://schema.org/Number)

消费者在退货时需支付的重新上架费。指定 Number 类型的值，以收取消费者支付价格的百分比值，或使用 MonetaryAmount 收取固定金额。

        returnLabelSource

[ReturnLabelSourceEnumeration](https://schema.org/ReturnLabelSourceEnumeration)

            消费者获取商品退货配送标签的方式。请使用以下某个值：

- https://schema.org/ReturnLabelCustomerResponsibility：消费者有责任创建退货单。
- https://schema.org/ReturnLabelDownloadAndPrint：
            客户必须下载并打印退货单。
- https://schema.org/ReturnLabelInBox：
            商品最初发货时随附了退货单。

        returnPolicyCountry

[Text](https://schema.org/Text)

            必须将商品送到哪个国家/地区才能进行退货。此国家/地区可以不同于商品最初发货或发往的国家/地区。
            [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1) 国家/地区代码格式。您最多可以指定 50 个国家/地区。

#### 季节性替换政策属性

如果您需要为组织级退货政策定义季节性替换政策，则需要使用以下属性。

    必要属性

        returnPolicySeasonalOverride

[MerchantReturnPolicySeasonalOverride](https://schema.org/MerchantReturnPolicySeasonalOverride)

退货政策的季节性替换政策，用于为特殊活动（例如节假日）指定退货政策。
            例如，您的常规退货政策类别设置为 MerchantReturnPolicyUnlimitedWindow，但在节日促销期间，退货期限应有所限制：

```
  "returnPolicySeasonalOverride": {
    "@type": "MerchantReturnPolicySeasonalOverride",
    "startDate": "2024-11-29",
    "endDate": "2024-12-06",
    "merchantReturnDays": 10,
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow"
  }
```

    下面介绍了如何指定多个季节性替换政策。在此示例中，退货政策通常是无期限退货，但在以下两个日期范围内，退货有期限：

```
  "returnPolicySeasonalOverride": [{
    "@type": "MerchantReturnPolicySeasonalOverride",
    "startDate": "2024-11-29",
    "endDate": "2024-12-06",
    "merchantReturnDays": 10,
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow"
  },
  {
    "@type": "MerchantReturnPolicySeasonalOverride",
    "startDate": "2024-12-26",
    "endDate": "2025-01-06",
    "merchantReturnDays": 10,
    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow"
  }]

```

        returnPolicySeasonalOverride.returnPolicyCategory

[MerchantReturnEnumeration](https://schema.org/MerchantReturnEnumeration)

退货政策的类型。请使用以下某个值：

- https://schema.org/MerchantReturnFiniteReturnWindow：退货期限有规定的天数。
- https://schema.org/MerchantReturnNotPermitted：不允许退货。
- https://schema.org/MerchantReturnUnlimitedWindow：商品退货期限不限。

              如果您使用 MerchantReturnFiniteReturnWindow，则必须提供 merchantReturnDays 属性。

如果您需要为组织级退货政策定义季节性替换政策，建议使用以下属性。

    建议属性

        returnPolicySeasonalOverride.endDate

            [Date](https://schema.org/Date) 或 [DateTime](https://schema.org/DateTime)

季节性替换政策的结束日期。

        returnPolicySeasonalOverride.merchantReturnDays

          [Integer](https://schema.org/Integer) 或
          [Date](https://schema.org/Date) 或
          [DateTime](https://schema.org/DateTime)

从商品送达日期起计算的退货期限天数。仅当您将 returnPolicyCategory 设为 MerchantReturnFiniteReturnWindow 时，才必须提供此属性。

        returnPolicySeasonalOverride.startDate

[Date](https://schema.org/Date) 或 [DateTime](https://schema.org/DateTime)

季节性替换政策的开始日期。

## 
    通过 Google 配置退货设置的其他方法

    零售商的退货政策可能很复杂，并且可能会经常变化。如果您在使用标记指明和及时更新退货详情时遇到问题，并且您拥有 Google Merchant Center 账号，不妨在 Google Merchant Center 中配置[退货政策](https://support.google.com/merchants/answer/10220642?hl=zh-cn)。或者，您也可以[在 Search Console 中配置账号级退货政策](https://support.google.com/webmasters/answer/14907594?hl=zh-cn)，这些政策会自动添加到 Merchant Center 中。

### 组合使用多个退货配置

    如果您要组合使用各种退货配置，可以根据优先级顺序替换政策信息。例如，如果您在网站上提供[退货政策标记](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn#merchant-return-policy-properties)，并且在 Search Console 中提供退货政策设置，Google 将仅使用在 Search Console 中提供的信息。

    Google 使用以下优先级顺序（从最强到最弱）：

- Content API for Shopping（[退货设置](https://developers.google.com/shopping-content/guides/free-listings-return-settings?hl=zh-cn)）
- [Merchant Center](https://support.google.com/merchants/answer/14011730?hl=zh-cn) 或 [Search Console](https://support.google.com/webmasters/answer/14907594?hl=zh-cn) 中的设置
- [商品级商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)
- [组织级标记](#merchant-return-policy-properties)

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