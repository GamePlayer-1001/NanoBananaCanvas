# 如何添加面包屑导航 (BreadcrumbList) 标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb?hl=zh-cn

---

  # 面包屑导航 (BreadcrumbList) 结构化数据

网页上的面包屑导航路径指明了网页在网站层次结构中的位置，有助于用户有效地了解和探索网站。用户可从面包屑导航路径中的最低层级开始，一次一个层级地导航到网站层次结构中的最高层级。

## 功能可用性

此功能适用于桌面设备以及所有可以使用 Google 搜索的区域和 Google 搜索支持的所有语言。

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

Google 搜索使用网页正文中的面包屑导航标记在搜索结果中对来自该网页的信息进行分类。如以下用例所示，用户往往可通过各种不同类型的搜索查询到达同一个网页。虽然每次搜索可能会返回相同的网页，但面包屑导航会根据 Google 搜索查询的上下文对内容进行分类。虚构图书奖获奖者页面可能会使用以下面包屑导航路径：

### 单个面包屑导航路径

如果只有一条面包屑导航路径可以转到该网页，则该网页可以指定以下面包屑导航路径：

[图书](https://www.example.com/books) ›
  [科幻小说](https://www.example.com/books/sciencefiction) ›
  获奖作品

### JSON-LD

下面是支持该面包屑导航的 JSON-LD 示例：

    <html>
  <head>
    <title>Award Winners</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Books",
        "item": "https://example.com/books"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Science Fiction",
        "item": "https://example.com/books/sciencefiction"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "Award Winners"
      }]
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Books",
        "item": "https://example.com/books"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Science Fiction",
        "item": "https://example.com/books/sciencefiction"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "Award Winners"
      }]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

下面是支持该面包屑导航的 RDFa 示例：

        <html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books">
          <span property="name">Books</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction">
          <span property="name">Science Fiction</span></a>
        <meta property="position" content="2">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <span property="name">Award Winners</span>
        <meta property="position" content="3">
      </li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books">
          <span property="name">Books</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction">
          <span property="name">Science Fiction</span></a>
        <meta property="position" content="2">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <span property="name">Award Winners</span>
        <meta property="position" content="3">
      </li>
    </ol>
  </body>
</html>
```

### 微数据

下面是支持该面包屑导航的微数据示例：

        <html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books">
            <span itemprop="name">Books</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemscope itemtype="https://schema.org/WebPage"
           itemprop="item" itemid="https://example.com/books/sciencefiction"
           href="https://example.com/books/sciencefiction">
          <span itemprop="name">Science Fiction</span></a>
        <meta itemprop="position" content="2" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <span itemprop="name">Award winners</span>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books">
            <span itemprop="name">Books</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemscope itemtype="https://schema.org/WebPage"
           itemprop="item" itemid="https://example.com/books/sciencefiction"
           href="https://example.com/books/sciencefiction">
          <span itemprop="name">Science Fiction</span></a>
        <meta itemprop="position" content="2" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <span itemprop="name">Award winners</span>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
  </body>
</html>
```

### 
      HTML

下面的示例展示了如何以融入视觉设计的方式，在网页中插入 HTML 面包屑导航块。

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol>
      <li>
        <a href="https://www.example.com/books">Books</a>
      </li>
      <li>
        <a href="https://www.example.com/sciencefiction">Science Fiction</a>
      </li>
      <li>
        Award Winners
      </li>
    </ol>
  </body>
</html>
```

### 多个面包屑导航路径

如果用户可以通过多种方式转到您网站上的某个网页，您可以为单个网页指定多个面包屑导航路径。以下是一个能够转到获奖图书页面的面包屑导航路径：

[图书](https://www.example.com/books) ›
  [科幻小说](https://www.example.com/books/sciencefiction) ›
  获奖作品

  以下是转到同一网页的另一个面包屑导航路径：

  [文学](https://www.example.com/literature) ›
  获奖作品

### JSON-LD

下面是支持多个面包屑导航路径的 JSON-LD 示例：

        <html>
  <head>
    <title>Award Winners</title>
    <script type="application/ld+json">
    [{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Books",
        "item": "https://example.com/books"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Science Fiction",
        "item": "https://example.com/books/sciencefiction"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "Award Winners"
      }]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Literature",
        "item": "https://example.com/literature"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Award Winners"
      }]
    }]
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
    <script type="application/ld+json">
    [{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Books",
        "item": "https://example.com/books"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Science Fiction",
        "item": "https://example.com/books/sciencefiction"
      },{
        "@type": "ListItem",
        "position": 3,
        "name": "Award Winners"
      }]
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [{
        "@type": "ListItem",
        "position": 1,
        "name": "Literature",
        "item": "https://example.com/literature"
      },{
        "@type": "ListItem",
        "position": 2,
        "name": "Award Winners"
      }]
    }]
    </script>
  </head>
  <body>
  </body>
</html>
```

### RDFa

下面是支持多个面包屑导航路径的 RDFa 示例：

        <html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books">
          <span property="name">Books</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction">
          <span property="name">Science Fiction</span></a>
        <meta property="position" content="2">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction/awardwinners">
          <span property="name">Award Winners</span></a>
        <meta property="position" content="3">
      </li>
    </ol>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/literature">
          <span property="name">Literature</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <span property="name">Award Winners</span>
        <meta property="position" content="2">
      </li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books">
          <span property="name">Books</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction">
          <span property="name">Science Fiction</span></a>
        <meta property="position" content="2">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/books/sciencefiction/awardwinners">
          <span property="name">Award Winners</span></a>
        <meta property="position" content="3">
      </li>
    </ol>
    <ol vocab="https://schema.org/" typeof="BreadcrumbList">
      <li property="itemListElement" typeof="ListItem">
        <a property="item" typeof="WebPage"
            href="https://example.com/literature">
          <span property="name">Literature</span></a>
        <meta property="position" content="1">
      </li>
      ›
      <li property="itemListElement" typeof="ListItem">
        <span property="name">Award Winners</span>
        <meta property="position" content="2">
      </li>
    </ol>
  </body>
