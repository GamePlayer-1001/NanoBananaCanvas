# 民宿架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/vacation-rental?hl=zh-cn

---

  # 民宿 (VacationRental) 结构化数据

  如果您向民宿商家信息页面添加结构化数据，Google 搜索便能够以更丰富的方式显示商家信息。用户可以直接在搜索结果中查看商家信息，例如名称、说明、图片、位置、评分、评价等。

## 
  开始之前

  本文中的说明适用于相应人士已与 Google 技术支持客户经理联系且有权访问 [Hotel Center](https://hotelcenter.google.com/?hl=zh-cn) 的网站。如果您有兴趣集成民宿商家信息，可以填写[民宿意向调查表](https://services.google.com/fb/forms/googlevacationrentalsinterestform/?hl=zh-cn)。
  填写此表单表示您有兴趣参与此计划，但并不能保证您一定会收到加入尝鲜者计划的邀请。

此功能仅适用于符合特定资格条件的网站，并且[需要执行额外步骤](https://support.google.com/hotelprices/answer/11946837?hl=zh-cn)才能完成集成。如需详细了解如何在 Google 上列出您的民宿，请参阅集成[入门指南](https://support.google.com/hotelprices/answer/12568039?hl=zh-cn)。

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

## 
  示例

下面是一个 JSON-LD 格式的民宿商家信息简单示例。

<html>
  <head>
    <title>My Beautiful Vacation Rental</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        "additionalType": "HolidayVillageRental",
        "brand": {
          "@type": "Brand",
          "name": "brandIdName"
        },
        "containsPlace": {
          "@type": "Accommodation",
          "additionalType": "EntirePlace",
          "bed": [{
            "@type": "BedDetails",
            "numberOfBeds" : 1,
            "typeOfBed": "Queen"
          },
          {
            "@type": "BedDetails",
            "numberOfBeds" : 2,
            "typeOfBed": "Single"
          }],
         "occupancy": {
            "@type": "QuantitativeValue",
            "value" : 2
          },
          "amenityFeature": [
            {
              "@type": "LocationFeatureSpecification",
              "name": "ac",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "airportShuttle",
              "value": true
            },
            {
             "@type": "LocationFeatureSpecification",
              "name": "balcony",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "beachAccess",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "childFriendly",
              "value": true
            }
          ],
          "floorSize": {
            "@type": "QuantitativeValue",
            "value" : 75,
            "unitCode": "MTK"
          },
          "numberOfBathroomsTotal": 1,
          "numberOfBedrooms": 3,
          "numberOfRooms": 5
        },
        "identifier": "abc123",
        "latitude": "42.12345",
        "longitude": "101.12345",
        "name": "My Beautiful Vacation Rental",
        "address": {
          "addressCountry": "US",
          "addressLocality": "Mountain View",
          "addressRegion": "California",
          "postalCode": "94043",
          "streetAddress": "1600 Amphitheatre Pkwy, Unit 6E"
        },
        "aggregateRating": {
          "ratingValue": 4.5,
          "ratingCount": 10,
          "reviewCount": 3,
          "bestRating": 5
        },
        "image": [
          "https://example.com/mylisting/unit_image1.png",
          "https://example.com/mylisting/unit_image2.png",
          "https://example.com/mylisting/unit_image3.png",
          "https://example.com/mylisting/unit_image4.png",
          "https://example.com/mylisting/unit_image5.png",
          "https://example.com/mylisting/unit_image6.png",
          "https://example.com/mylisting/unit_image7.png",
          "https://example.com/mylisting/unit_image8.png"
        ],
        "checkinTime": "18:00:00+08:00",
        "checkoutTime": "11:00:00+08:00",
        "description": "A great Vacation Rental in the perfect neighborhood.",
        "knowsLanguage": ["en-US", "fr-FR"],
        "review": [{
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 4,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "Lillian Ruiz"
          },
          "datePublished": "2024-12-01",
          "contentReferenceTime": "2024-11-17"
        },
        {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 5,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "John S."
          },
          "datePublished": "2024-10-01",
          "contentReferenceTime": "2024-09-28"
        }
      ]
      }
    </script>
  </head>
  <body></body>
  </html>

