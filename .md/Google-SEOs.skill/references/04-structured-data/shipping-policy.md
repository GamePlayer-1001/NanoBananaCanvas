# 商家配送政策结构化数据 (ShippingService) | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/shipping-policy?hl=zh-cn

---

# 商家配送政策 (ShippingService) 结构化数据

  许多商家都有配送政策，其中概述了为客户配送所购商品的流程。当您向自己的网站添加 ShippingService 结构化数据后，Google 搜索可以使用此信息在搜索结果中的商品旁边以及知识面板中显示配送信息。ShippingService 可让您根据商品特征（例如商品重量、尺寸或送货地点）指定运费和送货时长等详细信息。

  您可以使用 ShippingService 结构化数据类型（使用 hasShippingService 属性嵌套在 Organization 结构化数据类型下）为您的商家指定适用于您销售的大部分商品或所有商品的标准配送政策。

  如果您需要针对特定商品替换标准配送政策，请指定一个或多个 OfferShippingDetails 类型实例，这些实例使用 shippingDetails 属性嵌套在 Offer 类型下。如需详细了解各个商品的配送政策，请参阅[商家信息](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#merchant-shipping-policy-properties)文档。与此处针对 Organization 下指定的配送政策描述的属性相比，Offer 下指定的各个商品的配送政策支持的属性更少。

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

此示例显示：对于美国和加拿大，订单金额超过 29.99 美元可免运费，2 日到货；否则需支付 3.49 美元，3 日到货。对于墨西哥，金额低于 50 美元的订单不享受配送服务，如果金额达到 50 美元，则 4 日到货，运费为订单金额的 10%。

<html>
  <head>
    <title>Our shipping policy</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "https://schema.org/Organization",
        "hasShippingService": {
            "@type": "ShippingService",
            "@id": "#us_ca_mx_standard_shipping",
            "name": "Standard shipping policies for US, Canada and Mexico",
            "description": "US and Canada: Free 2-day shipping for orders over $29.99,
                            otherwise 3-day shipping for $3.49.
                            Mexico: No shipping to Mexico for orders under $50,
                            otherwise 10% shipping cost and 4-day shipping.",
            "fulfillmentType": "FulfillmentTypeDelivery",
            "handlingTime": {
              "@type": "ServicePeriod",
              "cutoffTime": "14:30:00-07:00",
              "duration": {
                "@type": "QuantitativeValue",
                "minValue": 0,
                "maxValue": 1,
                "unitCode": "DAY"
              },
              "businessDays": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ]
            },
            "shippingConditions": [
              {
                "@type": "ShippingConditions",
                "shippingDestination": [
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "US"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "CA"
                  }
                ],
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 0,
                  "maxValue": 29.99,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": 3.49,
                  "currency": "USD"
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 2,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": [
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "US"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "CA"
                  }
                ],
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 30,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": 0,
                  "currency": "USD"
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 1,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "MX"
                },
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 0,
                  "maxValue": 49.99,
                  "currency": "USD"
                },
                "doesNotShip": true
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "MX"
                },
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 50,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "ShippingRateSettings",
                  "orderPercentage": 0.10
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 2,
                    "maxValue": 3,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
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
    <title>Our shipping policy</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "https://schema.org/Organization",
        "hasShippingService": {
            "@type": "ShippingService",
            "@id": "#us_ca_mx_standard_shipping",
            "name": "Standard shipping policies for US, Canada and Mexico",
            "description": "US and Canada: Free 2-day shipping for orders over $29.99,
                            otherwise 3-day shipping for $3.49.
                            Mexico: No shipping to Mexico for orders under $50,
                            otherwise 10% shipping cost and 4-day shipping.",
            "fulfillmentType": "FulfillmentTypeDelivery",
            "handlingTime": {
              "@type": "ServicePeriod",
              "cutoffTime": "14:30:00-07:00",
              "duration": {
                "@type": "QuantitativeValue",
                "minValue": 0,
                "maxValue": 1,
                "unitCode": "DAY"
              },
              "businessDays": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday"
              ]
            },
            "shippingConditions": [
              {
                "@type": "ShippingConditions",
                "shippingDestination": [
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "US"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "CA"
                  }
                ],
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 0,
                  "maxValue": 29.99,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": 3.49,
                  "currency": "USD"
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 2,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": [
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "US"
                  },
                  {
                    "@type": "DefinedRegion",
                    "addressCountry": "CA"
                  }
                ],
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 30,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": 0,
                  "currency": "USD"
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 1,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "MX"
                },
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 0,
                  "maxValue": 49.99,
                  "currency": "USD"
                },
                "doesNotShip": true
              },
              {
                "@type": "ShippingConditions",
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "MX"
                },
                "orderValue": {
                  "@type": "MonetaryAmount",
                  "minValue": 50,
                  "currency": "USD"
                },
                "shippingRate": {
                  "@type": "ShippingRateSettings",
                  "orderPercentage": 0.10
                },
                "transitTime": {
                  "@type": "ServicePeriod",
                  "duration": {
                    "@type": "QuantitativeValue",
                    "minValue": 2,
                    "maxValue": 3,
                    "unitCode": "DAY"
                  },
                  "businessDays": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday"
                  ]
                }
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

