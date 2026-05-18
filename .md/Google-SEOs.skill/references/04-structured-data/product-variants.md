# 商品款式/规格结构化数据（ProductGroup、Product）| Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/product-variants?hl=zh-cn

---

  # 商品款式/规格结构化数据（ProductGroup、Product）

*

  服装、鞋类、家具、电子设备和行李等许多类型的商品都有不同的款式/规格（例如各种尺寸、颜色、材质或图案）。为了帮助 Google 更好地了解哪些商品是同一父级商品的不同款式/规格，除了 [Product 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn)之外，请使用 ProductGroup 类以及相关属性 variesBy、hasVariant 和 productGroupID 将此类款式/规格组合在一起。
添加此标记后，您的商品还可在商家商品详情体验中显示款式/规格信息。

  借助 ProductGroup，您还可以为所有款式/规格指定通用产品属性（例如品牌和评价信息）以及款式/规格确定属性，从而减少信息重复。

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

  一般来说，电子商务网站主要使用两种设计方法设计商品款式/规格。本部分介绍了如何根据您网站的设计方法设置商品款式/规格标记：

- [单页](#single-page-website) - 可在一个页面上选择所有款式/规格，而无需重新加载页面（通常通过查询参数）
- [多页](#multi-page-website) - 可以在不同页面上访问同一产品的款式/规格

### 单页网站

此单页网站示例假设网站满足以下条件：

- 如果未选择款式/规格，以下网址会返回主商品页面：https://www.example.com/coat
- 系统会通过以下网址返回包含预先选择的特定款式/规格的同一网页：

      https://www.example.com/coat?size=small&color=green
- https://www.example.com/coat?size=small&color=lightblue
- https://www.example.com/coat?size=large&color=lightblue

  当用户在网页上选择不同的款式/规格（使用颜色和尺寸下拉菜单）时，网页上的图片、价格和库存状况信息会动态变化，而无需重新加载网页。网页上的标记不会随着用户选择不同的款式/规格而动态变化。

#### 单页示例：款式/规格嵌套在 ProductGroup 下

在此示例中，款式/规格使用 hasVariant 属性嵌套在顶级 ProductGroup 实体下：

- ProductGroup 和三个 Offer 实体（在 Product 属性下）都有不同的网址。或者，也可以在 Product 下提供这些网址。
- 通用标题和说明在 ProductGroup 级别指定。
    款式/规格专用的标题和说明在 Product 级别指定。
- 其他常见的款式/规格属性（如品牌、图案、材质和受众群体信息）也在 ProductGroup 级别指定。
- ProductGroup 使用 variesBy 属性指定款式/规格识别属性。
- ProductGroup 使用 productGroupID 指定父 SKU（无需使用 inProductGroupWithID 在 Product 属性下重复）。

  我们推荐这种方法，因为它是商品组及其款式/规格的最紧凑和自然的表示形式。

<html>
  <head>
    <title>Wool winter coat</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "url": "https://www.example.com/coat",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "sku": "44E01-M11000",
            "gtin14": "98766051104214",
            "image": "https://www.example.com/coat_small_green.jpg",
            "name": "Small green coat",
            "description": "Small wool green coat for the winter season",
            "color": "Green",
            "size": "small",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=small&color=green",
              "priceCurrency": "USD",
              "price": 39.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          },
          {
            "@type": "Product",
            "sku": "44E01-K11000",
            "gtin14": "98766051104207",
            "image": "https://www.example.com/coat_small_lightblue.jpg",
            "name": "Small light blue coat",
            "description": "Small wool light blue coat for the winter season",
            "color": "light blue",
            "size": "small",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=small&color=lightblue",
              "priceCurrency": "USD",
              "price": 39.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          },
          {
            "@type": "Product",
            "sku": "44E01-X1100000",
            "gtin14": "98766051104399",
            "image": "https://www.example.com/coat_large_lightblue.jpg",
            "name": "Large light blue coat",
            "description": "Large wool light blue coat for the winter season",
            "color": "light blue",
            "size": "large",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=large&color=lightblue",
              "priceCurrency": "USD",
              "price": 49.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/BackOrder",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          }
        ]
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 2.99,
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "http://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "url": "https://www.example.com/coat",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "sku": "44E01-M11000",
            "gtin14": "98766051104214",
            "image": "https://www.example.com/coat_small_green.jpg",
            "name": "Small green coat",
            "description": "Small wool green coat for the winter season",
            "color": "Green",
            "size": "small",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=small&color=green",
              "priceCurrency": "USD",
              "price": 39.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          },
          {
            "@type": "Product",
            "sku": "44E01-K11000",
            "gtin14": "98766051104207",
            "image": "https://www.example.com/coat_small_lightblue.jpg",
            "name": "Small light blue coat",
            "description": "Small wool light blue coat for the winter season",
            "color": "light blue",
            "size": "small",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=small&color=lightblue",
              "priceCurrency": "USD",
              "price": 39.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/InStock",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          },
          {
            "@type": "Product",
            "sku": "44E01-X1100000",
            "gtin14": "98766051104399",
            "image": "https://www.example.com/coat_large_lightblue.jpg",
            "name": "Large light blue coat",
            "description": "Large wool light blue coat for the winter season",
            "color": "light blue",
            "size": "large",
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat?size=large&color=lightblue",
              "priceCurrency": "USD",
              "price": 49.99,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": "https://schema.org/BackOrder",
              "shippingDetails": { "@id": "#shipping_policy" },
              "hasMerchantReturnPolicy": { "@id": "#return_policy" }
            }
          }
        ]
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 2.99,
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "http://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

