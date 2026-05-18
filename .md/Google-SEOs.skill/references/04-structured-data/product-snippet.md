# 如何添加商品摘要结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=zh-cn

---

  # 商品摘要（Product、Review、Offer）结构化数据

  当您向网页添加 Product 标记后，该网页便可显示为商品摘要，这是一种[文本结果](https://developers.google.com/search/docs/appearance/visual-elements-gallery?hl=zh-cn#text-result)，其中包含评分、查看信息、价格和库存状况等其他商品信息。

  本指南重点介绍商品摘要的 Product 结构化数据要求。如果您不确定要使用哪个标记，请参阅我们的 [Product 标记简介](https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn)。

客户可以从您那购买商品吗？**如果可以，请考虑添加[商家信息标记](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn)。

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

  以下示例说明了如何在不同情况下在您的网页中添加结构化数据。

### 商品评价页面

下面是一个商品评价页面上的结构化数据示例，用于演示搜索结果中商品摘要的处理方式。

#### JSON-LD

     <html>
  <head>
    <title>Executive Anvil</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Executive Anvil",
      "image": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "description": "Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.",
      "sku": "0446310786",
      "mpn": "925872",
      "brand": {
        "@type": "Brand",
        "name": "ACME"
      },
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Fred Benson"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.4,
        "reviewCount": 89
      },
      "offers": {
        "@type": "Offer",
        "url": "https://example.com/anvil",
        "priceCurrency": "USD",
        "price": 119.99,
        "priceValidUntil": "2024-11-20",
        "itemCondition": "https://schema.org/UsedCondition",
        "availability": "https://schema.org/InStock"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
    **

```
 <html>
  <head>
    <title>Executive Anvil</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "Executive Anvil",
      "description": "Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.",
      "review": {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": 4,
          "bestRating": 5
        },
        "author": {
          "@type": "Person",
          "name": "Fred Benson"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": 4.4,
        "reviewCount": 89
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

#### RDFa

     <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div typeof="schema:Product">
        <div rel="schema:review">
          <div typeof="schema:Review">
            <div rel="schema:reviewRating">
              <div typeof="schema:Rating">
                <div property="schema:ratingValue" content="4"></div>
                <div property="schema:bestRating" content="5"></div>
              </div>
            </div>
            <div rel="schema:author">
              <div typeof="schema:Person">
                <div property="schema:name" content="Fred Benson"></div>
              </div>
            </div>
          </div>
        </div>
        <div rel="schema:image" resource="https://example.com/photos/4x3/photo.jpg"></div>
        <div property="schema:mpn" content="925872"></div>
        <div property="schema:name" content="Executive Anvil"></div>
        <div property="schema:description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height."></div>
        <div rel="schema:image" resource="https://example.com/photos/1x1/photo.jpg"></div>
        <div rel="schema:brand">
          <div typeof="schema:Brand">
            <div property="schema:name" content="ACME"></div>
          </div>
        </div>
        <div rel="schema:aggregateRating">
          <div typeof="schema:AggregateRating">
            <div property="schema:reviewCount" content="89"></div>
            <div property="schema:ratingValue" content="4.4"></div>
          </div>
        </div>
        <div rel="schema:offers">
          <div typeof="schema:Offer">
            <div property="schema:price" content="119.99"></div>
            <div property="schema:availability" content="https://schema.org/InStock"></div>
            <div property="schema:priceCurrency" content="USD"></div>
            <div property="schema:priceValidUntil" datatype="xsd:date" content="2024-11-20"></div>
            <div rel="schema:url" resource="https://example.com/anvil"></div>
            <div property="schema:itemCondition" content="https://schema.org/UsedCondition"></div>
          </div>
        </div>
        <div rel="schema:image" resource="https://example.com/photos/16x9/photo.jpg"></div>
        <div property="schema:sku" content="0446310786"></div>
      </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div typeof="schema:Product">
        <div rel="schema:review">
          <div typeof="schema:Review">
            <div rel="schema:reviewRating">
              <div typeof="schema:Rating">
                <div property="schema:ratingValue" content="4"></div>
                <div property="schema:bestRating" content="5"></div>
              </div>
            </div>
            <div rel="schema:author">
              <div typeof="schema:Person">
                <div property="schema:name" content="Fred Benson"></div>
              </div>
            </div>
          </div>
        </div>
        <div property="schema:name" content="Executive Anvil"></div>
        <div property="schema:description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height."></div>
        <div rel="schema:aggregateRating">
          <div typeof="schema:AggregateRating">
            <div property="schema:reviewCount" content="89"></div>
            <div property="schema:ratingValue" content="4.4"></div>
          </div>
        </div>
      </div>
  </body>
</html>
```

#### 微数据

     <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
  <div>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="mpn" content="925872" />
      <meta itemprop="name" content="Executive Anvil" />
      <link itemprop="image" href="https://example.com/photos/16x9/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/4x3/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/1x1/photo.jpg" />
      <meta itemprop="description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height." />
      <div itemprop="offers" itemtype="https://schema.org/Offer" itemscope>
        <link itemprop="url" href="https://example.com/anvil" />
        <meta itemprop="availability" content="https://schema.org/InStock" />
        <meta itemprop="priceCurrency" content="USD" />
        <meta itemprop="itemCondition" content="https://schema.org/UsedCondition" />
        <meta itemprop="price" content="119.99" />
        <meta itemprop="priceValidUntil" content="2024-11-20" />
      </div>
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <meta itemprop="ratingValue" content="4.4" />
      </div>
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Fred Benson" />
        </div>
        <div itemprop="reviewRating" itemtype="https://schema.org/Rating" itemscope>
          <meta itemprop="ratingValue" content="4" />
          <meta itemprop="bestRating" content="5" />
        </div>
      </div>
      <meta itemprop="sku" content="0446310786" />
      <div itemprop="brand" itemtype="https://schema.org/Brand" itemscope>
        <meta itemprop="name" content="ACME" />
      </div>
    </div>
  </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
  <div>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="name" content="Executive Anvil" />
      <meta itemprop="description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height." />
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <meta itemprop="ratingValue" content="4.4" />
      </div>
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Fred Benson" />
        </div>
        <div itemprop="reviewRating" itemtype="https://schema.org/Rating" itemscope>
          <meta itemprop="ratingValue" content="4" />
          <meta itemprop="bestRating" content="5" />
        </div>
      </div>
    </div>
  </div>
  </body>
</html>
```

### 优缺点

下面是一个包含优缺点的商品测评类评价页面示例，用于演示搜索结果中商品摘要的处理方式。

#### JSON-LD

     <html>
  <head>
    <title>Cheese Knife Pro review</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Cheese Grater Pro",
        "review": {
          "@type": "Review",
          "name": "Cheese Knife Pro review",
          "author": {
            "@type": "Person",
            "name": "Pascal Van Cleeff"
          },
          "positiveNotes": {
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Consistent results"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Still sharp after many uses"
              }
            ]
          },
          "negativeNotes": {
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "No child protection"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Lacking advanced features"
              }
            ]
          }
        }
      }
    </script>
  </head>
  <body>
  </body>
</html>

```
 <html>
  <head>
    <title>Cheese Knife Pro review</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "Cheese Grater Pro",
        "review": {
          "@type": "Review",
          "name": "Cheese Knife Pro review",
          "author": {
            "@type": "Person",
            "name": "Pascal Van Cleeff"
          },
          "positiveNotes": {
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Consistent results"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Still sharp after many uses"
              }
            ]
          },
          "negativeNotes": {
            "@type": "ItemList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "No child protection"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Lacking advanced features"
              }
            ]
          }
        }
      }
    </script>
  </head>
  <body>
  </body>
