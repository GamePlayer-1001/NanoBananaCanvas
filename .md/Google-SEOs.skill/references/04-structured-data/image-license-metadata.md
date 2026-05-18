# Google 图片搜索引擎优化 (SEO)：图片元数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata?hl=zh-cn

---

  # Google 图片中的图片元数据

  指定图片元数据后，Google 图片可以显示有关图片的更多详细信息，例如创作者是谁、用户可以如何使用图片以及版权归属信息。例如，提供许可信息可让图片符合“可获授权”标志的条件，这样可以提供许可链接并更详细地说明用户可以如何使用该图片。

## 
  功能可用性

    此功能适用于移动设备和桌面设备以及所有可以使用 Google 搜索的区域和 Google 搜索支持的所有语言。

## 
  准备网页和图片

  为了确保 Google 能够发现您的图片并将其编入索引：

- 确保用户无需账号或登录即可访问和查看您的图片所在的网页。
- 确保 Googlebot 能够访问您的图片所在的网页（即 robots.txt 文件或 robots meta 标记不会禁止 Googlebot 访问这些网页）。您可以在[“网页索引编制”报告](https://support.google.com/webmasters/answer/7440203?hl=zh-cn)中查看您的网站上被阻止的所有网页，也可以使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试特定网页。
- 遵循 [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn) 要求，确保 Google 能够发现您的内容。
- 遵循[图片搜索引擎优化 (SEO) 最佳实践](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn)。
- 为了让 Google 随时了解发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。[Search Console Sitemap API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

## 
  添加结构化数据或 IPTC 照片元数据

  若要让 Google 了解您的图片元数据，请向您网站上的每张图片添加结构化数据或 IPTC 照片元数据。如果您在多个网页上有相同的图片，请为每个网页上的每张该图片添加结构化数据或 IPTC 照片元数据。

  您可以通过两种方式向图片添加照片元数据。您只需向 Google 提供一种形式的信息，即可使图片满足“可获授权”标志等增强功能的条件，并且采用以下任一方法都可以：

- [结构化数据](#structured-data)：结构化数据是指图片与显示该图片（带有相应标记）的网页之间的关联。您需要为某个图片所在的每个网页添加结构化数据，即使使用的是同一张图片。
- [IPTC 照片元数据](#iptc-photo-metadata)：IPTC 照片元数据已嵌入到图片内，图片置入不同网页时，该元数据依然保持不变。您只需为每张图片嵌入一次 IPTC 照片元数据。

  如果您选择同时使用 IPTC 照片元数据和结构化数据，一旦两者之间存在任何信息冲突，Google 将使用结构化数据信息。

  以下图表显示了许可信息在 Google 图片中的显示方式：

1. 此网址指向的网页描述了管理图片使用情况的许可。请使用 Schema.org license 属性或 IPTC Web Statement of Rights 字段指定此信息。
2. 此网址指向的网页说明了用户可在何处找到如何就该图片获取许可的信息。请使用 Schema.org acquireLicensePage 属性或（某位 [Licensor](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#licensor) 的）IPTC Licensor URL 字段指定此信息。

### 
  结构化数据

  若要让 Google 了解您的图片元数据，一种方法是添加结构化数据字段。结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

  下面概述了如何构建、测试和发布结构化数据。

1. 添加[必要属性](#structured-data-type-definitions)。根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
    **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
2. 遵循[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。
3. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码。
4. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
    Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
5. 为了让 Google 随时了解日后发生的更改，我们建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn)。
    [Search Console Sitemap API](https://developers.google.com/webmaster-tools/search-console-api-original/v3/sitemaps?hl=zh-cn) 可以帮助您自动执行此操作。

#### 
  示例

##### 
  单张图片

  下面是一个包含单张图片的网页示例。

### 
      JSON-LD

    <html>
  <head>
    <title>Black labrador puppy</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/black-labrador-puppy.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }
    </script>
  </head>
  <body>
    <img alt="Black labrador puppy" src="https://example.com/photos/1x1/black-labrador-puppy.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/black-labrador-puppy.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }
    </script>
  </head>
  <body>
    <img alt="Black labrador puppy" src="https://example.com/photos/1x1/black-labrador-puppy.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>
```

### 
    RDFa

    <html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
  <div vocab="https://schema.org/" typeof="ImageObject">
    <img alt="Black labrador puppy" property="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" /><br>
    <span property="license"> https://example.com/license</span><br>
    <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
    <span rel="schema:creator">
      <span typeof="schema:Person">
        <span property="schema:name" content="Brixton Brownstone"></span>
      </span>
    </span>
    <span property="copyrightNotice">Clara Kent</span><br>
    <span property="creditText">Labrador PhotoLab</span><br>
  </div>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
  <div vocab="https://schema.org/" typeof="ImageObject">
    <img alt="Black labrador puppy" property="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" /><br>
    <span property="license"> https://example.com/license</span><br>
    <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
    <span rel="schema:creator">
      <span typeof="schema:Person">
        <span property="schema:name" content="Brixton Brownstone"></span>
      </span>
    </span>
    <span property="copyrightNotice">Clara Kent</span><br>
    <span property="creditText">Labrador PhotoLab</span><br>
  </div>
  </body>
</html>
```

### 
      微数据

    <html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <img alt="Black labrador puppy" itemprop="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" />
      <span itemprop="license"> https://example.com/license</span><br>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <img alt="Black labrador puppy" itemprop="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" />
      <span itemprop="license"> https://example.com/license</span><br>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>
```

##### 
  srcset 标记中有单张图片

  下面是一个在 srcset 标记中包含单张图片的网页示例。

### 
      JSON-LD

    <html>
  <head>
    <title>Black labrador puppy</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/320/black-labrador-puppy-800w.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }
    </script>
  </head>
  <body>
    <img srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy"><br>
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/320/black-labrador-puppy-800w.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }
    </script>
  </head>
  <body>
    <img srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy"><br>
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>
```

### 
      RDFa

    <html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <img property="contentUrl"
           srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy">
      <span property="license">https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
   </div>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <img property="contentUrl"
           srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy">
      <span property="license">https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
   </div>
  </body>
</html>
```

### 
      微数据

    <html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <img itemprop="contentUrl"
           srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy">
      <span itemprop="license">https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
   </div>
  </body>
</html>

```
<html>
  <head>
    <title>Black labrador puppy</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <img itemprop="contentUrl"
           srcset="https://example.com/photos/320/black-labrador-puppy-320w.jpg 320w,
                   https://example.com/photos/480/black-labrador-puppy-480w.jpg 480w,
                   https://example.com/photos/800/black-labrador-puppy-800w.jpg 800w"
           sizes="(max-width: 320px) 280px,
                  (max-width: 480px) 440px,
                  800px"
           src="https://example.com/photos/320/black-labrador-puppy-800w.jpg"
           alt="Black labrador puppy">
      <span itemprop="license">https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
   </div>
  </body>
</html>
```

##### 
  网页上有多张图片

  下面是一个包含多张图片的网页示例。

### 
      JSON-LD

    <html>
  <head>
    <title>Photos of black labradors</title>
    <script type="application/ld+json">
    [{
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/black-labrador-puppy.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    },
   {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/adult-black-labrador.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }]
    </script>
  </head>
  <body>
    <h2>Black labrador puppy</h2>
    <img alt="Black labrador puppy" src="https://example.com/photos/1x1/black-labrador-puppy.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
    <h2>Adult black labrador</h2>
    <img alt="Adult black labrador" src="https://example.com/photos/1x1/adult-black-labrador.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>

```
<html>
  <head>
    <title>Photos of black labradors</title>
    <script type="application/ld+json">
    [{
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/black-labrador-puppy.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    },
   {
      "@context": "https://schema.org/",
      "@type": "ImageObject",
      "contentUrl": "https://example.com/photos/1x1/adult-black-labrador.jpg",
      "license": "https://example.com/license",
      "acquireLicensePage": "https://example.com/how-to-use-my-images",
      "creditText": "Labrador PhotoLab",
      "creator": {
        "@type": "Person",
        "name": "Brixton Brownstone"
       },
      "copyrightNotice": "Clara Kent"
    }]
    </script>
  </head>
  <body>
    <h2>Black labrador puppy</h2>
    <img alt="Black labrador puppy" src="https://example.com/photos/1x1/black-labrador-puppy.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
    <h2>Adult black labrador</h2>
    <img alt="Adult black labrador" src="https://example.com/photos/1x1/adult-black-labrador.jpg">
    <p><a href="https://example.com/license">License</a></p>
    <p><a href="https://example.com/how-to-use-my-images">How to use my images</a></p>
    <p><b>Photographer</b>: Brixton Brownstone</p>
    <p><b>Copyright</b>: Clara Kent</p>
    <p><b>Credit</b>: Labrador PhotoLab</p>
  </body>
</html>
```

### 
      RDFa

    <html>
  <head>
    <title>Photos of black labradors</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <h2 property="name">Black labrador puppy</h2>
      <img alt="Black labrador puppy" property="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" /><br>
      <span property="license"> https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
    </div>
    <br>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <h2 property="name">Adult black labrador</h2>
      <img alt="Adult black labrador" property="contentUrl" src="https://example.com/photos/1x1/adult-black-labrador.jpg" />
      <span property="license"> https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>

```
<html>
  <head>
    <title>Photos of black labradors</title>
  </head>
  <body>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <h2 property="name">Black labrador puppy</h2>
      <img alt="Black labrador puppy" property="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" /><br>
      <span property="license"> https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
    </div>
    <br>
    <div vocab="https://schema.org/" typeof="ImageObject">
      <h2 property="name">Adult black labrador</h2>
      <img alt="Adult black labrador" property="contentUrl" src="https://example.com/photos/1x1/adult-black-labrador.jpg" />
      <span property="license"> https://example.com/license</span>
      <span property="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span rel="schema:creator">
        <span typeof="schema:Person">
          <span property="schema:name" content="Brixton Brownstone"></span>
        </span>
      </span>
      <span property="copyrightNotice">Clara Kent</span>
      <span property="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>
```

### 
      微数据

    <html>
  <head>
    <title>Photos of black labradors</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <h2 itemprop="name">Black labrador puppy</h2>
      <img alt="Black labrador puppy" itemprop="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" />
      <span itemprop="license"> https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span><br>
      <span itemprop="creditText">Labrador PhotoLab</span><br>
    </div>
    <br>
      <h2 itemprop="name">Adult black labrador</h2>
      <div itemscope itemtype="https://schema.org/ImageObject">
      <img alt="Adult black labrador" itemprop="contentUrl" src="https://example.com/photos/1x1/adult-black-labrador.jpg" />
      <span itemprop="license"> https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>

```
<html>
  <head>
    <title>Photos of black labradors</title>
  </head>
  <body>
    <div itemscope itemtype="https://schema.org/ImageObject">
      <h2 itemprop="name">Black labrador puppy</h2>
      <img alt="Black labrador puppy" itemprop="contentUrl" src="https://example.com/photos/1x1/black-labrador-puppy.jpg" />
      <span itemprop="license"> https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span><br>
      <span itemprop="creditText">Labrador PhotoLab</span><br>
    </div>
    <br>
      <h2 itemprop="name">Adult black labrador</h2>
      <div itemscope itemtype="https://schema.org/ImageObject">
      <img alt="Adult black labrador" itemprop="contentUrl" src="https://example.com/photos/1x1/adult-black-labrador.jpg" />
      <span itemprop="license"> https://example.com/license</span>
      <span itemprop="acquireLicensePage">https://example.com/how-to-use-my-images</span>
      <span itemprop="creator" itemtype="https://schema.org/Person" itemscope>
        <meta itemprop="name" content="Brixton Brownstone" />
      </span>
      <span itemprop="copyrightNotice">Clara Kent</span>
      <span itemprop="creditText">Labrador PhotoLab</span>
    </div>
  </body>
</html>
```

#### 
  结构化数据类型定义

  如需了解 ImageObject 的完整定义，请访问 [schema.org/ImageObject](https://schema.org/ImageObject)。
    Google 支持的属性如下：

    必要属性

      contentUrl

[URL](https://schema.org/URL)

          指向实际图片内容的网址。Google 使用 contentUrl 来确定照片元数据适用的图片。

            如果您未添加 contentUrl，Google 还支持使用 url 属性指定图片网址。虽然 url 属性不太精确，我们建议您改用 contentUrl，但现有标记仍然可以使用 url。

      creator、creditText、copyrightNotice 或 license

除了 contentUrl 之外，您还必须添加以下属性之一：

- [creator](#creator-sd)
- [creditText](#credit-sd)
- [copyrightNotice](#copyright-sd)
- [license](#license-sd)

          一旦添加了上述某个属性，其余三个属性在富媒体搜索结果测试中就会变为建议添加的属性。

    建议属性

      acquireLicensePage

[URL](https://schema.org/URL)

          此网址指向的网页说明了用户可在何处找到如何就该图片获取许可的信息。下面是一些示例：

- 该图片的结账网页，用户可在其中选择特定的分辨率或使用权限
- 介绍如何与您联系的常规网页

      creator

[Organization](https://schema.org/Organization) 或 [Person](https://schema.org/Person)

          图片的创作者。通常是摄影师，但也可能是公司或组织（如果适用）。

      creator.name

[Text](https://schema.org/Text)

          创作者的名称。

      creditText

[Text](https://schema.org/Text)

          图片发布后标注的出处人员和/或组织的名称。

      copyrightNotice

[Text](https://schema.org/Text)

          用于声明此照片的知识产权的版权通知。用于标识照片的当前版权所有者。

      license

[URL](https://schema.org/URL)

          此网址指向的网页描述了管理图片使用情况的许可。例如，可能是您网站上的条款及条件。在适用情况下，还可能是知识共享许可（例如，[BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)）。

            如果您使用结构化数据指定图片，您必须为图片添加 license 属性，才能使其在显示时带有“可获授权”标志。如果您掌握了相关信息，我们还建议您添加 acquireLicensePage 属性。

### IPTC 照片元数据

  或者，您可以直接在图片中嵌入 [IPTC 照片元数据](https://iptc.org/standards/photo-metadata/iptc-standard/)。我们建议您使用[元数据管理软件管理图片元数据](https://iptc.org/standards/photo-metadata/software-support/)。下表包含 Google 提取的属性：

    建议属性

        [版权通知](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#copyright-notice)

          用于声明此照片的知识产权的版权通知。用于标识照片的当前版权所有者。

        [创作者](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#creator)

          图片的创作者。通常是摄影师的姓名，但也可以是公司或组织的名称（如果适用）。

        [出处](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#credit-line)

            图片发布后标注的出处人员和/或组织的名称。

        [数字来源类型](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#digital-source-type)

            用于创建图片的数字来源的类型。Google 支持以下 IPTC NewsCodes：

- [trainedAlgorithmicMedia](https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia)：图片是使用衍生自采样内容的模型通过算法创建的。
- [compositeSynthetic](https://cv.iptc.org/newscodes/digitalsourcetype/compositeSynthetic)：图片是包含至少一个合成元素的混合或复合图片。
- [algorithmicMedia](https://cv.iptc.org/newscodes/digitalsourcetype/algorithmicMedia)：图片完全是由算法不根据任何采样训练数据创建的（例如，由软件使用数学公式创建的图片）。
- [compositeWithTrainedAlgorithmicMedia](https://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia)：图片是经过训练的算法媒体与某些其他媒体（例如，包含内绘或外绘操作）的组合。

        [Licensor URL](http://ns.useplus.org/LDF/ldf-XMPSpecification#LicensorURL)

          此网址指向的网页说明了用户可在何处找到如何就该图片获取许可的信息。[Licensor URL](http://ns.useplus.org/LDF/ldf-XMPSpecification#LicensorURL) 必须是 [Licensor 对象](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#licensor)的属性，而不是图片对象的属性。下面是一些示例：

- 该图片的结账网页，用户可在其中选择特定的分辨率
- 介绍如何与您联系的常规网页

        [Web Statement of Rights](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#web-statement-of-rights)

          此网址指向的网页描述了管理图片使用情况的许可，以及可选的其他权利信息。例如，可能是您网站上的条款及条件。在适用情况下，还可能是知识共享许可（例如，[BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)）。

          您必须添加 Web Statement of Rights 字段，您的图片显示时才会带有“可获授权”标志。如果您掌握了相关信息，我们还建议您添加 Licensor URL 字段。

### C2PA 元数据如何在 Google 搜索结果中显示

  如果图片包含 [C2PA](https://c2pa.org/specifications/) 元数据，Google 可以提取这些详细信息，并可能会在“[关于此图片](https://support.google.com/websearch/answer/14177408?hl=zh-cn)”功能中显示相关信息，例如图片的创建方式或是否使用 AI 工具编辑过。
  此元数据来自[签名者](https://c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html#signer-definition)，签名者通常是满足以下条件的应用、设备或服务（例如，照片编辑软件、相机本身或修改或创建图片的其他服务）：

- 应用、设备或服务采用了 C2PA 2.1 版或更高版本。
- 图片的清单必须经由 [C2PA 信任列表](https://c2pa.org/specifications/specifications/2.1/specs/C2PA_Specification.html#_c2pa_trust_list)中认可的证书授权机构所颁发的证书进行签名。

## 问题排查

重要提示**：Google 不能保证结构化数据或 IPTC 照片元数据一定会显示在搜索结果中。如需查看导致 Google 无法将结构化数据显示在搜索结果中的各种常见原因，请参阅[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)。

  如果您在 Google 图片中实施图片元数据时遇到问题，请参阅以下资源。

如果您使用了内容管理系统 (CMS) 或其他人负责管理您的网站，请向他们寻求帮助。请务必向其转发列明问题细节的任何 Search Console 消息。

- 有关此功能的问题，请参阅 [Google 图片中的图片许可常见问题解答](https://support.google.com/webmasters/thread/31516792?hl=zh-cn)。
- 您的结构化数据可能存在错误。请参阅[结构化数据错误列表](https://support.google.com/webmasters/answer/13300873?hl=zh-cn)。
- 如果您的网页受到结构化数据人工处置措施的影响，其中的结构化数据将会被忽略（但该网页仍可能会出现在 Google 搜索结果中）。如需修正[结构化数据问题](https://support.google.com/webmasters/answer/9044175?hl=zh-cn#zippy=,structured-data-issue)，请使用[“人工处置措施”报告](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)。
- 再次查看[指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)，确认您的内容是否未遵循指南。
      问题可能是因为出现垃圾内容或使用垃圾标记导致的。
      不过，问题可能不是语法问题，因此富媒体搜索结果测试无法识别这些问题。
- [针对富媒体搜索结果缺失/富媒体搜索结果总数下降进行问题排查](https://support.google.com/webmasters/answer/13300208?hl=zh-cn)。
- 有关抓取和索引编制的常见问题，请参阅 [Google 搜索抓取和索引编制常见问题解答](https://developers.google.com/search/help/crawling-index-faq?hl=zh-cn)。
  请等待一段时间，以便 Google 重新抓取您的网页并重新将其编入索引。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
- 在 [Google 搜索中心“咨询交流时间”活动](https://developers.google.com/search/help/office-hours?hl=zh-cn)中提问。
- 在 [Google 搜索中心论坛](https://support.google.com/webmasters/community?hl=zh-cn)中发帖提问。
    如需有关 IPTC 照片元数据方面的帮助，您可以[在相应的论坛中发布帖子](https://groups.io/g/iptc-photometadata/)。

## 是否可以移除图片元数据？

移除图片元数据可减小图片文件大小，从而加快网页加载速度。不过请保持谨慎，因为在某些管辖区，移除元数据可能是非法的。图片元数据可在线提供图片版权和许可信息。Google 建议您至少保留与图片权限信息和标识相关的关键元数据。例如，尽可能尝试保留 IPTC 字段[创作者](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#creator)、[图片出处](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#credit-line)和[版权声明](https://iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#copyright-notice)，以注明正确的图片来源。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。