#### 单页示例：款式/规格与 ProductGroup 分离

此结构与上一个示例类似，不同之处在于，款式/规格是与 ProductGroup 分开定义的（未嵌套）。对某些内容管理系统 (CMS) 而言，此方法可能更容易生成。

<html>
  <head>
    <title>Wool winter coat</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "url": "https://www.example.com/coat",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Small green coat",
        "description": "Small wool green coat for the winter season",
        "image": "https://www.example.com/coat_small_green.jpg",
        "size": "small",
        "color": "green",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=small&color=green",
          "price": 39.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Small dark blue coat",
        "description": "Small wool light blue coat for the winter season",
        "image": "https://www.example.com/coat_small_lightblue.jpg",
        "size": "small",
        "color": "light blue",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=small&color=lightblue",
          "price": 39.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Large light blue coat",
        "description": "Large wool light blue coat for the winter season",
        "image": "https://www.example.com/coat_large_lightblue.jpg",
        "size": "large",
        "color": "light blue",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=large&color=lightblue",
          "price": 49.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "url": "https://www.example.com/coat",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Small green coat",
        "description": "Small wool green coat for the winter season",
        "image": "https://www.example.com/coat_small_green.jpg",
        "size": "small",
        "color": "green",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=small&color=green",
          "price": 39.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Small dark blue coat",
        "description": "Small wool light blue coat for the winter season",
        "image": "https://www.example.com/coat_small_lightblue.jpg",
        "size": "small",
        "color": "light blue",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=small&color=lightblue",
          "price": 39.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "name": "Large light blue coat",
        "description": "Large wool light blue coat for the winter season",
        "image": "https://www.example.com/coat_large_lightblue.jpg",
        "size": "large",
        "color": "light blue",
        // ... other Product-level properties
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat?size=large&color=lightblue",
          "price": 49.99,
          "priceCurrency": "USD"
          // ... other offer-level properties
        }
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

### 多页网站

此多页网站标记示例假设网站满足以下条件：

- 浅蓝色款式/规格可在以下网址找到（分别适用于小码和大码）：

      https://www.example.com/coat/lightblue?size=small
- https://www.example.com/coat/lightblue?size=large

  绿色款式/规格只能在 https://www.example.com/coat/green?size=small（小码）下找到。
  这两个页面都允许通过界面中的颜色选择器“跳到”另一个页面（即页面会重新加载）。
  该网站将单页示例中的等效标记拆分到两个网页中。

请注意，没有只在一个页面上存在的另一个页面会引用的 ProductGroup 定义。这是因为 ProductGroup 需要引用款式/规格的通用属性，如品牌、材质和年龄段。这也意味着，需要在每个款式/规格网页上重复完整的 ProductGroup 定义。