</html>
```

#### RDFa

     <html>
  <head>
    <title>Cheese Knife Pro review</title>
  </head>
  <body>
    <div typeof="schema:Product">
      <div property="schema:name" content="Cheese Knife Pro review"></div>
        <div rel="schema:review">
          <div typeof="schema:Review">
            <div rel="schema:positiveNotes">
              <div typeof="schema:ItemList">
                <div rel="schema:itemListElement">
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="1"></div>
                    <div property="schema:name" content="Consistent results"></div>
                  </div>
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="2"></div>
                    <div property="schema:name" content="Still sharp after many uses"></div>
                  </div>
                </div>
              </div>
            </div>
            <div rel="schema:negativeNotes">
              <div typeof="schema:ItemList">
                <div rel="schema:itemListElement">
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="1"></div>
                    <div property="schema:name" content="No child protection"></div>
                  </div>
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="2"></div>
                    <div property="schema:name" content="Lacking advanced features"></div>
                  </div>
                </div>
              </div>
            </div>
            <div rel="schema:author">
              <div typeof="schema:Person">
                <div property="schema:name" content="Pascal Van Cleeff"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Cheese Knife Pro review</title>
  </head>
  <body>
    <div typeof="schema:Product">
      <div property="schema:name" content="Cheese Knife Pro review"></div>
        <div rel="schema:review">
          <div typeof="schema:Review">
            <div rel="schema:positiveNotes">
              <div typeof="schema:ItemList">
                <div rel="schema:itemListElement">
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="1"></div>
                    <div property="schema:name" content="Consistent results"></div>
                  </div>
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="2"></div>
                    <div property="schema:name" content="Still sharp after many uses"></div>
                  </div>
                </div>
              </div>
            </div>
            <div rel="schema:negativeNotes">
              <div typeof="schema:ItemList">
                <div rel="schema:itemListElement">
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="1"></div>
                    <div property="schema:name" content="No child protection"></div>
                  </div>
                  <div typeof="schema:ListItem">
                    <div property="schema:position" content="2"></div>
                    <div property="schema:name" content="Lacking advanced features"></div>
                  </div>
                </div>
              </div>
            </div>
            <div rel="schema:author">
              <div typeof="schema:Person">
                <div property="schema:name" content="Pascal Van Cleeff"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </body>
</html>
```