```
<html>
  <head>
    <title>My Beautiful Vacation Rental</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "VacationRental",
        "additionalType": "HolidayVillageRental",
        "brand": {
          "@type": "Brand",
          "name": "brandIdName"
        },
        "containsPlace": {
          "@type": "Accommodation",
          "additionalType": "EntirePlace",
          "bed": [{
            "@type": "BedDetails",
            "numberOfBeds" : 1,
            "typeOfBed": "Queen"
          },
          {
            "@type": "BedDetails",
            "numberOfBeds" : 2,
            "typeOfBed": "Single"
          }],
         "occupancy": {
            "@type": "QuantitativeValue",
            "value" : 2
          },
          "amenityFeature": [
            {
              "@type": "LocationFeatureSpecification",
              "name": "ac",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "airportShuttle",
              "value": true
            },
            {
             "@type": "LocationFeatureSpecification",
              "name": "balcony",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "beachAccess",
              "value": true
            },
            {
              "@type": "LocationFeatureSpecification",
              "name": "childFriendly",
              "value": true
            }
          ],
          "floorSize": {
            "@type": "QuantitativeValue",
            "value" : 75,
            "unitCode": "MTK"
          },
          "numberOfBathroomsTotal": 1,
          "numberOfBedrooms": 3,
          "numberOfRooms": 5
        },
        "identifier": "abc123",
        "latitude": "42.12345",
        "longitude": "101.12345",
        "name": "My Beautiful Vacation Rental",
        "address": {
          "addressCountry": "US",
          "addressLocality": "Mountain View",
          "addressRegion": "California",
          "postalCode": "94043",
          "streetAddress": "1600 Amphitheatre Pkwy, Unit 6E"
        },
        "aggregateRating": {
          "ratingValue": 4.5,
          "ratingCount": 10,
          "reviewCount": 3,
          "bestRating": 5
        },
        "image": [
          "https://example.com/mylisting/unit_image1.png",
          "https://example.com/mylisting/unit_image2.png",
          "https://example.com/mylisting/unit_image3.png",
          "https://example.com/mylisting/unit_image4.png",
          "https://example.com/mylisting/unit_image5.png",
          "https://example.com/mylisting/unit_image6.png",
          "https://example.com/mylisting/unit_image7.png",
          "https://example.com/mylisting/unit_image8.png"
        ],
        "checkinTime": "18:00:00+08:00",
        "checkoutTime": "11:00:00+08:00",
        "description": "A great Vacation Rental in the perfect neighborhood.",
        "knowsLanguage": ["en-US", "fr-FR"],
        "review": [{
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 4,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "Lillian Ruiz"
          },
          "datePublished": "2024-12-01",
          "contentReferenceTime": "2024-11-17"
        },
        {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 5,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "John S."
          },
          "datePublished": "2024-10-01",
          "contentReferenceTime": "2024-09-28"
        }
      ]
      }
    </script>
  </head>
  <body></body>
  </html>
```

## 资格要求指南

 民宿结构化数据必须遵循以下指南，才能在 Google 搜索中使用。

