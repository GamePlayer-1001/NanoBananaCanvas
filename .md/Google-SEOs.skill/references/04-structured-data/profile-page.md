# 个人资料页面 (ProfilePage) 架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/profile-page?hl=zh-cn

---

  # 个人资料页面 (ProfilePage) 结构化数据

ProfilePage 标记适用于创作者（个人或组织）分享第一手观点的任何网站。添加此标记有助于 Google 搜索了解在线社区中的创作者，并在搜索结果中显示该社区中的优质内容，包括[讨论与论坛](https://blog.google/products/search/google-search-discussions-forums-news/?hl=zh-cn)功能。

其他结构化数据功能也可以链接到带有 ProfilePage 标记的网页。例如[文章](https://developers.google.com/search/docs/appearance/structured-data/article?hl=zh-cn)和[食谱](https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=zh-cn)结构化数据具有作者，[论坛](https://developers.google.com/search/docs/appearance/structured-data/discussion-forum?hl=zh-cn)和[问答页面](https://developers.google.com/search/docs/appearance/structured-data/qapage?hl=zh-cn)结构化数据中经常会有多个作者。

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

下面是一个带有标记的个人资料页面的示例：

    JSON-LD
    <html>
  <head>
    <title>Angelo Huff on Cool Forum Platform</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "dateCreated": "2024-12-23T12:34:00-05:00",
      "dateModified": "2024-12-26T14:53:00-05:00",
      "mainEntity": {
        "@type": "Person",
        "name": "Angelo Huff",
        "alternateName": "ahuff23",
        "identifier": "123475623",
        "interactionStatistic": [{
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": 1
        },{
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/LikeAction",
          "userInteractionCount": 5
        }],
        "agentInteractionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/WriteAction",
          "userInteractionCount": 2346
        },
        "description": "Defender of Truth",
        "image": "https://example.com/avatars/ahuff23.jpg",
        "sameAs": [
          "https://www.example.com/real-angelo",
          "https://example.com/profile/therealangelohuff"
        ]
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
    <title>Angelo Huff on Cool Forum Platform</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "dateCreated": "2024-12-23T12:34:00-05:00",
      "dateModified": "2024-12-26T14:53:00-05:00",
      "mainEntity": {
        "@type": "Person",
        "name": "Angelo Huff",
        "alternateName": "ahuff23",
        "identifier": "123475623",
        "interactionStatistic": [{
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": 1
        },{
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/LikeAction",
          "userInteractionCount": 5
        }],
        "agentInteractionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/WriteAction",
          "userInteractionCount": 2346
        },
        "description": "Defender of Truth",
        "image": "https://example.com/avatars/ahuff23.jpg",
        "sameAs": [
          "https://www.example.com/real-angelo",
          "https://example.com/profile/therealangelohuff"
        ]
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html>
  <head>
    <title>Angelo Huff on Cool Forum Platform</title>
  </head>
  <body itemtype="https://schema.org/ProfilePage" itemscope>
    <meta itemprop="dateCreated" content="2024-12-23T12:34:00-05:00" />
  	<meta itemprop="dateModified" content="2024-12-26T14:53:00-05:00" />
    <div itemprop="mainEntity" itemtype="https://schema.org/Person" itemscope>
      <div><span itemprop="alternateName" id="handle">ahuff23</span> (<span itemprop="name" id="real-name">Angelo Huff</span>)</div>
      <meta itemprop="identifier" content="123475623" />
      <div itemprop="description">Defender of Truth</div>
      <img itemprop="image" src="https://example.com/avatars/ahuff23.jpg" />
      <div>Links: <a itemprop="sameAs" href="https://www.therealangelohuff.com">Home Page</a><br>
                  <a itemprop="sameAs" href="https://example.com/profile/therealangelohuff">Other Social Media Site</a></div>
      <div><span itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">5</span>
              <span itemprop="interactionType" content="https://schema.org/LikeAction">likes</span>
           </span>,
           <span itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">1</span>
              <span itemprop="interactionType" content="https://schema.org/FollowAction">follower</span>
           </span>, and
           <span itemprop="agentInteractionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">2346</span>
              <span itemprop="interactionType" content="https://schema.org/WriteAction">posts</span>
           </span>
       </div>
    </div>
  </body>
</html>

```
<html>
  <head>
    <title>Angelo Huff on Cool Forum Platform</title>
  </head>
  <body itemtype="https://schema.org/ProfilePage" itemscope>
    <meta itemprop="dateCreated" content="2024-12-23T12:34:00-05:00" />
  	<meta itemprop="dateModified" content="2024-12-26T14:53:00-05:00" />
    <div itemprop="mainEntity" itemtype="https://schema.org/Person" itemscope>
      <div><span itemprop="alternateName" id="handle">ahuff23</span> (<span itemprop="name" id="real-name">Angelo Huff</span>)</div>
      <meta itemprop="identifier" content="123475623" />
      <div itemprop="description">Defender of Truth</div>
      <img itemprop="image" src="https://example.com/avatars/ahuff23.jpg" />
      <div>Links: <a itemprop="sameAs" href="https://www.therealangelohuff.com">Home Page</a><br>
                  <a itemprop="sameAs" href="https://example.com/profile/therealangelohuff">Other Social Media Site</a></div>
      <div><span itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">5</span>
              <span itemprop="interactionType" content="https://schema.org/LikeAction">likes</span>
           </span>,
           <span itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">1</span>
              <span itemprop="interactionType" content="https://schema.org/FollowAction">follower</span>
           </span>, and
           <span itemprop="agentInteractionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
              <span itemprop="userInteractionCount">2346</span>
              <span itemprop="interactionType" content="https://schema.org/WriteAction">posts</span>
           </span>
       </div>
    </div>
  </body>
</html>
```

## 指南

若要使您的个人资料页面结构化数据能够在 Google 搜索中使用，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [Search Essentials](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [内容指南](#content-guidelines)
- [技术指南](#technical-guidelines)

### 内容指南

- 页面的重点必须是与整个网站有关联的单个个人或组织。下面列举了个人资料页面的一些示例：
    **

有效用例**：

      论坛或社交媒体网站上的用户个人资料页面
- 新闻网站上的作者页面
- 博客网站上的“关于我”页面
- 公司网站上的员工页面

无效用例**：

- 商店的首页（通常包含大量非商家资料信息）
- 组织评价网站（组织与该网站无关联）

### 技术指南

  如果个人资料页面还包含创作者的近期活动，您可以在这些对象上使用网址添加标记，以便引用包含完整内容和标记的页面。例如，下面是一种可能的标记结构：

```
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@id": "#main-author",
    "@type": "Person",
    "name": "Marlo Smith"
  },
  "hasPart": [{
    "@type": "Article",
    "headline": "Things to see in NJ",
    "url": "https://example.com/things-to-see-nj",
    "datePublished": "2014-02-23T18:34:00Z",
    "author": { "@id": "#main-author" }
  }]
}
```

## 不同结构化数据类型的定义

若要使您的结构化数据能够在搜索结果中显示，您必须为其添加必需属性。您还可添加建议属性，以便加入与个人资料页面相关的更多信息，进而提供更优质的用户体验。

### ProfilePage

如需了解 ProfilePage 的完整定义，请访问 [schema.org/ProfilePage](https://schema.org/ProfilePage)。

  必要属性

        mainEntity

[Person](https://schema.org/Person) 或 [Organization](https://schema.org/Organization)

此个人资料页面所涉及的个人或组织。这指明此页面的重点是有关此实体的信息。

如果可以获得相应信息（也就是说，如果您知道相应页面是代表个人还是组织），请尝试使用正确的类型；否则默认使用 Person（例如，若是账号类型未知）。

    建议属性

      dateCreated

[DateTime](https://schema.org/DateTime)

个人资料的创建日期和时间（如果适用），采用 [ISO 8601](https://wikipedia.org/wiki/ISO_8601) 日期格式。

        dateModified

[DateTime](https://schema.org/DateTime)

个人资料中信息的修改日期和时间（如果适用），采用 [ISO 8601](https://wikipedia.org/wiki/ISO_8601) 日期格式。理想情况下，这仅表示由人工修改的个人资料元数据更改；例如，向引用此个人资料的位置添加额外的出链不会构成修改。

### Person 或 Organization

[schema.org/Person](https://schema.org/Person) 和 [schema.org/Organization](https://schema.org/Organization) 都具有 Google 使用的常见属性。

  必要属性

      name

[Text](https://schema.org/Text)

个人或组织的主要识别方式。我们建议针对真实姓名使用此字段（对于社交媒体标识名，请使用 alternateName）。但是，如果社交媒体标识名是在您网站上识别某个人的唯一方式，您就可以使用此字段来指定社交媒体标识名。

        如果 name 属性不可用，您可以通过提供 alternateName 属性来满足此要求。

    建议属性

      agentInteractionStatistic

[InteractionCounter](https://schema.org/InteractionCounter)

有关个人资料页面实体自身行为的用户统计数据（如果适用）。

Google 可识别以下 interactionTypes：

- [https://schema.org/FollowAction](https://schema.org/FollowAction)：所关注的其他账号的数量。
- [https://schema.org/LikeAction](https://schema.org/LikeAction)：“赞”的次数（通常是其他实体的帖子的“赞”次数）。
- [https://schema.org/WriteAction](https://schema.org/WriteAction)：帖子数量。
- [https://schema.org/ShareAction](https://schema.org/ShareAction)：帖子的转发次数。

      alternateName

[Text](https://schema.org/Text)

备用的公开标识符（如果适用）。例如，如果在 name 字段中使用某人的真实姓名，此属性则为社交媒体标识名。

      description

[Text](https://schema.org/Text)

用户的署名或适用凭证（如果适用）。

      identifier

[Text](https://schema.org/Text)

您的网站中使用的任何唯一标识符（如果适用）。它可以是一个内部数据库 ID，您的网站使用该 ID 来识别用户（即使用户的社交媒体标识名发生了更改）。

      image

[URL](https://schema.org/URL) 或 [ImageObject](https://schema.org/ImageObject)

创作者个人资料图片的网址或 ImageObject（如果适用）。如果没有图片，请勿在此字段中添加默认图片、图标或占位符图片。

其他的图片指南：

- 每个网页必须包含至少 1 张图片（无论您是否添加了标记）。Google 将根据宽高比和分辨率挑选最合适的图片显示在搜索结果中。
- 图片网址必须可抓取且可编入索引。如需检查 Google 能否访问您的网址，请使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)。
- 图片必须代表标记的内容。
- 图片必须采用[受 Google 图片支持](https://developers.google.com/search/docs/appearance/google-images?hl=zh-cn#supported-image-formats)的文件格式。
- 为取得最佳效果，建议您提供具有以下宽高比的多个高分辨率图片（宽度乘以高度至少为 50K 像素）：16x9、4x3 和 1x1。

例如：

```
"image": [
  "https://example.com/photos/1x1/photo.jpg",
  "https://example.com/photos/4x3/photo.jpg",
  "https://example.com/photos/16x9/photo.jpg"
]
```

      interactionStatistic

[InteractionCounter](https://schema.org/InteractionCounter)

应用到个人资料页面实体的用户统计数据（如果适用）。请仅包含托管个人资料页面的平台的相关统计数据（请勿提及创作者在其首页上也有 10 万关注者）。

Google 可识别以下 interactionTypes：

- [https://schema.org/FollowAction](https://schema.org/FollowAction)：关注者的数量。
- [https://schema.org/LikeAction](https://schema.org/LikeAction)：此实体获得“赞”的次数。
- [https://schema.org/BefriendAction](https://schema.org/BefriendAction)：双向关系。

      sameAs

[URL](https://schema.org/URL)

其他外部个人资料的网址，或个人资料首页的网址（如果适用）。

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