#### 微数据

     <html>
  <head>
    <title>Cheese Knife Pro review</title>
  </head>
  <body>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="name" content="Cheese Knife Pro" />
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Pascal Van Cleeff" />
        </div>
        <div itemprop="positiveNotes" itemtype="https://schema.org/ItemList" itemscope>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="1" />
            <meta itemprop="name" content="Consistent results" />
          </div>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="2" />
            <meta itemprop="name" content="Still sharp after many uses" />
          </div>
        </div>
        <div itemprop="negativeNotes" itemtype="https://schema.org/ItemList" itemscope>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="1" />
            <meta itemprop="name" content="No child protection" />
          </div>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="2" />
            <meta itemprop="name" content="Lacking advanced features" />
          </div>
        </div>
      </div>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Cheese Knife Pro review</title>
  </head>
  <body>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="name" content="Cheese Knife Pro" />
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Pascal Van Cleeff" />
        </div>
        <div itemprop="positiveNotes" itemtype="https://schema.org/ItemList" itemscope>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="1" />
            <meta itemprop="name" content="Consistent results" />
          </div>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="2" />
            <meta itemprop="name" content="Still sharp after many uses" />
          </div>
        </div>
        <div itemprop="negativeNotes" itemtype="https://schema.org/ItemList" itemscope>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="1" />
            <meta itemprop="name" content="No child protection" />
          </div>
          <div itemprop="itemListElement" itemtype="https://schema.org/ListItem" itemscope>
            <meta itemprop="position" content="2" />
            <meta itemprop="name" content="Lacking advanced features" />
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
```

### 购物信息汇总网站页面

下面是一个购物信息汇总网站页面的示例，用于演示搜索结果中商品摘要的处理方式。

#### JSON-LD

    <html>
  <head>
    <title>Executive Anvil</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Executive Anvil",
        "image": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "description": "Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.",
        "sku": "0446310786",
        "mpn": "925872",
        "brand": {
          "@type": "Brand",
          "name": "ACME"
        },
        "review": {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 4,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "Fred Benson"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": 4.4,
          "reviewCount": 89
        },
        "offers": {
          "@type": "AggregateOffer",
          "offerCount": 5,
          "lowPrice": 119.99,
          "highPrice": 199.99,
          "priceCurrency": "USD"
        }
      }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Executive Anvil</title>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Executive Anvil",
        "image": [
          "https://example.com/photos/1x1/photo.jpg",
          "https://example.com/photos/4x3/photo.jpg",
          "https://example.com/photos/16x9/photo.jpg"
         ],
        "description": "Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height.",
        "sku": "0446310786",
        "mpn": "925872",
        "brand": {
          "@type": "Brand",
          "name": "ACME"
        },
        "review": {
          "@type": "Review",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": 4,
            "bestRating": 5
          },
          "author": {
            "@type": "Person",
            "name": "Fred Benson"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": 4.4,
          "reviewCount": 89
        },
        "offers": {
          "@type": "AggregateOffer",
          "offerCount": 5,
          "lowPrice": 119.99,
          "highPrice": 199.99,
          "priceCurrency": "USD"
        }
      }
    </script>
  </head>
  <body>
  </body>
</html>
```