- [民宿政策](https://support.google.com/hotelprices/topic/12028304?hl=zh-cn)
- [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

  警告：**如果网站违反了以下一个或多个指南，Google 可能会对网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

## 
  结构化数据类型定义

  下表列出了使用 [schema.org/VacationRental](https://schema.org/VacationRental) 标记民宿商家信息的属性和用法。为使您的结构化数据能够显示，您必须为其添加必需的属性。您还可添加建议的属性，以便添加与您的内容相关的更多信息，进而提供更好的用户体验。

### 
  VacationRental

如需了解 VacationRental 的完整定义，请访问 [schema.org/VacationRental](https://schema.org/VacationRental)。

      必要属性

        containsPlace

            [Accommodation](https://schema.org/Accommodation)

          民宿商家信息必须包含一个 [Accommodation](https://schema.org/Accommodation) 以标记其他详细信息，例如床位、入住人数、客房数和 amenityFeature 属性。

      containsPlace.occupancy

          [QuantitativeValue](https://schema.org/QuantitativeValue)

有关民宿商家信息中允许入住人数上限的信息。

```
"occupancy": {
  "@type": "QuantitativeValue",
  "value" : 5
  }
```

      containsPlace.occupancy.value

          [Integer](https://schema.org/Integer)

民宿商家信息中允许入住的人数值。

        identifier

            [Text](https://schema.org/Text)

房源的唯一标识符。

          其他指南：

- 此标识符必须独立于商家信息中的内容；例如，当屋主更新商家信息名称或卧室数时，该属性不会发生变化。
- 必须为不同语言的同一商家信息使用相同的标识符。

        image

          重复 [URL](https://schema.org/URL)

一张或多张商家信息图片。商家信息必须至少包含 8 张照片（以下每个类别至少 1 张照片）：卧室、浴室和公共区域。

          此外，还需遵循[房源商家信息图片要求](https://developers.google.com/hotels/vacation-rentals/dev-guide/onboarding?hl=zh-cn#property_listing_image_requirements)。

        latitude **（或 geo.latitude）

            [Number](https://schema.org/Number)

          商家所在位置的纬度。精度必须至少为 5 位小数。

        longitude 
（或 geo.longitude）

            [Number](https://schema.org/Number)

          商家所在位置的经度。精度必须至少为 5 位小数。

        name

            [Text](https://schema.org/Text)

民宿商家信息的名称。

      建议属性

        additionalType

            [Text](https://schema.org/Text)

          民宿商家信息的类型。以下是一些建议的值：

- Apartment
- Bungalow
- Cabin
- Chalet
- Cottage
- Gite
- HolidayVillageRental
- House
- Villa
- VacationRental

          这些值的完整定义请参阅[住宿商家类别](https://support.google.com/hotelprices/answer/9970971?ref_topic=10062823&hl=zh-cn#VR)。

        address

            [PostalAddress](https://schema.org/PostalAddress)

民宿的完整实际位置。

提供民宿的街道地址、城市、州/省或地区以及邮政编码。如果适用，请提供单元号或公寓号。

请注意，邮政信箱或其他仅限邮寄的地址不属于完整的实际地址。

```
"address": {
  "addressCountry": "US",
  "addressLocality": "Mountain View",
  "addressRegion": "California",
  "postalCode": "94043",
  "streetAddress": "1600 Amphitheatre Pkwy, Apartment 4E"
}
```

      address.addressCountry

          [Text](https://schema.org/Text)

民宿商家所属的国家/地区，使用两个字母的 [ISO 3166-1 alpha-2 国家/地区代码](https://wikipedia.org/wiki/ISO_3166-1)。

        address.addressLocality

            [Text](https://schema.org/Text)

民宿商家所在的城市。

      address.addressRegion

          [Text](https://schema.org/Text)

商家信息中的州、地区或省的名称。

    address.postalCode

        [Text](https://schema.org/Text)

民宿商家的邮政编码。

        address.streetAddress

            [Text](https://schema.org/Text)

民宿商家信息中的完整街道地址，包括单元号或公寓号（如适用）。

      aggregateRating

          [AggregateRating](https://schema.org/AggregateRating)

        民宿平均评分是根据多条评分或评价得出的。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看必需和建议的[总体评分属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregated-rating-type-definition)列表。

      brand

          [Brand](https://schema.org/Brand)

        与此房源相关的品牌 ID。如需详细了解如何将房源与品牌相关联，以及如何将品牌图标和显示名称与相应的品牌 ID 相关联，请参阅 [Hotel Center 文档](https://support.google.com/hotelprices/answer/9919249?hl=zh-cn)。

```
"brand": {
  "@type": "Brand",
  "name" : "brandIdName"
}
```

      checkinTime

          [Time](https://schema.org/Time)

        房客最早入住住宿场所的时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

示例：14:30:00+08:00

      checkoutTime

          [Time](https://schema.org/Time)

房客最晚入住住宿场所的时间，采用 [ISO 8601 格式](https://wikipedia.org/wiki/ISO_8601)。

示例：14:30:00+08:00

      containsPlace.additionalType

          [Text](https://schema.org/Text)

        此住宿的客房类型。请使用以下某个值：

- EntirePlace
- PrivateRoom
- SharedRoom

      containsPlace.amenityFeature

重复 [amenityFeature](https://schema.org/amenityFeature)

房源是否提供特定功能或酒店设施。布尔值示例遵循以下模式：

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "featureName",
  "value": true
}
```

布尔值**

为 amenityFeature.name 属性使用以下某个值。这些值必须采用英语，即使对于非英语商家信息也是如此。

          ac

房源是否有空调。

          airportShuttle

房主是否提供往返机场或其他交通站点的交通服务。

          balcony

房源是否有阳台。

          beachAccess

房源是否可通往房源附近的公共海滩。

          childFriendly

房源是否适合儿童。

          crib

房源是否提供婴儿床。

          elevator

房源是否有电梯。

          fireplace

房源是否有壁炉。

          freeBreakfast

房源是否包含早餐。

          gymFitnessEquipment

房源是否有健身房或健身器材。

          heating

房源是否有供暖。

          hotTub

房源是否有热水浴缸。

          instantBookable

            房源是否可通过退房流程立即预订。备用选项是等待批准。

          ironingBoard

房源是否提供熨衣板。

          kitchen

房源是否有厨房。

          microwave

房源是否有微波炉。

          outdoorGrill

房源是否有烧烤架。

          ovenStove

房源是否有烤箱或火炉。

          patio

房源是否有露台。

          petsAllowed

房客是否可以携带宠物入住民宿。

          您可以用 containsPlace.petsAllowed 属性代替此字段。

          pool

房源是否有泳池。

          privateBeachAccess

房源是否有专属非公共海滩。

          selfCheckinCheckout

房源是否支持自助入住和退房。

          smokingAllowed

屋内是否允许吸烟。

          您可以用 containsPlace.smokingAllowed 属性代替此字段。

            tv

房源是否有电视。

          washerDryer

房源是否提供洗衣机。

          wheelchairAccessible

房源是否轮椅无障碍。

          wifi

房源是否有 Wi-Fi。

**非布尔值**

对于 amenityFeature，我们还支持以下非布尔 name 和 value 对。这两个值必须采用英语，即使对于非英语商家信息也是如此。

非布尔值遵循以下模式：

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "featureName",
  "value": "detail"
  }
```

                internetType

              房源提供的互联网类型。以下是一些建议的值：

- Free
- Paid
- None

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "internetType",
  "value": "Free"
}
```

parkingType

            房源提供的停车类型。以下是一些建议的值：

- Free
- Paid
- None

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "parkingType",
  "value": "Free"
}
```

            poolType

            房源提供的泳池类型。以下是一些建议的值：

- Indoor
- Outdoor
- None

            仅支持英文字符串。

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "poolType",
  "value": "Outdoor"
}
```

licenseNum

            在全球某些地区需要显示的房源许可号码（游客或商家）。如果存在多个许可，可以重复添加，我们建议添加许可授权机构作为背景信息（例如：Paris: 123456ABC）。

```
"amenityFeature": {
  "@type": "LocationFeatureSpecification",
  "name" : "licenseNum",
  "value": "Paris: 123456ABC"
}
```

      containsPlace.bed

        重复 [BedDetails](https://schema.org/BedDetails)

        商家信息中的床位类型和数量信息。

```
"bed": [{
  "@type": "BedDetails",
  "numberOfBeds" : 1,
  "typeOfBed": "Queen"
  },
  {
  "@type": "BedDetails",
  "numberOfBeds" : 2,
  "typeOfBed": "Single"
  }]
```

      containsPlace.bed.numberOfBeds

        [Integer](https://schema.org/Integer)

        商家信息中的床位数。

      containsPlace.bed.typeOfBed

        [Text](https://schema.org/Text)

        商家信息中的床位类型。以下是一些建议的值：

- CaliforniaKing
- King
- Queen
- Full
- Double
- SemiDouble
- Single

      containsPlace.floorSize

          [QuantitativeValue](https://schema.org/QuantitativeValue)

住宿场所的大小。必须使用 unitCode 属性值指定：

- 以平方英尺为单位：FTK 或 SQFT
- 以平方米为单位：MTK 或 SQM

```
"floorSize": {
  "@type": "QuantitativeValue",
  "value" : 75,
  "unitCode": "MTK"
  }
```

    containsPlace.numberOfBathroomsTotal

        [Integer](https://schema.org/Integer)

      商家信息中的总浴室数。请遵循 [RESO 中所述的](https://ddwiki.reso.org/display/DDW17/BathroomsTotalInteger+Field)房地产惯例，并使用浴室数量的简单总和。例如，如果房源有两个标准浴室和一个半套浴室，则浴室总数为 2.5。

    containsPlace.numberOfBedrooms

        [Integer](https://schema.org/Integer)

商家信息中的卧室总数。

    containsPlace.numberOfRooms

          [Integer](https://schema.org/Integer)

商家信息中的客房总数。

      description

          [Text](https://schema.org/Text)

对房源的说明。

      knowsLanguage

          Repeated [Text](https://schema.org/Text)

        屋主可以使用的语言。请使用符合 IETF BCP 47 标准的语言代码，例如 en-US 或 fr-FR。

      review

          Repeated [Review](https://schema.org/Review)

        商家信息的一条或多条用户评价。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看[评价属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#review-properties)的必要属性和建议属性列表。

      **注意**：对于民宿，review.datePublished 是必填字段。

```
"review": {
  "@type": "Review",
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 4,
    "bestRating": 5
  },
  "datePublished": "2023-02-09"
  "author": {
    "@type": "Person",
    "name": "Lillian R"
  }
}
```

        review.contentReferenceTime

            [DateTime](https://schema.org/DateTime)

        **对于法国的民宿商家信息，此属性为必要属性**。

作者入住的开始日期。

## 使用 Search Console 监控富媒体搜索结果

   Search Console 是一款工具，可帮助您监控网页在 Google 搜索结果中的显示效果。即使没有注册 Search Console，您的网页也可能会显示在 Google 搜索结果中，但注册 Search Console 能够帮助您了解 Google 如何查看您的网站并做出相应的改进。建议您在以下情况下查看 Search Console：

1. [首次部署结构化数据后](#after-deploying)
2. [发布新模板或更新代码后](#after-releasing)
3. [定期分析流量时](#analyzing-periodically)

### 
    首次部署结构化数据后

    等 Google 将网页编入索引后，请在相关的[富媒体搜索结果状态报告](https://support.google.com/webmasters/answer/7552505?hl=zh-cn)中查看是否存在问题。
    理想情况下，有效项目数量会增加，而无效项目数量不会增加。如果您发现结构化数据存在问题，请执行以下操作：

1. [修正无效项目](#troubleshooting)。
2. [检查实际网址](https://support.google.com/webmasters/answer/9012289?hl=zh-cn#test_live_page)，核实问题是否仍然存在。
3. 使用状态报告[请求验证](https://support.google.com/webmasters/answer/7552505?hl=zh-cn#validation)。

### 
    发布新模板或更新代码后

     如果对网站进行重大更改，请监控结构化数据无效项目的增幅。

- 如果您发现**无效项目增多了**，可能是因为您推出的某个新模板无法正常工作，或者您的网站以一种新的错误方式与现有模板交互。
- 如果您发现**有效项目减少了**（但无效项目的增加情况并不对应），可能是因为您的网页中未再嵌入结构化数据。请通过[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)了解导致此问题的原因。

  **警告**：请勿使用[缓存链接](https://support.google.com/websearch/answer/1687222?hl=zh-cn)调试网页。建议改用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)，因为该工具会检查网页的最新版本。

### 
    定期分析流量时

    请使用[效果报告](https://support.google.com/webmasters/answer/7576553?hl=zh-cn)分析您的 Google 搜索流量。数据将显示您的网页在 Google 搜索结果中显示为富媒体搜索结果的频率、用户点击该网页的频率以及网页在搜索结果中的平均排名。您还可以使用 [Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/how-tos/search_analytics?hl=zh-cn) 自动提取这些结果。

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