#### 多页示例：款式/规格嵌套在 ProductGroup 下

  这相当于[第一个单页示例](#single-page-example-1)，其中款式/规格 Product 属性使用 hasVariant 属性嵌套在顶级 ProductGroup 下。两个页面上的 ProductGroup 定义是重复的。请注意以下几点：

- ProductGroup 没有规范网址，因为不存在代表 ProductGroup 的单个网址。
- 每个网页上的 ProductGroup 都有相应页面上款式/规格的完整定义，以及一个仅具有 url 属性的款式/规格可以关联到另一个网页上的款式/规格，这有助于 Google 找出您的款式/规格。

### 第 1 页：浅蓝色款式/规格

以下示例在第一页显示了针对浅蓝色款式/规格的结构化数据：

<html>
  <head>
    <title>Wool winter coat, light blue color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "name": "Small light blue coat",
            "description": "Small wool light blue coat for the winter season",
            "image": "https://www.example.com/coat_small_lightblue.jpg",
            "size": "small",
            "color": "light blue",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/lightblue?size=small",
              "price": 39.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          {
            "@type": "Product",
            "name": "Large light blue coat",
            "description": "Large wool light blue coat for the winter season",
            "image": "https://www.example.com/coat_large_lightblue.jpg",
            "size": "large",
            "color": "light blue",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/lightblue?size=large",
              "price": 49.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          { "url": "https://www.example.com/coat/green?size=small" }
        ]
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat, light blue color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "name": "Small light blue coat",
            "description": "Small wool light blue coat for the winter season",
            "image": "https://www.example.com/coat_small_lightblue.jpg",
            "size": "small",
            "color": "light blue",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/lightblue?size=small",
              "price": 39.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          {
            "@type": "Product",
            "name": "Large light blue coat",
            "description": "Large wool light blue coat for the winter season",
            "image": "https://www.example.com/coat_large_lightblue.jpg",
            "size": "large",
            "color": "light blue",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/lightblue?size=large",
              "price": 49.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          { "url": "https://www.example.com/coat/green?size=small" }
        ]
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

### 第 2 页：绿色款式/规格

以下示例在第二页显示了针对绿色款式/规格的结构化数据：

  <html>
  <head>
    <title>Wool winter coat, green color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "name": "Small green coat",
            "description": "Small wool green coat for the winter season",
            "image": "https://www.example.com/coat_green.jpg",
            "color": "green",
            "size": "small",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/green?size=small",
              "price": 39.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          { "url": "https://www.example.com/coat/lightblue?size=small" },
          { "url": "https://www.example.com/coat/lightblue?size=large" }
        ]
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat, green color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        // ... other ProductGroup-level properties
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "productGroupID": "44E01",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ],
        "hasVariant": [
          {
            "@type": "Product",
            "name": "Small green coat",
            "description": "Small wool green coat for the winter season",
            "image": "https://www.example.com/coat_green.jpg",
            "color": "green",
            "size": "small",
            // ... other Product-level properties
            "offers": {
              "@type": "Offer",
              "url": "https://www.example.com/coat/green?size=small",
              "price": 39.99,
              "priceCurrency": "USD"
              // ... other offer-level properties
            }
          },
          { "url": "https://www.example.com/coat/lightblue?size=small" },
          { "url": "https://www.example.com/coat/lightblue?size=large" }
        ]
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

#### 多页示例：款式/规格与 ProductGroup 分离

此结构与前面的多页示例类似，不同之处在于，款式/规格是与 ProductGroup 分开定义的（未嵌套）。对某些 CMS 而言，此方法可能更容易生成。

### 第 1 页：浅蓝色款式/规格

以下示例在第一页显示了针对浅蓝色款式/规格的结构化数据：

    <html>
  <head>
    <title>Wool winter coat, lightblue color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-K11000",
        "gtin14": "98766051104207",
        "image": "https://www.example.com/coat_lightblue.jpg",
        "name": "Small light blue coat",
        "description": "Small wool light blue coat for the winter season",
        "color": "light blue",
        "size": "small",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/lightblue?size=small",
          "priceCurrency": "USD",
          "price": 39.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-X1100000",
        "gtin14": "98766051104399",
        "image": "https://www.example.com/coat_lightblue.jpg",
        "name": "Large light blue coat",
        "description": "Large wool light blue coat for the winter season",
        "color": "light blue",
        "size": "large",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/lightblue?size=large",
          "priceCurrency": "USD",
          "price": 49.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/BackOrder",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/green?size=small"
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 2.99,
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "https://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat, lightblue color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-K11000",
        "gtin14": "98766051104207",
        "image": "https://www.example.com/coat_lightblue.jpg",
        "name": "Small light blue coat",
        "description": "Small wool light blue coat for the winter season",
        "color": "light blue",
        "size": "small",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/lightblue?size=small",
          "priceCurrency": "USD",
          "price": 39.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-X1100000",
        "gtin14": "98766051104399",
        "image": "https://www.example.com/coat_lightblue.jpg",
        "name": "Large light blue coat",
        "description": "Large wool light blue coat for the winter season",
        "color": "light blue",
        "size": "large",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/lightblue?size=large",
          "priceCurrency": "USD",
          "price": 49.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/BackOrder",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/green?size=small"
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": 2.99,
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "https://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