#### RDFa

     <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div typeof="schema:Product">
      <div rel="schema:review">
        <div typeof="schema:Review">
          <div rel="schema:reviewRating">
            <div typeof="schema:Rating">
              <div property="schema:ratingValue" content="4"></div>
              <div property="schema:bestRating" content="5"></div>
            </div>
          </div>
          <div rel="schema:author">
            <div typeof="schema:Person">
              <div property="schema:name" content="Fred Benson"></div>
            </div>
          </div>
        </div>
      </div>
      <div rel="schema:aggregateRating">
        <div typeof="schema:AggregateRating">
          <div property="schema:reviewCount" content="89"></div>
          <div property="schema:ratingValue" content="4.4"></div>
        </div>
      </div>
      <div rel="schema:image" resource="https://example.com/photos/4x3/photo.jpg"></div>
      <div property="schema:mpn" content="925872"></div>
      <div property="schema:name" content="Executive Anvil"></div>
      <div property="schema:description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height."></div>
      <div rel="schema:image" resource="https://example.com/photos/1x1/photo.jpg">
      </div>
      <div rel="schema:brand">
        <div typeof="schema:Brand">
          <div property="schema:name" content="ACME"></div>
        </div>
      </div>
      <div rel="schema:offers">
        <div typeof="schema:AggregateOffer">
          <div property="schema:offerCount" content="5"></div>
          <div property="schema:lowPrice" content="119.99"></div>
          <div property="schema:highPrice" content="199.99"></div>
          <div property="schema:priceCurrency" content="USD"></div>
          <div rel="schema:url" resource="https://example.com/anvil"></div>
        </div>
      </div>
      <div rel="schema:image" resource="https://example.com/photos/16x9/photo.jpg"></div>
      <div property="schema:sku" content="0446310786"></div>
    </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
    <div typeof="schema:Product">
      <div rel="schema:review">
        <div typeof="schema:Review">
          <div rel="schema:reviewRating">
            <div typeof="schema:Rating">
              <div property="schema:ratingValue" content="4"></div>
              <div property="schema:bestRating" content="5"></div>
            </div>
          </div>
          <div rel="schema:author">
            <div typeof="schema:Person">
              <div property="schema:name" content="Fred Benson"></div>
            </div>
          </div>
        </div>
      </div>
      <div rel="schema:aggregateRating">
        <div typeof="schema:AggregateRating">
          <div property="schema:reviewCount" content="89"></div>
          <div property="schema:ratingValue" content="4.4"></div>
        </div>
      </div>
      <div rel="schema:image" resource="https://example.com/photos/4x3/photo.jpg"></div>
      <div property="schema:mpn" content="925872"></div>
      <div property="schema:name" content="Executive Anvil"></div>
      <div property="schema:description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height."></div>
      <div rel="schema:image" resource="https://example.com/photos/1x1/photo.jpg">
      </div>
      <div rel="schema:brand">
        <div typeof="schema:Brand">
          <div property="schema:name" content="ACME"></div>
        </div>
      </div>
      <div rel="schema:offers">
        <div typeof="schema:AggregateOffer">
          <div property="schema:offerCount" content="5"></div>
          <div property="schema:lowPrice" content="119.99"></div>
          <div property="schema:highPrice" content="199.99"></div>
          <div property="schema:priceCurrency" content="USD"></div>
          <div rel="schema:url" resource="https://example.com/anvil"></div>
        </div>
      </div>
      <div rel="schema:image" resource="https://example.com/photos/16x9/photo.jpg"></div>
      <div property="schema:sku" content="0446310786"></div>
    </div>
  </body>
