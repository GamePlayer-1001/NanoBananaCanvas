# 使用课程列表架构 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/course?hl=zh-cn

---

  # 课程列表 (Course) 结构化数据

  借助课程列表结构化数据，您可以提供有关您的课程的更多信息，以便潜在学生通过 Google 搜索找到您的课程。您可以提供详细信息，包括课程名称、提供者和简短说明。

## 功能可用性

  在所有可以使用 Google 搜索的区域，课程列表富媒体搜索结果均以英语提供。

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

### 
  课程详情单一页面

下面是一个课程详情单一页面的示例。此页面必须与包含 [ItemList 标记](#item-list)的[摘要页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#summary-page)配对。

<html>
  <head>
    <title>Introduction to Computer Science and Programming</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Introduction to Computer Science and Programming",
      "description": "Introductory CS course laying out the basics.",
      "provider": {
        "@type": "Organization",
        "name": "University of Technology - Eureka",
        "sameAs": "https://www.example.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>

  您可能会在富媒体搜索结果测试中看到其他富媒体搜索结果类型的错误。若要符合使用课程列表功能的条件，请注意课程列表项**部分中的所有警告或错误；您可以忽略其他错误。

```
<html>
  <head>
    <title>Introduction to Computer Science and Programming</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Course",
      "name": "Introduction to Computer Science and Programming",
      "description": "Introductory CS course laying out the basics.",
      "provider": {
        "@type": "Organization",
        "name": "University of Technology - Eureka",
        "sameAs": "https://www.example.com"
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 
  全包式单一页面

下面是一个[全包式单一页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#all-in-one)的示例。
  此页面设置在同一页面上包含各门课程的列表标记和详细信息。

<html>
  <head>
    <title>Computer Science Courses</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#intro-to-cs",
            "name": "Introduction to Computer Science and Programming",
            "description": "This is an introductory CS course laying out the basics.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Example",
              "sameAs": "https://www.example.com"
           }
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#intermediate-cs",
            "name": "Intermediate Computer Science and Programming",
            "description": "This is a CS course that builds on the basics learned in the Introduction course.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Example",
              "sameAs": "https://www.example.com"
           }
         }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#advanced-cs",
            "name": "Advanced Computer Science and Programming",
            "description": "This CS course covers advanced programming principles.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Eureka",
              "sameAs": "https://www.example.com"
           }
          }
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>

  您可能会在富媒体搜索结果测试中看到其他富媒体搜索结果类型的错误。若要符合使用课程列表功能的条件，请注意**课程列表项**和**轮播界面**部分中的所有警告或错误；您可以忽略其他错误。

```
<html>
  <head>
    <title>Computer Science Courses</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#intro-to-cs",
            "name": "Introduction to Computer Science and Programming",
            "description": "This is an introductory CS course laying out the basics.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Example",
              "sameAs": "https://www.example.com"
           }
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#intermediate-cs",
            "name": "Intermediate Computer Science and Programming",
            "description": "This is a CS course that builds on the basics learned in the Introduction course.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Example",
              "sameAs": "https://www.example.com"
           }
         }
        },
        {
          "@type": "ListItem",
          "position": 3,
          "item": {
            "@type": "Course",
            "url":"https://www.example.com/courses#advanced-cs",
            "name": "Advanced Computer Science and Programming",
            "description": "This CS course covers advanced programming principles.",
            "provider": {
              "@type": "Organization",
              "name": "University of Technology - Eureka",
              "sameAs": "https://www.example.com"
           }
          }
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 指南

您的课程必须遵循以下指南，才能出现在课程列表中。

**警告**：如果您的网站违反了以下一个或多个指南，Google 可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。解决这些问题后，您便可提交网站以供[重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

- [内容指南](#content-guidelines)
- [技术指南](#technical-guidelines)
- [轮播界面指南](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#guidelines)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)

### 
  内容指南

- 仅对符合下述课程定义的教育内容使用 Course 标记：围绕特定主题和/或话题展开，且包含讲座、课程或模块的课程系列或单元。
- 课程必须围绕特定主题和/或话题展开，在知识和/或技能方面有明确的教育成果，由一位或多位教师讲授并且有学生名单。
- 诸如“天文日”之类的一般公众活动不是课程，一段 2 分钟的“如何制作三明治”视频也不是课程。

### 技术指南

您必须至少标记三门课程。这些课程可以位于不同的[详情页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#details-page)中，也可以位于[全包式页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#all-in-one)中。

  您必须将[轮播界面标记](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#details-page)添加到[摘要页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#summary)或[全包式页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#all-in-one)。

每门课程必须具有有效的 [name](https://schema.org/name) 和 [provider](https://schema.org/provider) 属性。例如，以下命名方式均无效：

- 推广用语：“世界上最好的学校”
- 课程标题中包含价格：“学尤克里里 - 只需 30 美元！”
- 使用非课程内容作为标题，如：“学习这门课程，掌握快速赚钱秘诀！”
- 折扣或购买机会，如：“各领域的佼佼者分享了他们的秘诀 - 报名听课可享七五折优惠！”

## 不同结构化数据类型的定义

若要使您的内容能够显示为富媒体搜索结果，您必须为其添加必要属性。
  您还可添加建议属性，以便添加与内容相关的更多信息，进而提供更优质的用户体验。

### Course

  使用以下属性标记至少三个课程。这些课程可以位于不同的[详情页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#details-page)中，也可以位于[全包式页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#all-in-one)中。

如需了解 Course 的完整定义，请访问 [schema.org/Course](https://schema.org/Course)。Google 支持的属性如下：

  必要属性

    description

[Text](https://schema.org/Text)

课程的说明。最多显示 60 个字符。

    name

[Text](https://schema.org/Text)

课程的标题。

  建议属性

    provider

[Organization](https://schema.org/Organization)

发布课程来源内容的组织。例如，加州大学伯克利分校。

### ItemList

除了 [Course 属性](#course)之外，还可以添加以下属性来指定课程列表。您可以将这些属性添加到[摘要页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#summary)或[全包式页面](https://developers.google.com/search/docs/appearance/structured-data/carousel?hl=zh-cn#all-in-one)中。

如需了解 ItemList 的完整定义，请访问 [schema.org/ItemList](https://schema.org/ItemList)。

  必要属性

    itemListElement

[ListItem](https://schema.org/ListItem)

单个项目网页的注释。

    ListItem.position

[Integer](https://schema.org/Integer)

项目网页在列表中的序号位置。

    ListItem.url

[URL](https://schema.org/URL)

项目网页的规范网址。每个项目都必须具备一个独一无二的网址。

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