### 第 2 页：绿色款式/规格

以下示例在第二页显示了针对绿色款式/规格的结构化数据：

    <html>
  <head>
    <title>Wool winter coat, green color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": "#small_green",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-M11000",
        "gtin14": "98766051104214",
        "image": "https://www.example.com/coat_green.jpg",
        "name": "Small green coat",
        "description": "Small wool green coat for the winter season",
        "color": "green",
        "size": "small",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/green?size=small",
          "priceCurrency": "USD",
          "price": 39.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/lightblue?size=small"
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/lightblue?size=large"
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "2.99",
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "https://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Wool winter coat, green color</title>
    <script type="application/ld+json">
    [
      {
        "@context": "https://schema.org/",
        "@type": "ProductGroup",
        "@id": "#coat_parent",
        "name": "Wool winter coat",
        "description": "Wool coat, new for the coming winter season",
        "brand": {
          "@type": "Brand",
          "name": "Good brand"
        },
        "audience": {
          "@type": "PeopleAudience",
          "suggestedGender": "unisex",
          "suggestedAge": {
            "@type": "QuantitativeValue",
            "minValue": 13,
            "unitCode": "ANN"
          }
        },
        "productGroupID": "44E01",
        "pattern": "striped",
        "material": "wool",
        "variesBy": [
          "https://schema.org/size",
          "https://schema.org/color"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": "#small_green",
        "isVariantOf": { "@id": "#coat_parent" },
        "sku": "44E01-M11000",
        "gtin14": "98766051104214",
        "image": "https://www.example.com/coat_green.jpg",
        "name": "Small green coat",
        "description": "Small wool green coat for the winter season",
        "color": "green",
        "size": "small",
        "offers": {
          "@type": "Offer",
          "url": "https://www.example.com/coat/green?size=small",
          "priceCurrency": "USD",
          "price": 39.99,
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "shippingDetails": { "@id": "#shipping_policy" },
          "hasMerchantReturnPolicy": { "@id": "#return_policy" }
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/lightblue?size=small"
      },
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "isVariantOf": { "@id": "#coat_parent" },
        "url": "https://www.example.com/coat/lightblue?size=large"
      },
      {
        "@context": "https://schema.org/",
        "@type": "OfferShippingDetails",
        "@id": "#shipping_policy",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "2.99",
          "currency": "USD"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 0,
            "maxValue": 1,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      },
      {
        "@context": "https://schema.org/",
        "@type": "MerchantReturnPolicy",
        "@id": "#return_policy",
        "applicableCountry": "US",
        "returnPolicyCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 60,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    ]
    </script>
  </head>
  <body>
  </body>
</html>
```

## 指南

为了让您的商品款式/规格标记能够在 Google 搜索中使用，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)
- [非付费商品详情指南](https://support.google.com/merchants/answer/12073010?hl=zh-cn)（适用于商家信息体验）

### 技术指南

- 每个款式/规格在对应的结构化数据标记中都必须具有唯一 ID（例如，使用 sku 或 gtin 属性）。
- 每个商品组在对应的结构化数据标记中都必须具有唯一 ID，ID 可通过款式/规格 Product 属性中的 inProductGroupWithID 属性或 ProductGroup 属性中的 productGroupID 属性指定。
- 除了商品款式/规格属性之外，请务必按照商家信息（或[商品摘要](https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn#structured-data-type-definitions)）的[必需属性](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#structured-data-type-definitions)列表添加 Product 结构化数据。
- 对于[单页网站](#single-page-website)，所有款式/规格所属的整体 ProductGroup 只能有一个独特的规范网址。通常，此网址是指向未预选款式/规格的网页的基础网址，例如：https://www.example.com/winter_coat。
  对于[多页网站](#multi-page-website)，则不适用，因为不存在代表 ProductGroup 属性的单个规范网址（因为款式/规格会分布在同等重要的网页中）。
- 对于[多页网站](#multi-page-website)，每个网页都必须针对该页面中定义的实体提供完整且独立的标记（这意味着，完全理解网页本身上的标记无需参考页面之外的实体）。
- 网站必须能够使用独特的网址（使用网址查询参数）直接预选每个款式/规格，例如 https://www.example.com/winter_coat/size=small&color=green。这样，Google 就可以抓取并识别每个款式/规格。预先选择每个款式/规格包括显示合适的图片、价格和库存状况，以及允许用户将款式/规格添加到购物车。
- 如果您是针对所有类型的购物搜索结果进行优化的商家，我们建议将 Product 结构化数据放在初始 HTML 中，以便取得最佳效果。
- **对于由 JavaScript 生成的 Product 标记**：请注意，[动态生成的标记](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)可能会导致购物内容抓取频率降低且不太可靠，这可能会对商品库存状况和价格等快速变化的内容造成影响。如果您使用 JavaScript 生成 Product 标记，请确保您的服务器有足够的计算资源来处理来自 Google 的更多流量。

## 结构化数据类型定义

您必须为结构化数据添加必需的属性，才能在 Google 搜索中使用这些数据。您还可添加建议属性，以便添加与商品款式/规格相关的更多信息，进而提供更优质的用户体验。

### ProductGroup

Google 可识别 ProductGroup 的以下属性。如需了解 ProductGroup 的完整定义，请访问 [schema.org/ProductGroup](https://schema.org/ProductGroup)。当您使用商品款式/规格信息标记内容时，请使用 ProductGroup 属性的以下属性。

    必要属性

    name

[Text](https://schema.org/Text)

ProductGroup 的名称（例如“羊毛冬季外套”）。请确保每个 Product 商品中的款式/规格名称更加具体（例如，基于款式/规格识别属性的“羊毛冬季外套 - 绿色，小尺码”）。
        如需了解详情，请参阅[商品文档](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#name)。

    建议属性

    aggregateRating

[AggregateRating](https://schema.org/AggregateRating)

ProductGroup 的嵌套 aggregateRating（代表所有款式/规格），如果适用。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看 [AggregateRating](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregated-rating-type-definition) 的必要属性和建议属性列表。

    brand

[Brand](https://schema.org/Brand)

ProductGroup 的品牌信息（所有款式/规格都相同），如果适用。
        如需详细了解 brand，请参阅[商品文档](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#brand)。

    brand.name

[Text](https://schema.org/Text)

ProductGroup 的品牌名称（所有款式/规格都相同）。如果您已在 ProductGroup 级别添加品牌，则无需在 Product 级别再次添加。
        如需详细了解 brand，请参阅[商品文档](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#brand)。

    description

[Text](https://schema.org/Text) 或 [TextObject](https://schema.org/TextObject)

ProductGroup 的说明。例如，“适合寒冷气候的羊毛冬季外套”。确保款式/规格说明更加具体，最好使用可标识款式/规格的字词（例如颜色、尺码、材质）。

      除了 ProductGroup 的说明之外，我们还建议在 Product 级别添加每个款式/规格的说明。如需了解详情，请参阅[商品文档](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#description)。

    hasVariant

[Product](https://schema.org/Product)

嵌套的 Product 属性，它是 ProductGroup 属性的款式/规格之一（如果适用）。ProductGroup 通常具有多个嵌套款式/规格 Product 属性。

或者，款式/规格 Product 属性可以使用 Product 属性上的 isVariantOf 属性回引用其父级 ProductGroup。

    productGroupID

[Text](https://schema.org/Text)

商品组的标识符（也称为“父级 SKU”）。*必须为 ProductGroup 属性提供此标识符，或者，针对 ProductGroup 属性的款式/规格使用 inProductGroupWithID 属性。如果您为 ProductGroup 属性及其款式/规格 Product 属性都提供了标识符，则它们必须匹配。

    review

[Review](https://schema.org/Review)

ProductGroup 的嵌套 review（如果适用）。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看[评价属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#review-properties)的必要属性和建议属性列表。

    url

[URL](https://schema.org/URL)

仅适用于[单页网站](#single-page-website)**：ProductGroup 属性所在的网址（不含款式/规格选择器），如果适用。请勿将此属性用于多页网站。

    variesBy

[DefinedTerm](https://schema.org/DefinedTerm)

ProductGroup 中的款式/规格变化的方面（例如尺码或颜色），如果适用。请参考这些款式/规格标识属性的完整 Schema.org 网址（例如 https://schema.org/color），详细了解这些属性。支持以下属性：

- https://schema.org/color
- https://schema.org/size
- https://schema.org/suggestedAge
- https://schema.org/suggestedGender
- https://schema.org/material
- https://schema.org/pattern

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