</html>
```

#### 微数据

     <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
  <div>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="mpn" content="925872" />
      <meta itemprop="name" content="Executive Anvil" />
      <link itemprop="image" href="https://example.com/photos/16x9/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/4x3/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/1x1/photo.jpg" />
      <meta itemprop="description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height." />
      <div itemprop="offers" itemtype="https://schema.org/AggregateOffer" itemscope>
        <meta itemprop="lowPrice" content="119.99" />
        <meta itemprop="highPrice" content="199.99" />
        <meta itemprop="offerCount" content="6" />
        <meta itemprop="priceCurrency" content="USD" />
      </div>
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <meta itemprop="ratingValue" content="4.4" />
      </div>
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Fred Benson" />
        </div>
        <div itemprop="reviewRating" itemtype="https://schema.org/Rating" itemscope>
          <meta itemprop="ratingValue" content="4" />
          <meta itemprop="bestRating" content="5" />
        </div>
      </div>
      <meta itemprop="sku" content="0446310786" />
      <div itemprop="brand" itemtype="https://schema.org/Brand" itemscope>
        <meta itemprop="name" content="ACME" />
      </div>
    </div>
  </div>
  </body>
</html>

```
 <html>
  <head>
    <title>Executive Anvil</title>
  </head>
  <body>
  <div>
    <div itemtype="https://schema.org/Product" itemscope>
      <meta itemprop="mpn" content="925872" />
      <meta itemprop="name" content="Executive Anvil" />
      <link itemprop="image" href="https://example.com/photos/16x9/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/4x3/photo.jpg" />
      <link itemprop="image" href="https://example.com/photos/1x1/photo.jpg" />
      <meta itemprop="description" content="Sleeker than ACME's Classic Anvil, the Executive Anvil is perfect for the business traveler looking for something to drop from a height." />
      <div itemprop="offers" itemtype="https://schema.org/AggregateOffer" itemscope>
        <meta itemprop="lowPrice" content="119.99" />
        <meta itemprop="highPrice" content="199.99" />
        <meta itemprop="offerCount" content="6" />
        <meta itemprop="priceCurrency" content="USD" />
      </div>
      <div itemprop="aggregateRating" itemtype="https://schema.org/AggregateRating" itemscope>
        <meta itemprop="reviewCount" content="89" />
        <meta itemprop="ratingValue" content="4.4" />
      </div>
      <div itemprop="review" itemtype="https://schema.org/Review" itemscope>
        <div itemprop="author" itemtype="https://schema.org/Person" itemscope>
          <meta itemprop="name" content="Fred Benson" />
        </div>
        <div itemprop="reviewRating" itemtype="https://schema.org/Rating" itemscope>
          <meta itemprop="ratingValue" content="4" />
          <meta itemprop="bestRating" content="5" />
        </div>
      </div>
      <meta itemprop="sku" content="0446310786" />
      <div itemprop="brand" itemtype="https://schema.org/Brand" itemscope>
        <meta itemprop="name" content="ACME" />
      </div>
    </div>
  </div>
  </body>
