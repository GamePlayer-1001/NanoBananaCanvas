# 会员回馈活动结构化数据 (MemberCard) | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/loyalty-program?hl=zh-cn

---

# 会员回馈活动 (MemberProgram) 结构化数据

  许多商家都有会员回馈活动，可为会员提供特殊福利，例如特殊价格和积分。向网站添加 MemberProgram 结构化数据后，Google 搜索可以使用这些信息在搜索结果中显示您的商品和知识面板的会员福利。

  您可以使用嵌套在 Organization 结构化数据类型下的 MemberProgram 结构化数据类型来指定为商家提供的会员回馈活动。
  如需为个别商品指定会员回馈福利（例如会员价格和获得的积分），请按照[商家信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#unit-price-specification-properties)中所述，在 Offer 结构化数据标记下单独添加 UnitPriceSpecification 标记。

## 功能可用性

  在澳大利亚、巴西、加拿大、法国、德国、墨西哥、英国和美国，无论是桌面设备还是移动设备，Google 搜索结果中均会显示会员回馈活动信息。

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

  下面是一个会员回馈活动 MemberProgram 结构化数据标记示例，其中有两个会员等级。

<html>
  <head>
    <title>About Us</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "OnlineStore",
      "hasMemberProgram": {
        "@type": "MemberProgram",
        "name": "Membership Plus",
        "description": "For frequent shoppers this is our top-rated loyalty program",
        "url": "https://www.example.com/membership-plus",
        "hasTiers": [
          {
            "@type": "MemberProgramTier",
            "@id": "#plus-tier-silver",
            "name": "silver",
            "url": "https://www.example.com/membership-plus-silver",
            "hasTierBenefit": [
              "https://schema.org/TierBenefitLoyaltyPoints"
            ],
            "membershipPointsEarned": 5
          },
          {
            "@type": "MemberProgramTier",
            "@id": "#plus-tier-gold",
            "name": "gold",
            "url": "https://www.example.com/membership-plus-gold",
            "hasTierRequirement":
            {
              "@type": "CreditCard",
              "name": "Example platinum card plus"
            },
            "hasTierBenefit": [
              "https://schema.org/TierBenefitLoyaltyPrice",
              "https://schema.org/TierBenefitLoyaltyPoints"
            ],
            "membershipPointsEarned": 10
          }
        ]
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
      "hasMemberProgram": {
        "@type": "MemberProgram",
        "name": "Membership Plus",
        "description": "For frequent shoppers this is our top-rated loyalty program",
        "url": "https://www.example.com/membership-plus",
        "hasTiers": [
          {
            "@type": "MemberProgramTier",
            "@id": "#plus-tier-silver",
            "name": "silver",
            "url": "https://www.example.com/membership-plus-silver",
            "hasTierBenefit": [
              "https://schema.org/TierBenefitLoyaltyPoints"
            ],
            "membershipPointsEarned": 5
          },
          {
            "@type": "MemberProgramTier",
            "@id": "#plus-tier-gold",
            "name": "gold",
            "url": "https://www.example.com/membership-plus-gold",
            "hasTierRequirement":
            {
              "@type": "CreditCard",
              "name": "Example platinum card plus"
            },
            "hasTierBenefit": [
              "https://schema.org/TierBenefitLoyaltyPrice",
              "https://schema.org/TierBenefitLoyaltyPoints"
            ],
            "membershipPointsEarned": 10
          }
        ]
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

为了让您的会员回馈活动标记能够在 Google 搜索中使用，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)

### 技术指南

- 将 MemberProgram 标记嵌套在网页上指定商家管理详细信息和政策的 Organization 类型下。
  如需了解详情，请参阅[组织标记](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn)文档。
- 如需为个别商品指定会员回馈福利（例如会员价格和获得的积分），请添加为[商家信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#unit-price-specification-properties)定义的 UnitPriceSpecification 标记。
  您为商家定义的 MemberProgram 标记与 validForMemberTier 和 MembershipPointsEarned 结构化数据配合使用，可为购买您商品的客户定义会员福利。

## 结构化数据类型定义

您必须为结构化数据添加必需的属性，才能在 Google 搜索中使用这些数据。您还可添加建议的属性，以便添加与您的会员回馈活动相关的更多信息，进而提供更好的用户体验。

### MemberProgram

使用以下属性可为您的商家描述一个或多个会员回馈活动，以及每个会员回馈活动的一个或多个等级。如需了解 MemberProgram 的完整定义，请访问 [schema.org/MemberProgram](https://schema.org/MemberProgram)。

        必要属性

            description

[Text](https://schema.org/Text)

会员回馈活动的说明，其中介绍了会员的主要福利。

            hasTiers

重复 [MemberProgramTier](https://schema.org/MemberProgramTier)

定义会员回馈活动中的等级。会员回馈活动必须至少包含一个会员等级。
                请参阅 Google 支持的 [MemberProgramTier 属性](#memberprogram-tier-properties)列表。

            name

[Text](https://schema.org/Text)

会员回馈活动的名称。

        建议属性

            url

[URL](https://schema.org/URL)

购物者可在上面注册该会员回馈活动的网页网址。
                请勿提供多个网址。如果未提供该网址，系统会假定包含 MemberProgram 结构化数据的网页的网址就是该网址。

#### MemberProgramTier

        MemberProgramTier 用于定义 MemberProgram 下的等级。
        一个会员回馈活动可以包含多个等级。例如，青铜、白银和黄金。

如需了解 MemberProgramTier 的完整定义，请访问 [schema.org/MemberProgramTier](https://schema.org/MemberProgramTier)。

        必要属性

            hasTierBenefit

重复 [TierBenefitEnumeration](https://schema.org/TierBenefitEnumeration)

此会员等级的会员可享受的福利。会员等级可以有多个福利。系统也支持不带网址前缀的简称（例如 TierBenefitLoyaltyPoints）。

- https://schema.org/TierBenefitLoyaltyPoints：福利是赚取积分。还要指定 membershipPointsEarned。
- https://schema.org/TierBenefitLoyaltyPrice：福利是会员专享的价格。

            name

[Text](https://schema.org/Text)

会员等级的名称。

        建议属性

          hasTierRequirement

[CreditCard](https://schema.org/CreditCard)、[MonetaryAmount](https://schema.org/MonetaryAmount)、[UnitPriceSpecification](https://schema.org/UnitPriceSpecification) 或 [Text](https://schema.org/Text)

加入会员等级的要求。如果未指定，则任何人都可以免费加入该等级。对于非免费等级，请指定表示加入该等级所需条件的类型值。

- https://schema.org/CreditCard：指定用户需要注册才能加入该等级的信用卡。
                例如：
```
  "hasTierRequirement": {
    "@type": "CreditCard",
    "name": "Capital Two cashback rewards platinum card"
  }
```
- https://schema.org/MonetaryAmount：指定加入该等级所需的最低支出金额。
                例如，如需设置支出下限为 250 美元的条件，请指定：

```
  "hasTierRequirement": {
    "@type": "MonetaryAmount",
    "value": 250,
    "currency": "USD"
  }
```
- https://schema.org/UnitPriceSpecification：指定消费者需要为该等级的会员资格支付的定期费用。
                例如，如果会员资格为 12 个月，每月结算一次，金额为 9.99 欧元，请指定：

```
  "hasTierRequirement": {
    "@type": "UnitPriceSpecification",
    "price": 9.99,
    "priceCurrency": "EUR",
    "billingDuration": 12,
    "billingIncrement": 1,
    "unitCode": "MON"
  }
```
- https://schema.org/Text：说明加入该等级的任何其他要求。例如：
```
"hasTierRequirement": "Purchase a share in our coop and volunteer a minimum of 1 day a month to keep operating costs low."
```

          membershipPointsEarned

[QuantitativeValue](https://schema.org/membershipPointsEarned)

当 hasTierBenefit 等于 https://schema.org/TierBenefitLoyaltyPoints 时，消费者每消费 1 个货币单位可获得的积分数。

          url

[URL](https://schema.org/URL)

购物者可在上面注册该会员等级的网页网址。
              请勿提供多个网址。

## 
    使用 Merchant Center 通过 Google 配置会员回馈活动

    会员回馈活动可能难以配置，并且很难通过标记保持最新状态。如果您有 Google Merchant Center 账号，则可以考虑直接在 Google Merchant Center 中配置会员回馈活动，而不是使用标记。如需了解详情，请参阅[商家帮助中心内关于会员回馈活动的文章](https://support.google.com/merchants/answer/12827255?hl=zh-cn)。

    如果您同时提供标记和 Merchant Center 会员回馈活动，Google 将使用 Merchant Center 设置。

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