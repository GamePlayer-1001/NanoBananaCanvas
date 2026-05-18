# 视频（VideoObject、Clip、BroadcastEvent）架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn

---

  # 视频（VideoObject、Clip、BroadcastEvent）结构化数据

虽然 Google 会尝试自动了解视频的详细信息，但是您可以使用 [VideoObject](#video-object) 标记视频，以影响视频结果中显示的信息，例如说明、缩略图网址、上传日期和时长。将视频结构化数据添加到[观看页面](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#watch-page)，还可以让 Google 更轻松地找到您的视频。视频可以显示在 Google 上的多个不同位置，其中包括主搜索结果页、视频模式、Google 图片和 [Google 探索](https://developers.google.com/search/docs/appearance/google-discover?hl=zh-cn)。

  根据您对观看页面的标记方式，您的视频还可能符合以下特定视频功能的使用条件：

  视频功能**

      **“LIVE”徽章**：使用 [BroadcastEvent](#broadcast-event) 标记您的视频，为视频添加“LIVE”徽章。“LIVE”徽章可应用于任何时长的公开直播视频。以下是一些示例：

- 体育赛事
- 颁奖典礼
- 网红视频
- 直播视频游戏

        确保遵循[“LIVE”徽章指南](#livestream-guidelines)，并使用 [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart?hl=zh-cn) 以确保 Google 在正确的时间抓取您的网页。

      **重要时刻**

    “重要时刻”功能是一种视频浏览方式，能让用户像翻看图书章节那样在视频片段间跳转，有助于用户更深入地与您的内容互动。Google 搜索会尝试自动检测视频中的片段，并向用户显示重要时刻，您无需采取任何措施。或者，您也可以手动告知 Google 视频中的重要时间点。我们将优先显示您通过结构化数据或 YouTube 说明设置的重要时刻。

- **如果您的视频托管在您的网页上**，您可以通过以下两种方式启用重要时刻功能：

          [Clip 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#clip)：指定每个片段确切的起点和终点，以及要为每个片段显示的标签。此方式适用于 Google 搜索支持的所有语言。
- [SeekToAction 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#seek)：告知 Google 时间戳通常位于网址结构中的什么位置，以便 Google 可以自动识别重要时刻，并将用户链接到视频中的这些时间点。
            目前支持以下语言：英语、西班牙语、葡萄牙语、意大利语、中文、法语、日语、德语、土耳其语、韩语、荷兰语和俄语。我们的目标是逐步将此功能扩展到更多语言。即使是对于受支持的语言，并非所有视频都会标出重要时刻，但我们希望随着时间的推移也能改善这一功能。

      **如果您的视频托管在 YouTube 上**，您可以在 YouTube 上的视频说明中指定确切的时间戳和标签。请查看[在 YouTube 说明中标记时间戳的最佳实践](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#best-practices-youtube)。此方式适用于 Google 搜索支持的所有语言。

如果您想在 YouTube 上启用视频章节功能，请遵循这些[其他指南](https://support.google.com/youtube/answer/9884579?hl=zh-cn)。

若要完全停用“重要时刻”功能（包括 Google 为了自动为您的视频显示重要时刻而付出的所有努力），请使用 [nosnippet](https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn#nosnippet) meta 标记。

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
  标准视频搜索结果

下面是一个 [VideoObject](#video-object) 示例。

    JSON-LD
    <html>
  <head>
    <title>Introducing the self-driving bicycle in the Netherlands</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Introducing the self-driving bicycle in the Netherlands",
      "description": "This spring, Google is introducing the self-driving bicycle in Amsterdam, the world's premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google's ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.",
      "thumbnailUrl": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "uploadDate": "2024-03-31T08:00:00+08:00",
      "duration": "PT1M54S",
      "contentUrl": "https://www.example.com/video/123/file.mp4",
      "embedUrl": "https://www.example.com/embed/123",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": 5647018
      },
      "regionsAllowed": ["US", "NL"]
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
    <title>Introducing the self-driving bicycle in the Netherlands</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "Introducing the self-driving bicycle in the Netherlands",
      "description": "This spring, Google is introducing the self-driving bicycle in Amsterdam, the world's premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google's ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.",
      "thumbnailUrl": [
        "https://example.com/photos/1x1/photo.jpg",
        "https://example.com/photos/4x3/photo.jpg",
        "https://example.com/photos/16x9/photo.jpg"
       ],
      "uploadDate": "2024-03-31T08:00:00+08:00",
      "duration": "PT1M54S",
      "contentUrl": "https://www.example.com/video/123/file.mp4",
      "embedUrl": "https://www.example.com/embed/123",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": 5647018
      },
      "regionsAllowed": ["US", "NL"]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Introducing the self-driving bicycle in the Netherlands</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-03-31T08:00:00+08:00" />
  <meta itemprop="duration" content="PT1M54S" />
  <p itemprop="description">This spring, Google is introducing the self-driving bicycle in Amsterdam, the world's premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google's ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="5647018" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <link itemprop="embedUrl" href="https://www.example.com/embed/123" />
  <meta itemprop="contentUrl" content="https://www.example.com/video/123/file.mp4" />
  <meta itemprop="regionsAllowed" content="US" />
  <meta itemprop="regionsAllowed" content="NL" />
  <meta itemprop="thumbnailUrl" content="https://example.com/photos/1x1/photo.jpg" />
</body>
</html>

```
<html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Introducing the self-driving bicycle in the Netherlands</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-03-31T08:00:00+08:00" />
  <meta itemprop="duration" content="PT1M54S" />
  <p itemprop="description">This spring, Google is introducing the self-driving bicycle in Amsterdam, the world's premier cycling city. The Dutch cycle more than any other nation in the world, almost 900 kilometres per year per person, amounting to over 15 billion kilometres annually. The self-driving bicycle enables safe navigation through the city for Amsterdam residents, and furthers Google's ambition to improve urban mobility with technology. Google Netherlands takes enormous pride in the fact that a Dutch team worked on this innovation that will have great impact in their home country.</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="5647018" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <link itemprop="embedUrl" href="https://www.example.com/embed/123" />
  <meta itemprop="contentUrl" content="https://www.example.com/video/123/file.mp4" />
  <meta itemprop="regionsAllowed" content="US" />
  <meta itemprop="regionsAllowed" content="NL" />
  <meta itemprop="thumbnailUrl" content="https://example.com/photos/1x1/photo.jpg" />
</body>
</html>
```

### 
  “LIVE”徽章

下面是 [VideoObject](#video-object) 和 [BroadcastEvent](#broadcast-event) 的示例。

    JSON-LD
    <html>
  <head>
    <title>Bald Eagle at the Park - Livestream</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "contentURL": "https://example.com/bald-eagle-at-the-park.mp4",
      "description": "Bald eagle at the park livestream.",
      "duration": "PT37M14S",
      "embedUrl": "https://example.com/bald-eagle-at-the-park",
      "expires": "2024-10-30T14:37:14+00:00",
      "regionsAllowed": "US",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": 4756
      },
      "name": "Bald eagle nest livestream!",
      "thumbnailUrl": "https://example.com/bald-eagle-at-the-park",
      "uploadDate": "2024-10-27T14:00:00+00:00",
      "publication": [
        {
          "@type": "BroadcastEvent",
          "isLiveBroadcast": true,
          "startDate": "2024-10-27T14:00:00+00:00",
          "endDate": "2024-10-27T14:37:14+00:00"
        },
        {
          "@type": "BroadcastEvent",
          "isLiveBroadcast": true,
          "startDate": "2024-10-27T18:00:00+00:00",
          "endDate": "2024-10-27T18:37:14+00:00"
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>Bald Eagle at the Park - Livestream</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "contentURL": "https://example.com/bald-eagle-at-the-park.mp4",
      "description": "Bald eagle at the park livestream.",
      "duration": "PT37M14S",
      "embedUrl": "https://example.com/bald-eagle-at-the-park",
      "expires": "2024-10-30T14:37:14+00:00",
      "regionsAllowed": "US",
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": { "@type": "WatchAction" },
        "userInteractionCount": 4756
      },
      "name": "Bald eagle nest livestream!",
      "thumbnailUrl": "https://example.com/bald-eagle-at-the-park",
      "uploadDate": "2024-10-27T14:00:00+00:00",
      "publication": [
        {
          "@type": "BroadcastEvent",
          "isLiveBroadcast": true,
          "startDate": "2024-10-27T14:00:00+00:00",
          "endDate": "2024-10-27T14:37:14+00:00"
        },
        {
          "@type": "BroadcastEvent",
          "isLiveBroadcast": true,
          "startDate": "2024-10-27T18:00:00+00:00",
          "endDate": "2024-10-27T18:37:14+00:00"
        }
      ]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Bald Eagle at the Park - Livestream</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-10-27T14:00:00+00:00" />
  <meta itemprop="duration" content="PT37M14S" />
  <p itemprop="description">Bald eagle at the park livestream.</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="4756" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <link itemprop="embedUrl" href="https://example.com/bald-eagle-at-the-park" />
  <meta itemprop="expires" content="2024-10-30T14:37:14+00:00" />
  <meta itemprop="contentUrl" content="https://example.com/bald-eagle-at-the-park.mp4" />
  <meta itemprop="regionsAllowed" content="US" />
  <meta itemprop="thumbnailUrl" content="https://example.com/bald-eagle-at-the-park" />
  <div itemprop="publication" itemtype="https://schema.org/BroadcastEvent" itemscope>
    <meta itemprop="isLiveBroadcast" content="true" />
    <meta itemprop="startDate" content="2024-10-27T14:00:00+00:00" />
    <meta itemprop="endDate" content="2024-10-27T14:37:14+00:00" />
  </div>
  <div itemprop="publication" itemtype="https://schema.org/BroadcastEvent" itemscope>
    <meta itemprop="isLiveBroadcast" content="true" />
    <meta itemprop="startDate" content="2024-10-27T18:00:00+00:00" />
    <meta itemprop="endDate" content="2024-10-27T18:37:14+00:00" />
  </div>
</body>
</html>

```
<html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Bald Eagle at the Park - Livestream</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-10-27T14:00:00+00:00" />
  <meta itemprop="duration" content="PT37M14S" />
  <p itemprop="description">Bald eagle at the park livestream.</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="4756" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <link itemprop="embedUrl" href="https://example.com/bald-eagle-at-the-park" />
  <meta itemprop="expires" content="2024-10-30T14:37:14+00:00" />
  <meta itemprop="contentUrl" content="https://example.com/bald-eagle-at-the-park.mp4" />
  <meta itemprop="regionsAllowed" content="US" />
  <meta itemprop="thumbnailUrl" content="https://example.com/bald-eagle-at-the-park" />
  <div itemprop="publication" itemtype="https://schema.org/BroadcastEvent" itemscope>
    <meta itemprop="isLiveBroadcast" content="true" />
    <meta itemprop="startDate" content="2024-10-27T14:00:00+00:00" />
    <meta itemprop="endDate" content="2024-10-27T14:37:14+00:00" />
  </div>
  <div itemprop="publication" itemtype="https://schema.org/BroadcastEvent" itemscope>
    <meta itemprop="isLiveBroadcast" content="true" />
    <meta itemprop="startDate" content="2024-10-27T18:00:00+00:00" />
    <meta itemprop="endDate" content="2024-10-27T18:37:14+00:00" />
  </div>
</body>
</html>
```

### 
  Clip

  下面是 [VideoObject](#video-object) 和 [Clip](#clip) 的示例。

    JSON-LD
    <html>
  <head>
    <title>Cat jumps over the fence</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "VideoObject",
      "name": "Cat video",
      "duration": "PT10M",
      "uploadDate": "2024-07-19T08:00:00+08:00",
      "thumbnailUrl": "https://www.example.com/cat.jpg",
      "description": "Watch this cat jump over a fence!",
      "contentUrl": "https://www.example.com/cat_video_full.mp4",
      "ineligibleRegion": "US",
      "hasPart": [{
        "@type": "Clip",
        "name": "Cat jumps",
        "startOffset": 30,
        "endOffset": 45,
        "url": "https://www.example.com/example?t=30"
      },
      {
        "@type": "Clip",
        "name": "Cat misses the fence",
        "startOffset": 111,
        "endOffset": 150,
        "url": "https://www.example.com/example?t=111"
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
    <title>Cat jumps over the fence</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "VideoObject",
      "name": "Cat video",
      "duration": "PT10M",
      "uploadDate": "2024-07-19T08:00:00+08:00",
      "thumbnailUrl": "https://www.example.com/cat.jpg",
      "description": "Watch this cat jump over a fence!",
      "contentUrl": "https://www.example.com/cat_video_full.mp4",
      "ineligibleRegion": "US",
      "hasPart": [{
        "@type": "Clip",
        "name": "Cat jumps",
        "startOffset": 30,
        "endOffset": 45,
        "url": "https://www.example.com/example?t=30"
      },
      {
        "@type": "Clip",
        "name": "Cat misses the fence",
        "startOffset": 111,
        "endOffset": 150,
        "url": "https://www.example.com/example?t=111"
      }]
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Cat jumps over the fence</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-07-19" />
  <meta itemprop="duration" content="P10M" />
  <p itemprop="description">Watch this cat jump over a fence!</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="5647018" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <div itemprop="hasPart" itemtype="https://schema.org/Clip" itemscope>
    <meta itemprop="name" content="Cat jumps" />
    <meta itemprop="startOffset" content="30" />
    <meta itemprop="endOffset" content="45" />
    <meta itemprop="url" content="https://www.example.com/example?t=30" />
  </div>
  <div itemprop="hasPart" itemtype="https://schema.org/Clip" itemscope>
    <meta itemprop="name" content="Cat misses the fence" />
    <meta itemprop="startOffset" content="111" />
    <meta itemprop="endOffset" content="150" />
    <meta itemprop="url" content="https://www.example.com/example?t=111" />
  </div>
  <link itemprop="embedUrl" href="https://www.example.com/embed/123" />
  <meta itemprop="contentUrl" content="https://www.example.com/cat_video_full.mp4" />
  <meta itemprop="ineligibleRegion" content="US" />
  <meta itemprop="thumbnailUrl" content="https://www.example.com/cat.jpg" />
</body>
</html>

```
<html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">Cat jumps over the fence</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-07-19" />
  <meta itemprop="duration" content="P10M" />
  <p itemprop="description">Watch this cat jump over a fence!</p>
  <div itemprop="interactionStatistic" itemtype="https://schema.org/InteractionCounter" itemscope>
    <meta itemprop="userInteractionCount" content="5647018" />
    <meta itemprop="interactionType" itemtype="https://schema.org/WatchAction" />
  </div>
  <div itemprop="hasPart" itemtype="https://schema.org/Clip" itemscope>
    <meta itemprop="name" content="Cat jumps" />
    <meta itemprop="startOffset" content="30" />
    <meta itemprop="endOffset" content="45" />
    <meta itemprop="url" content="https://www.example.com/example?t=30" />
  </div>
  <div itemprop="hasPart" itemtype="https://schema.org/Clip" itemscope>
    <meta itemprop="name" content="Cat misses the fence" />
    <meta itemprop="startOffset" content="111" />
    <meta itemprop="endOffset" content="150" />
    <meta itemprop="url" content="https://www.example.com/example?t=111" />
  </div>
  <link itemprop="embedUrl" href="https://www.example.com/embed/123" />
  <meta itemprop="contentUrl" content="https://www.example.com/cat_video_full.mp4" />
  <meta itemprop="ineligibleRegion" content="US" />
  <meta itemprop="thumbnailUrl" content="https://www.example.com/cat.jpg" />
</body>
</html>
```

### 
  SeekToAction

  下面是一个 [VideoObject](#video-object) 的示例，其中包含 SeekToAction 标记所需的[其他属性](#seek)。

    JSON-LD
    <html>
  <head>
    <title>John Smith (@johnsmith123) on VideoApp: My daily workout! #stayingfit</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "potentialAction" : {
        "@type": "SeekToAction",
        "target": "https://video.example.com/watch/videoID?t={seek_to_second_number}",
        "startOffset-input": "required name=seek_to_second_number"
      },
      "name": "My daily workout!",
      "uploadDate": "2024-07-19T08:00:00+08:00",
      "thumbnailUrl": "https://www.example.com/daily-workout.jpg",
      "description": "My daily workout!",
      "embedUrl": "https://example.com/daily-workout"
    }
    </script>
  </head>
  <body>
  </body>
</html>

```
<html>
  <head>
    <title>John Smith (@johnsmith123) on VideoApp: My daily workout! #stayingfit</title>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "potentialAction" : {
        "@type": "SeekToAction",
        "target": "https://video.example.com/watch/videoID?t={seek_to_second_number}",
        "startOffset-input": "required name=seek_to_second_number"
      },
      "name": "My daily workout!",
      "uploadDate": "2024-07-19T08:00:00+08:00",
      "thumbnailUrl": "https://www.example.com/daily-workout.jpg",
      "description": "My daily workout!",
      "embedUrl": "https://example.com/daily-workout"
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

    微数据
    <html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">John Smith (@johnsmith123) on VideoApp: My daily workout! #stayingfit</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-07-19" />
  <p itemprop="description">My daily workout!</p>
  <div itemprop="potentialAction" itemtype="https://schema.org/SeekToAction" itemscope>
    <meta itemprop="target" content="https://video.example.com/watch/videoID?t={seek_to_second_number}" />
    <meta itemprop="startOffset-input" content="required name=seek_to_second_number" />
  </div>
  <link itemprop="embedUrl" href="https://example.com/daily-workout" />
  <meta itemprop="thumbnailUrl" content="https://www.example.com/daily-workout.jpg" />
</body>
</html>

```
<html itemscope itemprop="VideoObject" itemtype="https://schema.org/VideoObject">
<head>
  <title itemprop="name">John Smith (@johnsmith123) on VideoApp: My daily workout! #stayingfit</title>
</head>
<body>
  <meta itemprop="uploadDate" content="2024-07-19" />
  <p itemprop="description">My daily workout!</p>
  <div itemprop="potentialAction" itemtype="https://schema.org/SeekToAction" itemscope>
    <meta itemprop="target" content="https://video.example.com/watch/videoID?t={seek_to_second_number}" />
    <meta itemprop="startOffset-input" content="required name=seek_to_second_number" />
  </div>
  <link itemprop="embedUrl" href="https://example.com/daily-workout" />
  <meta itemprop="thumbnailUrl" content="https://www.example.com/daily-workout.jpg" />
</body>
</html>
```

## 指南

  为了让您的视频结构化数据能显示在 Google 搜索结果中，您必须遵循[搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)、[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)和[视频索引编制要求](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#indexing-criteria)。

警告**：如果 Google 检测到您网页中的某些标记所用的技术可能违反了我们的结构化数据指南，可能会对您的网站执行[人工处置措施](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)。

此外，如果这些指南适用于您的视频内容，我们建议您查看这些指南：

- [直播指南](#livestream-guidelines)
- [Clip 和 SeekToAction 指南](#clip-guidelines)
- [在 YouTube 上标记时间戳的最佳做法](#best-practices-youtube)

### 
  “LIVE”徽章指南

  如果您将 [BroadcastEvent](#broadcast-event) 添加到直播视频，请遵循以下指南：

- 不要在结构化数据中使用粗俗或可能有攻击性的语言。
- 为了确保 Google 在正确的时间抓取您的直播视频，请使用 [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart?hl=zh-cn)。您可为以下事件调用此 API：

      当视频上线时
- 当视频已停止在线播放且网页的标记已更新为指示 endDate 时
- 每当标记发生更改且需要通知 Google 时

    Indexing API 仅支持直播视频。

### 在 YouTube 上标记时间戳的最佳做法

  如果您的视频托管在 YouTube 上，Google 搜索可能会根据 YouTube 上的视频说明自动为您的视频启用重要时刻，而您不必在 YouTube 说明中标记特定时间戳。不过，您可以更明确地告诉我们视频中的重要时间点，我们会优先获取这些信息。下图显示了 YouTube 视频说明中的时间戳和标签在搜索结果中的显示效果：

**1. 标签**：剪辑的名称。**2. 时间戳**：剪辑开始时间。

  在为 YouTube 说明设置时间戳和标签格式时，请注意以下指南：

- 按照以下格式设置时间戳：[hour]:[minute]:[second]。如果没有小时，则无需添加小时。
- 在时间戳所在的行中指定时间戳的标签。
- 在视频说明中另起一行放置每个时间戳。
- 将时间戳与视频中的指定点相关联。
- 确保标签至少包含一个字词。
- 按时间顺序列出时间戳。

如果您想在 YouTube 上启用视频章节功能，请遵循这些[其他指南](https://support.google.com/youtube/answer/9884579?hl=zh-cn)。

### Clip 和 SeekToAction 指南

如果您添加 [Clip](#clip) 或 [SeekToAction](#seek) 结构化数据来标记视频片段，请遵循以下指南：

- 视频必须能够深层链接到视频网址中视频起点之外的某个点。例如，https://www.example.com/example?t=30 可从视频的 30 秒处开始播放。
- VideoObject 结构化数据必须添加到能让用户观看视频的网页中。将用户引导至无法观看视频的网页会导致糟糕的用户体验。
- 视频总时长必须至少为 30 秒。
- 视频必须包含 [VideoObject](#video-object) 结构化数据文档中列出的必需属性。
- **仅适用于 Clip 结构化数据**：确保在同一网页上定义的同一视频中没有任何两个剪辑的开始时间相同。
- **仅适用于 SeekToAction 结构化数据**：Google 必须能够[提取您的视频内容文件](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#allow-fetch)。

## 结构化数据类型定义

本部分介绍了与 Google 搜索中的视频功能相关的结构化数据类型。
  若要使您的标记能够在 Google 搜索中使用，您必须为其添加必需 [VideoObject](#video-object) 属性。您还可添加建议属性，以便添加与 VideoObject 相关的更多信息，进而提供更优质的用户体验。除了 [VideoObject](#video-object) 属性之外，您还可添加以下数据类型，以便在 Google 搜索中启用视频增强功能：

- **[BroadcastEvent](#broadcast-event)**：标记直播视频，为视频启用“LIVE”徽章。
- **[Clip](#clip)**：在视频中标记重要片段，以帮助用户快速浏览到视频中的特定点。
- **[SeekToAction](#seek)**：通过指明网址结构来启用重要时刻，以便 Google 可以自动识别重要时刻，并将用户链接到视频中的这些时间点。

### VideoObject

如需了解 VideoObject 的完整定义，请访问 [schema.org/VideoObject](https://schema.org/VideoObject)。
  如果您不添加必需属性，Google 可能无法提取视频的任何相关信息。还有一些建议添加的属性，能帮助您添加更多与您的内容相关的信息，进而提供更好的用户体验。

    必要属性

      name

[Text](https://schema.org/Text)

视频标题。请务必在 name 属性中为网站上的每个视频使用唯一的文本。

      thumbnailUrl

重复 [URL](https://schema.org/URL)

指向视频独一无二的缩略图文件的网址。请遵循[缩略图准则](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#valid-thumbnail)。

      uploadDate

[DateTime](https://schema.org/DateTime)

视频的首次发布日期和时间，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。我们建议您提供时区信息；否则，我们会默认采用 [Googlebot 使用的时区](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn#timezone)。

    建议属性

        contentUrl

[URL](https://schema.org/URL)

        我们建议您尽可能提供 contentUrl 属性。这是 Google 提取视频内容文件的最有效方式。如果 contentUrl 不可用，请提供 embedUrl 作为替代方法。

指向视频文件实际内容字节的网址，采用一种[受支持的文件类型](https://developers.google.com/search/docs/appearance/video?hl=zh-cn#supported-video-files)。
          不要链接到视频所在的网页；该网址必须是视频文件实际内容字节本身的网址。

```
"contentUrl": "https://www.example.com/video/123/file.mp4"
```

请务必遵循我们的[视频最佳做法](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)。
**提示**：您可以使用 [DNS 反向查找](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot?hl=zh-cn)确保只有 Googlebot 能访问您的内容。

      description

[Text](https://schema.org/Text)

视频的说明。请务必在 description 属性中为网站上的每个视频使用唯一的文本。HTML 标记将被忽略。

      duration

[Duration](https://schema.org/Duration)

视频的时长，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601#Durations)。
          例如，PT00H30M5S 表示时长为“30 分钟零 5 秒”。

        embedUrl

[URL](https://schema.org/URL)

        我们建议您尽可能提供 contentUrl 属性。这是 Google 提取视频内容文件的最有效方式。如果 contentUrl 不可用，请提供 embedUrl 作为替代方法。

指向特定视频的播放器的网址。不要链接到视频所在的网页；该网址必须是视频播放器本身的网址。通常，该信息由 <embed> 元素的 src 属性提供。

```
"embedUrl": "https://www.example.com/embed/123"
```

请务必遵循我们的[视频最佳做法](https://developers.google.com/search/docs/appearance/video?hl=zh-cn)。
**提示**：您可以使用 [DNS 反向查找](https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot?hl=zh-cn)确保只有 Googlebot 能访问您的内容。

      expires
      [DateTime](https://schema.org/DateTime)

视频到期的日期和时间（如果适用，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)）。如果您的视频不会过期，请勿提供此信息。 我们建议您提供时区信息；否则，我们会默认采用 [Googlebot 使用的时区](https://developers.google.com/search/docs/crawling-indexing/googlebot?hl=zh-cn#timezone)。

        hasPart

如果您的视频包含重要片段，请在 VideoObject 中嵌套[必要的 Clip 属性](#clip)。例如：

```
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "VideoObject",
  "name": "Cat video",
  "hasPart": {
    "@type": "Clip",
    "name": "Cat jumps",
    "startOffset": 30,
    "url": "https://www.example.com/example?t=30"
  }
}
</script>
```

      ineligibleRegion

[Place](https://schema.org/Place)

不允许显示该视频的区域（如果适用）。如果未指定，Google 会假定允许在所有地方显示该视频。以 [ISO 3166-1 格式（两个或三个字母）](https://en.wikipedia.org/wiki/ISO_3166-1)指定国家/地区。如要指定多个值，请使用多个国家/地区代码（例如，JSON-LD 数组或微数据中的多个 meta 标记）。

        我们还支持 [regionsAllowed](#regions-allowed) 属性。添加 ineligibleRegion 或 regionsAllowed，具体取决于您的网站。

      interactionStatistic

[InteractionCounter](https://schema.org/InteractionCounter)

视频的观看次数。例如：

```
"interactionStatistic":
  {
    "@type": "InteractionCounter",
    "interactionType": { "@type": "WatchAction" },
    "userInteractionCount": 12345
  }
```

      从 2019 年 10 月起，我们更改了文档以建议使用 interactionStatistic，而非 interactionCount。虽然我们会继续为 interactionCount 提供支持，但我们建议您今后改用 interactionStatistic。

        publication

如果您的视频是直播视频且您希望显示“LIVE”徽章，请在 VideoObject 中嵌套 [BroadcastEvent 属性](#broadcast-event)。例如：

```
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "VideoObject",
  "name": "Cat video",
  "publication": {
    "@type": "BroadcastEvent",
    "name": "First scheduled broadcast",
    "isLiveBroadcast": true,
    "startDate": "2018-10-27T14:00:00+00:00",
    "endDate": "2018-10-27T14:37:14+00:00"
  }
}
</script>
```

      regionsAllowed

[Place](https://schema.org/Place)

允许显示该视频的区域（如果适用）。如果未指定，Google 会假定允许在所有地方显示该视频。以 [ISO 3166-1 格式（两个或三个字母）](https://en.wikipedia.org/wiki/ISO_3166-1)指定国家/地区。
        如要指定多个值，请使用多个国家/地区代码（例如，JSON-LD 数组或微数据中的多个 meta 标记）。

        我们还支持 [ineligibleRegion](#ineligible-region) 属性。添加 ineligibleRegion 或 regionsAllowed，具体取决于您的网站。

### BroadcastEvent

为了能够带有“LIVE”徽章，请在 [VideoObject](#video-object) 中嵌套以下属性。虽然 BroadcastEvent 属性不是必要的，但如果您希望您的视频能够带有“LIVE”徽章，则必须添加以下属性。

如需了解 BroadcastEvent 的完整定义，请访问 [schema.org/BroadcastEvent](https://schema.org/BroadcastEvent)。

  必要属性

      publication

[BroadcastEvent](https://schema.org/BroadcastEvent)

描述视频何时直播。可以是一个列表，也可以是单个实例。

      publication.endDate

[DateTime](https://schema.org/DateTime)

直播结束或预计结束的时间和日期，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。

一旦视频已结束且不再直播，必须提供 endDate。如果在直播开始之前预计的 endDate 未知，我们建议您提供大概的 endDate。

如果 endDate 是过去或现在的日期，表示在线播放实际上已结束且不再直播。如果 endDate 是将来的日期，表示在线播放定于该时间结束。

      publication.isLiveBroadcast

布尔值

          如果视频正在、已经或将要直播，请将此属性设为 true。

      publication.startDate

[DateTime](https://schema.org/DateTime)

直播开始或预计开始的时间和日期，采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)。如果 startDate 是过去或现在的日期，表示在线播放实际上已开始。如果 startDate 是将来的日期，表示在线播放定于该时间开始。

### Clip

  如需告知 Google 要为重要时刻功能使用什么时间戳和标签，请在 [VideoObject](https://developers.google.com/search/docs/appearance/structured-data/video?hl=zh-cn#video-object) 中嵌套以下属性。虽然 Clip 属性并非必需属性，但如果您希望 Google 显示您为视频指定的时间戳和标签，而非 Google 可能会自动显示的视频片段，则必须添加以下属性。

  如需了解 Clip 的完整定义，请访问 [schema.org/Clip](https://schema.org/Clip)。

    必要属性

      name

[Text](https://schema.org/Text)

剪辑内容的描述性标题。

      startOffset

[Number](https://schema.org/Number)

剪辑的开始时间，即从作品开头到剪辑开始之间经过的秒数。

      url

[URL](https://schema.org/URL)

指向剪辑开始时间的网址。

剪辑网址必须指向相同的视频网址路径，但带有用于指定时间的其他查询参数。

例如，以下网址表示视频在 2:00 分钟时开始：

```
"url": "https://www.example.com/example?t=120"
```

    建议属性

      endOffset

[Number](https://schema.org/Number)

剪辑的结束时间，即从作品开头到剪辑结束之间经过的秒数。

### SeekToAction

  如需告知 Google 您的网址结构（以便 Google 能够显示自动识别的视频重要时刻），请在 [VideoObject](#video-object) 中嵌套以下属性。虽然 SeekToAction 属性不是必需属性，但如果您希望 Google 了解您的网址结构，则必须添加以下属性，以便 Google 可以将用户链接到视频中的某个点。

如果您更想自行识别视频中的重要时刻，而不是让 Google 自动识别重要时刻，请使用 [Clip 标记](#clip)，而不是 SeekToAction。

  如需了解 SeekToAction 的完整定义，请访问 [schema.org/SeekToAction](https://schema.org/SeekToAction)。

    必要属性

      potentialAction

[SeekToAction](https://schema.org/SeekToAction)

表示一个可能的操作。包含以下嵌套属性

- [potentialAction.startOffset-input](#start-offset-input)
- [potentialAction.target](#target)

          例如：

```
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "potentialAction" : {
    "@type": "SeekToAction",
    "target": "https://video.example.com/watch/videoID?t={seek_to_second_number}",
    "startOffset-input": "required name=seek_to_second_number"
  }
}
```

      potentialAction.startOffset-input

[Text](https://schema.org/Text)

Google 将识别为时间戳结构并随后替换为要跳到的秒数的占位符字符串。使用以下值：

```
"startOffset-input": "required name=seek_to_second_number"
```

          startOffset-input 是一个带注解的属性。如需了解详情，请参阅 [Potential Actions](https://schema.org/docs/actions.html#part-4) 页面。

      potentialAction.target

[EntryPoint](https://schema.org/EntryPoint)

包含此 VideoObject 的网页对应的网址，其中包括网址结构中的占位符，表示 Google 可以在什么位置插入要在视频中跳到的秒数。
           这就是 Google 理解网址结构的方式以及时间戳的格式。
          将网址的时间戳部分替换为以下占位符字符串：

```
{seek_to_second_number}
```

          例如，替换网址的时间戳部分：

```
"target": "https://video.example.com/watch/videoID?t=30"
```

时间戳现在如下所示：

```
"target": "https://video.example.com/watch/videoID?t={seek_to_second_number}"
```

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