为了让您的配送政策标记能够在 Google 搜索中使用，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)

### 技术指南

- 我们建议您将配送政策信息放在您网站上描述您商家的配送政策的单个页面中。您无需在网站的每个网页中添加此标记。
将 ShippingService 结构化数据类型添加到 Organization 结构化数据类型下。
  如需了解详情，请参阅[组织标记](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn)。
- 如果您有针对特定商品的非标准配送政策，请直接在 Offer 结构化数据类型下指定 OfferShippingDetails 结构化数据类型。请注意，offer 级配送政策支持的属性是组织级配送政策支持的属性的子集。如需查看商品级配送政策支持的属性的子集，请参阅[商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)。

## 结构化数据类型定义

您必须为结构化数据添加必需的属性，才能在 Google 搜索中使用这些数据。您还可添加建议的属性，以便添加与配送政策相关的更多信息，进而提供更好的用户体验。

### ShippingService（使用 hasShippingService 属性嵌套在 Organization 下）

请使用以下属性描述您商家的标准配送服务。

      必要属性

          shippingConditions

            [ShippingConditions](https://schema.org/ShippingConditions)

              指定适用于特定条件组（例如商品重量范围、商品尺寸、订单价值或送货地点）的运费和/或送货时长。一个 ShippingService 可以有多个 shippingConditions。如果某件商品适用多个 ShippingConditions，我们会根据具体情况计算出该商品的最低运费，并将该费用及相关的配送速度显示给客户。如果运费相同，我们将使用配送速度最快的配送信息。

    建议属性

        name

            [Text](https://schema.org/Text)

配送服务的唯一名称（如适用）。例如，“标准配送”。

        description

            [Text](https://schema.org/Text)

配送服务说明（如适用）。这通常比名称更全面。

        fulfillmentType

[FulfillmentTypeEnumeration](https://schema.org/FulfillmentTypeEnumeration)

相应配送服务将商品交付给客户的方式（如适用）。

- https://schema.org/FulfillmentTypeDelivery：此服务会将商品配送到客户的地址（如果未指定此属性，则为默认地址）。
- https://schema.org/FulfillmentTypeCollectionPoint：商品会配送到取件点，由客户自提。

        handlingTime

[ServicePeriod](https://schema.org/ServicePeriod)

收到订单后的处理时间（例如在仓库中的处理时间）方面的可选信息（如适用）。

             另请参阅 ShippingService 类型下 Google 支持的 [ServicePeriod](#shipping-service-handling-time-properties) 属性的列表。

          validForMemberTier

              [MemberProgramTier](https://schema.org/MemberProgramTier)

              相应配送服务适用的会员回馈活动和会员等级（如适用）。
              如果所有会员等级的配送设置都相同，您可以指定多个会员等级。

              如果您使用 validForMemberTier 属性指定会员配送福利，还必须至少提供一项常规（非会员）配送服务。

                您为自己的商家提供的会员回馈活动和会员等级可在 Merchant Center 账号中定义，也可使用嵌套在 Organization 结构化数据下的 MemberProgram 结构化数据类型在用于定义组织的管理详情和政策的单独网页上定义。如需了解如何为您的组织定义会员回馈活动和会员等级，请参阅[会员回馈活动标记](https://developers.google.com/search/docs/appearance/structured-data/loyalty-program?hl=zh-cn)。

下面是一个 validForMemberTier 属性示例，其中引用了在 Merchant Center 中定义的会员回馈活动 (member-plus**) 和会员等级 (silver**)：

```
"validForMemberTier": {
  "@type": "MemberProgramTier",
  "name": "silver",
  "isTierOf": {
    "@type": "MemberProgram",
    "name": "member-plus"
  }
}
```

下面是一个 validForMemberTier 属性示例，其中引用了嵌套在 MemberProgram 结构化数据下的 MemberProgramTier 结构化数据，而后者又嵌套在另一个网页上的 Organization 结构化数据类型下。MemberProgramTier 实例由 @id 属性标识，该属性用于指定其定义对应的唯一资源标识符 (URI)：
              https://www.example.com/com/member-plus#tier_silver：

```
"validForMemberTier": {
  "@id": "https://www.example.com/com/member-plus#tier_silver"
}
```

              此属性仍处于 Beta 版阶段。非网页上的 MemberProgramTier 结构化数据可能不会立即显示在 Google 搜索结果中。

#### ServicePeriod（用于指定订单处理时间）

            ServicePeriod 类型还用于指定运送时间。指定运送时间时，不使用 cutoffTime 属性。如需了解详情，请参阅[运送时间的 ServicePeriod](#shipping-service-transit-time-properties)。

        如需指定配送处理时间，请使用 ServicePeriod 类型。

下面是一个 ServicePeriod 类型示例，其中订单的处理时间为周一至周五，当天订单处理截止时间为美国东部标准时间晚上 10:30。订单处理时间介于 0 到 2 天之间（订单处理时间为 0 天表示，如果订单在当天订单处理截止时间之前收到，则会在当天处理）。

```
"handlingTime": {
  "@type": "ServicePeriod",
  "businessDays": [
    "https://schema.org/Monday",
    "https://schema.org/Tuesday",
    "https://schema.org/Wednesday",
    "https://schema.org/Thursday",
    "https://schema.org/Friday"
  ],
  "cutoffTime": "22:30:00-05:00",
  "duration": {
    "@type": "QuantitativeValue",
    "minValue": 0,
    "maxValue": 2,
    "unitCode": "DAY"
  }
}
```

        建议属性

            businessDays

[DayOfWeek](https://schema.org/DayOfWeek)

在每周内的哪些天处理收到的订单（如适用）。

            cutoffTime

[Time](https://schema.org/Time)

指在某一天收到的订单不再于当天处理的截止时间（如适用）。
                对于在当天订单处理截止时间之后处理的订单，估计的送货时长会增加一天。
                时间采用 ISO-8601 时间格式表示，例如“23:30:00-05:00”表示美国东部标准时间 (EST) 下午 6:30，比世界协调时间 (UTC) 晚 5 小时。

            duration

[QuantitativeValue](https://schema.org/QuantitativeValue)

从收到订单到商品出库所需的时间（如果适用）。

#### QuantitativeValue（用于指定配送处理时间）

        使用 QuantitativeValue 类型表示最短和最长订单处理时间。
        您必须同时提供 value（用于指定固定的订单处理时间）或 maxValue（用于指定订单处理时间上限）以及 unitCode。您可以选择性地提供 minValue，以指定订单处理时间下限。

        建议属性

            maxValue

[Number](https://schema.org/Number)

最长天数。其值必须是非负整数。

            minValue

[Number](https://schema.org/Number)

最短天数（如适用）。其值必须是非负整数。

            unitCode

[Text](https://schema.org/Text)

最小值/最大值的单位。值必须为 DAY 或 d。

            value

[Number](https://schema.org/Number)

确切的处理天数（如果已知）。其值必须是非负整数。
                如果提供了此属性，则不得指定 minValue 和 maxValue。

### ShippingConditions（使用 shippingConditions 属性嵌套在 ShippingService 下）

使用以下属性来描述配送服务的条件以及相关费用和运送时间。

如果未指定任何配送目的地，则配送条件适用于全球所有配送目的地。

    建议属性

        doesNotShip

[Boolean](https://schema.org/Boolean)

如果适用，若订单满足指定的 weight、numItems 和 orderValue 条件组合，但没有从指定的 shippingOrigin 中的某个地点到指定的 shippingDestination 中的某个地点的配送服务，请将此属性设置为 true。

        numItems

[QuantitativeValue](https://schema.org/QuantitativeValue)

相应配送条件对象适用的订单中商品数量范围（如适用）。
            另请参阅 Google 支持的与 ShippingConditions 类型相关的 [QuantitativeValue](#shipping-quantitative-value-properties) 属性的列表。

        orderValue

[MonetaryAmount](https://schema.org/MonetaryAmount)

相应配送条件对象适用的订单费用范围（如适用）。
            另请参阅 Google 支持的与 ShippingConditions 类型相关的 [MonetaryAmount](#shipping-conditions-monetary-amount-properties) 属性的列表。

        shippingDestination

            [DefinedRegion](https://schema.org/DefinedRegion)

指明配送目的地（如适用）。请参阅 shippingDestination 属性下 Google 支持的 [DefinedRegion](#defined-region-properties) 属性的列表。

        shippingOrigin

            [DefinedRegion](https://schema.org/DefinedRegion)

指明配送起点（如适用）。请参阅 shippingOrigin 属性下 Google 支持的 [DefinedRegion](#defined-region-properties) 属性的列表。

          seasonalOverride

[OpeningHoursSpecification](https://schema.org/OpeningHoursSpecification)

如果适用，请使用此属性指定相应配送条件对象适用的有限期限。
                另请参阅 Google 支持的 ShippingConditions 类型的 [OpeningHoursSpecification](#shipping-seasonal-override-properties) 属性的列表。

          shippingRate

[ShippingRateSettings](https://schema.org/ShippingRateSettings) 或 [MonetaryAmount](https://schema.org/MonetaryAmount)

如果适用，请使用此属性指定从指定的 shippingOrigin 中的某个地点到指定的 shippingDestination 中的某个地点的运费，前提是订单满足指定的 weight、numItems 和 orderValue 条件组合。
                 另请参阅 Google 支持的 ShippingConditions 类型的 [ShippingRateSettings](#shipping-rate-settings-properties) 属性和 [MonetaryAmount](#shipping-monetary-amount-properties) 属性的列表。仅当 doesNotShip 缺失或设置为 false 时，才应指定此属性。

          transitTime

[ServicePeriod](https://schema.org/ServicePeriod)

如果适用，请使用此属性指定从配送起点（通常是仓库）到配送目的地（通常是客户所在地点）之间的预计运送时间。适用于从指定的 shippingOrigin 中的某个地点到指定的 shippingDestination 中的某个地点的配送，前提是订单满足指定的 weight、numItems 和 orderValue 条件组合。
                 另请参阅 Google 支持的 [ServicePeriod 属性](#shipping-service-transit-time-properties)列表。仅当 doesNotShip 属性缺失或设置为 false 时，才应指定此属性。

          weight

[QuantitativeValue](https://schema.org/QuantitativeValue)

相应配送条件对象适用的包裹重量范围（如适用）。
              另请参阅 Google 支持的与 ShippingConditions 类型相关的 [QuantitativeValue](#shipping-quantitative-value-properties) 属性的列表。

#### DefinedRegion

        您可以使用 DefinedRegion 类型创建自定义区域，以便针对多项配送服务设置准确的运费和运送时间。

        必要属性

            addressCountry

[Text](https://schema.org/Text)

两个字母的国家/地区代码，采用 [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1) 格式。

        建议属性

            addressRegion

[Text](https://schema.org/Text)

特定国家/地区的地区代码（如适用）。地区必须是 2 或 3 个字符的 ISO 3166-2 细分代码（不含国家/地区前缀）。Google 搜索仅支持美国、澳大利亚和日本的此类代码。示例：NY（指代美国纽约州）、NSW（指代澳大利亚新南威尔士州）或 03（指代日本岩手县）。

请勿同时提供区域和邮政编码信息。

            postalCode

[Text](https://schema.org/Text)

特定国家/地区的邮政编码（如适用）。例如：94043。Google 搜索支持澳大利亚、加拿大和美国的邮政编码。

#### ServicePeriod（用于指定运送时间）

        使用 ServicePeriod 类型表示订单的运送时间范围。

            您还可以使用 ServicePeriod 类型指定订单处理时间。如需详细了解处理时间，请参阅 [ServicePeriod](#shipping-service-handling-time-properties)。

        示例：

```
"transitTime": {
  "@type": "ServicePeriod",
  "businessDays": [
    "https://schema.org/Monday",
    "https://schema.org/Tuesday",
    "https://schema.org/Wednesday",
    "https://schema.org/Thursday",
    "https://schema.org/Friday"
  ],
  "duration": {
    "@type": "QuantitativeValue",
    "minValue": 0,
    "maxValue": 2,
    "unitCode": "DAY"
  }
}
```

        建议属性

            businessDays

[DayOfWeek](https://schema.org/DayOfWeek)

在每周内的哪些天订单处于有效运送状态（如适用）。如果您的组织的营业日为周一至周六，则无需添加此属性。

            duration

[QuantitativeValue](https://schema.org/QuantitativeValue)

运送所需的工作日天数（如适用）。
                另请参阅对于运送时间，Google 支持的 [QuantitativeValue](#shipping-quantitative-value-properties) 属性的列表。

#### QuantitativeValue（用于指定运送时间）

        使用 QuantitativeValue 类型表示最短和最长订单运送时间。
        您必须同时提供 value（用于指定固定的运送时间）或 maxValue（用于指定运送时间上限）以及 unitCode。您可以选择性地提供 minValue，以指定运送时间下限。

        建议属性

            maxValue

[Number](https://schema.org/Number)

最长天数。其值必须是非负整数。

            minValue

[Number](https://schema.org/Number)

最短天数（如适用）。其值必须是非负整数。

            unitCode

[Text](https://schema.org/Text)

运送时间单位。值必须为 DAY 或 d。

            value

[Number](https://schema.org/Number)

确切的运送天数（如果已知）。其值必须是非负整数。
                如果提供了此属性，则不得指定 minValue 和 maxValue。

#### QuantitativeValue（在运输包装尺寸上下文中）

        在 ShippingConditions 的上下文中，使用 QuantitativeValue 类型表示特定运费和运送时间适用的运输包装尺寸（weight 和 numItems）值范围。
        必须提供 minValue 或 maxValue 属性。如果未提供，minValue 属性将默认为 0，maxValue 属性则默认为无穷大。

          您还可以使用 QuantitativeValue 类型指定 ShippingService 类型下的订单处理时间以及 ShippingConditions 类型下的运送时间。
          如需了解详情，请参阅[用于指定订单处理时间的 QuantitativeValue](#handling-time-quantitative-value-properties) 和[用于指定运送时间的 QuantitativeValue](#transit-time-quantitative-value-properties)。

        建议属性

            maxValue

[Number](https://schema.org/Number)

相应尺寸（weight 或 numItems）的最大数量（如适用）。
                 如果未提供，则默认为无穷大。

            minValue

[Number](https://schema.org/Number)

相应尺寸（weight 或 numItems）的最小数量（如适用）。
                必须小于 maxValue。如果未提供，则默认为 0。

            unitCode

[Text](https://schema.org/Text)

与尺寸（weight 或 numItems）相关的单位（如适用）。
                采用 UN/CEFACT 通用代码（3 个字符）格式：

- 对于重量单位，该值必须为 LBR（磅）或 KGM（千克）
- 对于商品数量，可以省略 unitCode。或者，您也可以使用 UN/CEFACT 通用代码名称 H87。

#### MonetaryAmount（在配送条件上下文中）

        在配送条件的上下文中，使用 MonetaryAmount 类型表示特定运费和送货时长适用的订单价值范围。
        必须提供 minValue 或 maxValue 属性。如果未提供，minValue 属性将默认为 0，maxValue 属性将默认为无穷大。请注意，您还可以使用其他格式的 MonetaryAmount 类型[指定运费](#shipping-monetary-amount-properties)。

        必要属性

            currency

[Text](https://schema.org/Text)

订单价值的货币代码，采用 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。

            maxValue

[Number](https://schema.org/Number)

订单的最高价值。如果未提供，则默认为无穷大。

            minValue

[Number](https://schema.org/Number)

订单的最低价值。如果未提供，则默认为 0。

#### MonetaryAmount（在运费上下文中）

        在运费上下文中，使用 MonetaryAmount 类型指定给定配送条件适用的具体运费或最高运费。您可以将 MonetaryAmount 类型用作比 ShippingRateSettings 更简单的替代方案，当您只需要指定具体运费或最高运费时，可以使用此类型。maxValue 或 value 属性必须与 currency 属性一起提供。

        必要属性

            currency

[Text](https://schema.org/Text)

运费的货币代码，采用 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。

            maxValue

[Number](https://schema.org/Number)

给定配送条件适用的最高运费。如果您指定了 maxValue 属性，请勿指定 value 属性。

            value

[Number](https://schema.org/Number)

给定配送条件适用的固定运费。如果免运费，请使用 0 作为值。

#### ShippingRateSettings（在运费上下文中）

        在运费上下文中，使用 ShippingRateSettings 类型指定给定配送条件适用的运费，以订单价值或所订购商品重量的百分比表示。使用 ShippingRateSettings 类型时，必须提供 orderPercentage 或 weightPercentage 属性。

          MonetaryAmount 类型是比 ShippingRateSettings 类型更简单的替代方案，当您只需要指定固定运费时，可以使用此类型。

        建议属性

            orderPercentage

[Number](https://schema.org/Number)

给定配送条件适用的运费，以订单价值的分数值表示。
                 请使用介于 0 到 1 之间的值。

            weightPercentage

[Number](https://schema.org/Number)

给定配送条件适用的运费，以运输货物重量的分数值表示。
                 请使用介于 0 到 1 之间的值。

#### OpeningHoursSpecification（在季节性配送替代政策上下文中）

        在配送条件上下文中，使用 OpeningHoursSpecification 类型表示相应条件的有效时间，例如因季节性节假日而有效。使用 OpeningHoursSpecification 类型时，必须提供 validFrom 和 validThrough 属性中的至少一个。

        建议属性

            validFrom

[Date](https://schema.org/Date)

相应配送条件有效的第一个日期，采用 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 格式。

            validThrough

[Date](https://schema.org/Date)

相应配送条件有效的截止日期，采用 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 格式。

## 
    通过 Google 配置配送设置的其他方法

    零售商的配送政策可能很复杂，并且可能会经常变化。如果您在使用标记指明和及时更新配送详情时遇到问题，并且您拥有 Google Merchant Center 账号，不妨在 Google Merchant Center 中配置[配送设置](https://support.google.com/merchants/answer/12577710?hl=zh-cn)。或者，您也可以[在 Search Console 中配置账号级配送政策](https://support.google.com/webmasters/answer/14907594?hl=zh-cn)，这些政策会自动添加到 Merchant Center 中。

### 组合使用多个配送配置

    如果您要组合使用各种配送配置，请注意可以如何根据优先级顺序来替换政策信息。例如，如果您在网站上提供配送政策标记，并且在 Search Console 中提供配送政策设置，Google 将仅使用在 Search Console 中提供的信息。

    Google 使用以下优先级顺序（从最强到最弱）：

- Content API for Shopping（[账号级配送设置](https://developers.google.com/shopping-content/guides/how-tos/account-level-tax-shipping?hl=zh-cn)）
- [Merchant Center](https://support.google.com/merchants/answer/12577710?hl=zh-cn) 或 [Search Console](https://support.google.com/webmasters/answer/14907594?hl=zh-cn) 中的设置
- [商品级商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)
- 组织级标记

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