</html>
```

## 指南

为确保您的 Product 标记符合商品摘要的条件，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)
- [内容指南](#content-guidelines)

### 技术指南

- 目前，商品富媒体搜索结果仅支持介绍单件商品（或同一商品的多个款式/规格）的网页。
      例如，“我们店里的鞋子”就不是具体商品。
    这包括[使用不同网址的各个商品款式/规格的网页](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites?hl=zh-cn#how-google-understands-urls-for-product-variants)。
    我们建议您重点向商品页面（而不是商品列表页面或商品类别页面）添加标记。
- 如需详细了解如何标记商品款式/规格，请参阅[商品款式/规格结构化数据文档](https://developers.google.com/search/docs/appearance/structured-data/product-variants?hl=zh-cn)。
- 以多种货币销售商品时，应针对每种货币设置不同的网址。
    例如，如果某件商品以加元和美元销售，请针对每种货币分别使用不同的网址。
- 系统不支持将 [Car](https://schema.org/Car) 自动作为 Product 的子类型。目前您需要添加 [Car](https://schema.org/Car) 和 [Product](https://schema.org/Product) 两个类型，才能为其添加评分并符合搜索结果功能的资格要求。例如，采用 JSON-LD 格式：

```
{
  "@context": "https://schema.org",
  "@type": ["Product", "Car"],
  ...
}
```
- **对于[优缺点](#pros-cons)结构化数据**：只有商品测评类评价页面符合在 Google 搜索中呈现优缺点的条件，商家商品页面或客户商品评价都不符合条件。
- 如果您是针对所有类型的购物搜索结果进行优化的商家，我们建议将 Product 结构化数据放在初始 HTML 中，以便取得最佳效果。
- **对于由 JavaScript 生成的 Product 标记**：请注意，[动态生成的标记](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)可能会导致购物内容抓取频率降低且不太可靠，这可能会对商品库存状况和价格等快速变化的内容造成影响。如果您使用 JavaScript 生成 Product 标记，请确保您的服务器有足够的计算资源来处理来自 Google 的更多流量。

### 内容指南

- 我们不允许发布宣传被广泛禁止或管制的商品、服务或信息的内容，这类内容可能对他人造成严重立即伤害或长期伤害。这包括与枪支和武器、消遣性药物、烟草和电子烟商品以及赌博相关商品有关的内容。

## 不同结构化数据类型的定义

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需的属性。您还可以添加建议的属性，以便向结构化数据添加更多信息，进而提供更好的用户体验。

### Product

如需了解 Product 的完整定义，请访问 [schema.org/Product](https://schema.org/Product)。针对商品信息标记内容时，请使用 Product 类型的以下属性：

    必要属性

      name

[Text](https://schema.org/Text)

商品名称。

      商品摘要需要 review、aggregateRating 或 offers

您必须添加以下属性之一：

- review
- aggregateRating
- offers

              您只需提供 review、aggregateRating 和 offers 其中之一，但如果您提供了不含 review 或 aggregateRating 属性的 offers，富媒体搜索结果测试的商品摘要部分可能会显示警告。

    建议属性

      aggregateRating

[AggregateRating](https://schema.org/AggregateRating)

嵌套形式的商品 aggregateRating。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看 [AggregateRating](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#aggregated-rating-type-definition) 的必要属性和建议属性列表。

      offers

[Offer](https://schema.org/Offer) 或 [AggregateOffer](https://schema.org/AggregateOffer)

用于销售商品的嵌套 Offer 或 AggregateOffer。请根据您的内容为 [Offer](#offer-properties) 或 [AggregateOffer](#aggregate-offer-properties) 添加必要属性和建议属性。

                若要符合[降价增强功能](https://developers.google.com/search/docs/appearance/structured-data/product?hl=zh-cn#price-drop)的条件，请使用 [Offer](#offer-properties)，而非 AggregateOffer。

      review

[Review](https://schema.org/Review)

嵌套形式的商品 Review。请遵循[评价摘要指南](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#guidelines)，并查看[评价属性](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn#review-properties)的必要属性和建议属性列表。

如果您要为商品添加评价，则评价者的名称必须是指代 Person 或 Team 的有效名称。

不建议使用的名称**：黑色星期五半价优惠

**建议使用的名称**：“James Smith”或“CNET 评价员”

          如需手动告知 Google 商品测评类评价页面中的[优缺点](#pros-cons)，请将 positiveNotes 和/或 negativeNotes 属性添加到嵌套的商品评价中。

### 产品评论

#### Review

  由于评价由多种结构化数据类型（例如 [Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn) 和 [Movie](https://developers.google.com/search/docs/appearance/structured-data/movie?hl=zh-cn)）共享，因此[评价摘要文档](https://developers.google.com/search/docs/appearance/structured-data/review-snippet?hl=zh-cn)中单独介绍了 Review 类型。

  以下属性是 Review 类型的附加属性，可帮助用户简要了解商品测评类评价的优缺点。
        优缺点适用于所有可以使用 Google 搜索的国家/地区，可在荷兰语、英语、法语、德语、意大利语、日语、波兰语、葡萄牙语、西班牙语和土耳其语的搜索内容中呈现。

  虽然 Google 会尝试自动了解商品测评类评价中的优缺点，但您可以通过向嵌套形式的商品评价中添加 positiveNotes 和/或 negativeNotes 属性来明确提供这些信息。请务必遵循[优缺点指南](#pros-cons-guidelines)。

  必要属性

      关于商品的两条说明
      您必须提供至少两条关于商品的肯定或否定组合语句说明（例如，包含两个肯定语句的 ItemList 标记是有效的）：

- [negativeNotes](#negative-notes)
- [positiveNotes](#positive-notes)

  建议属性

      negativeNotes

[ItemList](https://schema.org/ItemList)
                （如需了解此属性中 ItemList 的用法，请参阅[用于正面和负面评价语句的 ItemList](#pros-cons-item-list)）

          （可选）有关商品的负面评价（缺点）的嵌套列表。

          如需列出多个缺点语句，请在 itemListElement 数组中指定多个 ListItem 属性。例如：

```
"review": {
  "@type": "Review",
  "negativeNotes": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "No child protection"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Lacking advanced features"
      }
    ]
  }
}
```

    positiveNotes

[ItemList](https://schema.org/ItemList)
                （如需了解此属性中 ItemList 的用法，请参阅[用于正面和负面评价语句的 ItemList](#pros-cons-item-list)）

        （可选）有关商品的正面评价（优点）的嵌套列表。

        如需列出多个优点语句，请在 itemListElement 数组中指定多个 ListItem 属性。例如：

```
"review": {
  "@type": "Review",
  "positiveNotes": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Consistent results"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Still sharp after many uses"
      }
    ]
  }
}
```

#### 用于正面和负面评价语句的 ItemList

  Review 类型中的正面和负面评价语句（优缺点）使用通用的 ItemList 和 ListItem 类型。
    本部分将介绍如何将这些类型用于正面和负面评价语句。

  以下属性用于捕获评价中的优缺点。

  必要属性

      itemListElement

[ListItem](https://schema.org/ListItem)

          一组描述商品优点的语句，按特定顺序列出。
          使用 ListItem 指定每个语句。

      itemListElement.name

[Text](https://schema.org/Text)

          评价的关键语句。

  建议属性

      itemListElement.position

[Integer](https://schema.org/Integer)

          评价的位置。位置 1 表示列表中的第一个语句。

### Offer 详情

#### Offer

如需了解 Offer 的完整定义，请访问 [schema.org/Offer](https://schema.org/Offer)。在商品中标记出价时，请使用 schema.org [Offer](https://schema.org/Offer) 类型的以下属性。

  必要属性

      price 或 priceSpecification.price

[Number](https://schema.org/Number)

商品的出价价格。请遵循 [schema.org 使用指南](https://schema.org/price)。

下面是一个 price 属性示例（值可以是 JSON 字符串或数字）：

```
"offers": {
  "@type": "Offer",
  "price": 39.99,
  "priceCurrency": "USD"
}
```

          下面的示例说明了如何指定商品是免费商品：

```
"offers": {
  "@type": "Offer",
  "price": 0,
  "priceCurrency": "EUR"
}
```

          或者，出价价格可以嵌套在 priceSpecification 属性中，而不是在 Offer 级别提供。

```
"offers": {
  "@type": "Offer",
  "priceSpecification": {
    "@type": "PriceSpecification",
    "price": 9.99,
    "priceCurrency": "AUD"
  }
}
```

    如果您选择同时使用 offers.price 和 offers.priceSpecification 属性，且两者之间存在冲突（例如，price 或 priceCurrency 不同），Google 将使用在 offers.price 级别提供的价格信息。

        如果您的价格较为复杂，请查看商家信息文档中的[价格示例](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#pricing-example)和支持的[价格属性](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing?hl=zh-cn#offer-details)。

  建议属性

      availability

[ItemAvailability](https://schema.org/ItemAvailability)

请从以下列表中选择一种最合适的商品库存状况选项。

- https://schema.org/BackOrder：商品延期交货
- https://schema.org/Discontinued：商品已停售。
- https://schema.org/InStock：商品有货。
- https://schema.org/InStoreOnly：商品只能在实体店内购买。
- https://schema.org/LimitedAvailability：商品库存有限。
- https://schema.org/OnlineOnly：商品只能在线购买。
- https://schema.org/OutOfStock：商品当前缺货。
- https://schema.org/PreOrder：商品可供预订。
- https://schema.org/PreSale：商品在全面发售之前可订购并发货。
- https://schema.org/SoldOut：商品已售罄。

系统也支持不带网址前缀的简称（例如 BackOrder）。

      priceCurrency 或 priceSpecification.priceCurrency

[Text](https://schema.org/Text)

用于描述商品价格的货币，采用由三个字母表示的 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。

目前，建议将此属性用于商品摘要，以帮助 Google 更准确地确定币种；对于商家信息体验，此属性为必要属性。
                因此，最好始终提供此属性。

      priceValidUntil

[Date](https://schema.org/Date)

价格的失效日期（若适用）（采用 [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) 日期格式）。如果 priceValidUntil 属性是一个过去的日期，商品摘要可能就不会显示。

#### UnitPriceSpecification

  如需了解 UnitPriceSpecification 的完整定义，请访问 [schema.org/UnitPriceSpecification](https://schema.org/UnitPriceSpecification)。
  请使用以下属性捕获更复杂的价格方案。

  必要属性

      price

[Number](https://schema.org/Number)

          商品的出价价格。另请参阅 Offer 的 price 属性。

  建议属性

      priceCurrency

[Text](https://schema.org/Text)

用于描述商品价格的货币，采用由三个字母表示的 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。
          另请参阅 Offer 的 priceCurrency 属性。

虽然此属性对于商品摘要是可选的，但强烈建议您使用，因为它可以避免价格歧义，并且对于商家信息体验而言是必需的。

#### AggregateOffer

  如需了解 AggregateOffer 的完整定义，请访问 [schema.org/AggregateOffer](https://schema.org/AggregateOffer)。
  AggregateOffer 是一种 Offer，代表其他出价的汇总。例如，它可以用于由多个商家销售的商品。
  请勿使用 AggregateOffer 来描述一组商品款式/规格。在商品中标记出价汇总时，请使用 schema.org [AggregateOffer](https://schema.org/AggregateOffer) 类型的以下属性：

  必要属性

      lowPrice

[Number](https://schema.org/Number)

          所有有效出价中的最低价格。在表示货币单位的小数时，请使用小数分隔符 (.)，例如，1.23 表示 1.23 美元。

      priceCurrency

[Text](https://schema.org/Text)

用于描述商品价格的货币，采用由三个字母表示的 [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) 格式。

  建议属性

      highPrice

[Number](https://schema.org/Number)

所有有效出价中的最高价格。视需要使用浮点数。

      offerCount

[Number](https://schema.org/Number)

商品的出价数量。

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

      有两种与 Product 结构化数据相关的 Search Console 报告：

- **[商家信息报告](https://search.google.com/search-console/r/merchant-listings?hl=zh-cn)**：适用于买家可以购买商品的页面。
- **[商品摘要报告](https://search.google.com/search-console/r/product?hl=zh-cn)**：适用于其他商品相关页面，例如商品评价和聚合信息网站。

      这两种报告都会提供与 Product 结构化数据相关的警告和错误，但由于关联的体验的要求不同，两者是独立的。例如，[商家信息报告](https://search.google.com/search-console/r/merchant-listings?hl=zh-cn)会对包含 Offer 结构化数据的商品摘要进行检查，所以对于非商家信息页面，只需查看[商品摘要](https://search.google.com/search-console/r/product?hl=zh-cn)报告。

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