</html>
```

### 微数据

下面是支持多个面包屑导航路径的微数据示例：

    <html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books">
            <span itemprop="name">Books</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemscope itemtype="https://schema.org/WebPage"
           itemprop="item" itemid="https://example.com/books/sciencefiction"
           href="https://example.com/books/sciencefiction">
          <span itemprop="name">Science Fiction</span></a>
        <meta itemprop="position" content="2" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books/sciencefiction/awardwinners">
          <span itemprop="name">Award Winners</span></a>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/literature">
          <span itemprop="name">Literature</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <span itemprop="name">Award Winners</span>
        <meta itemprop="position" content="2" />
      </li>
    </ol>
  </body>
</html>

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books">
            <span itemprop="name">Books</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemscope itemtype="https://schema.org/WebPage"
           itemprop="item" itemid="https://example.com/books/sciencefiction"
           href="https://example.com/books/sciencefiction">
          <span itemprop="name">Science Fiction</span></a>
        <meta itemprop="position" content="2" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/books/sciencefiction/awardwinners">
          <span itemprop="name">Award Winners</span></a>
        <meta itemprop="position" content="3" />
      </li>
    </ol>
    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://example.com/literature">
          <span itemprop="name">Literature</span></a>
        <meta itemprop="position" content="1" />
      </li>
      ›
      <li itemprop="itemListElement" itemscope
          itemtype="https://schema.org/ListItem">
        <span itemprop="name">Award Winners</span>
        <meta itemprop="position" content="2" />
      </li>
    </ol>
  </body>
</html>
```

### 
      HTML

下面的示例展示了如何以融入视觉设计的方式，在网页中插入 HTML 面包屑导航块。

```
<html>
  <head>
    <title>Award Winners</title>
  </head>
  <body>
    <ol>
      <li>
        <a href="https://www.example.com/books">Books</a>
      </li>
      <li>
        <a href="https://www.example.com/books/sciencefiction">Science Fiction</a>
      </li>
      <li>
        Award Winners
      </li>
    </ol>
    <ol>
      <li>
        <a href="https://www.example.com/literature">Literature</a>
      </li>
      <li>
        Award Winners
      </li>
    </ol>
  </body>
</html>
```

## 指南

  您的内容必须遵循以下指南，才能在 Google 搜索结果中显示面包屑导航。

    警告**：如果 Google 检测到您网页中的某些标记所用的技术可能违反了我们的结构化数据指南，可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。

- [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

  我们建议您提供代表网页的典型用户路径的面包屑导航，而不是直接照搬网址结构。您无需为顶级路径（网站的网域或主机名）或网页本身添加面包屑导航 ListItem。

## 结构化数据类型定义

如需指定面包屑导航，请定义一个包含至少两个 ListItems 的 BreadcrumbList。您的内容必须包含必要属性，才能在搜索结果中一并显示面包屑导航。

Data-vocabulary.org 标记已不再适用于 Google 富媒体搜索结果功能。详细了解[即将停止支持 data-vocabulary](https://developers.google.com/search/blog/2020/01/data-vocabulary?hl=zh-cn) 这一变动。

### BreadcrumbList

BreadcrumbList 是用于存放列表中所有元素的容器项。如需了解 BreadcrumbList 的完整定义，请访问 [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList)。Google 支持的属性如下：

    必要属性

      itemListElement

[ListItem](https://schema.org/ListItem)

以特定顺序列出的面包屑导航数组。使用 [ListItem](#list-item) 指定每个面包屑导航。例如：

```
{
"@context": "https://schema.org",
"@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Books",
    "item": "https://example.com/books"
  },{
    "@type": "ListItem",
    "position": 2,
    "name": "Authors",
    "item": "https://example.com/books/authors"
  },{
    "@type": "ListItem",
    "position": 3,
    "name": "Ann Leckie",
    "item": "https://example.com/books/authors/annleckie"
  }]
}
```

### ListItem

ListItem 包含列表中单个项的详细信息。如需了解 ListItem 的完整定义，请访问 [schema.org/ListItem](https://schema.org/ListItem)。Google 支持的属性如下：

    必要属性

        item

[URL](https://schema.org/URL)，或 [Thing](https://schema.org/Thing) 的子类型

表示面包屑导航的网页的网址。您可以通过以下两种方式指定 item：

- URL：指定网页的网址。例如：

```
"item": "https://example.com/books"
```
- Thing：根据您正在使用的标记格式使用 ID 指定网址：
                    **JSON-LD**：使用 @id 指定网址。
- **微数据**：使用 href 或 itemid 指定网址。
- **RDFa**：使用 about、href 或 resource 指定网址。

            如果面包屑导航是面包屑导航路径中的最后一项，则无需指定 item。如果未针对最后一项指定 item，Google 会使用包含相应内容的网页对应的网址。

        name

[Text](https://schema.org/Text)

向用户显示的面包屑导航的标题。如果您使用包含 name 的 Thing（而非 URL）指定 item，则无需指定 name。

        position

[Integer](https://schema.org/Integer)

面包屑导航在面包屑导航路径中的位置。位置 1 表示路径的开头。

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