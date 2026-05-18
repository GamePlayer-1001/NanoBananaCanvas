# 了解招聘信息架构标记 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/job-posting?hl=zh-cn

---

  # 职位搜索的招聘信息 (JobPosting) 结构化数据

您可以向招聘信息网页添加 JobPosting 结构化数据来改善求职体验。添加结构化数据后，您的招聘信息将能够以一种特殊的用户体验形式显示在 Google 搜索结果中。此外，您还可以[通过第三方招聘网站](https://jobs.google.com/about/?hl=zh-cn)与 Google 相集成。

  *

对于雇主和招聘网站所有者，这项功能可带来许多好处：

- **更具互动性的搜索结果**：招聘信息能够显示在 Google 上的招聘信息搜索结果中，同时还会显示徽标、评价、评分和职位详细信息。
- **吸引更多积极的求职者**：新的用户体验让求职者可以按各种条件（例如工作地点或职位名称）进行过滤，这意味着您更有可能吸引到正好在寻找相应工作的求职者。
- **曝光和转化几率增加**：求职者将可以通过新的途径与您的招聘信息互动，并点击进入您的网站。

      您的网站是否提供关于其他雇主的评价？**如果是，请添加 [EmployerAggregateRating 结构化数据](https://developers.google.com/search/docs/appearance/structured-data/employer-rating?hl=zh-cn)。

## 如何添加结构化数据

      结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解[结构化数据的运作方式](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn)。

    下面概述了如何构建、测试和发布结构化数据。

1. 确保 Googlebot 能够[高效抓取您的网站](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors?hl=zh-cn#improve_crawl_efficiency)。
2. 如果同一条招聘信息在您的网站上有多个托管在不同网址的副本，请对每个网页副本[使用规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)。
3. 添加[必要属性和建议属性](#structured-data-type-definitions)。根据您使用的格式，了解[在网页上的什么位置插入结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=zh-cn#format-placement)。
      **使用了 CMS？**使用集成到 CMS 中的插件可能更简单。
      **
      使用了 JavaScript？**了解如何[使用 JavaScript 生成结构化数据](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript?hl=zh-cn)。
4. 遵循[技术指南](#technical-guidelines)和[招聘信息内容政策](#content-policies)。
5. 使用[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)验证您的代码。
          您还可以预览结构化数据在 Google 搜索中的显示效果。
6. 部署一些包含您的结构化数据的网页，然后使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以[请求 Google 重新抓取您的网址](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl?hl=zh-cn)。
    **注意**：Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
7. 使用 Indexing API 并提交站点地图，以便通知 Google。
      对于招聘信息网址，我们建议使用 Indexing API 而不是站点地图，因为 Indexing API 会提示 Googlebot 更快地抓取您的网页。使用 [Indexing API](https://developers.google.com/search/apis/indexing-api?hl=zh-cn) 通知 Google 要抓取的新网址，或通知 Google 某个网址上的内容已更新。
不过，我们仍建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)，以便 Google 全面抓取您的整个网站。
         我们会提取整个站点地图，并重新抓取 lastmod 时间晚于上次抓取时间的网页。

## 示例

### 
  标准招聘信息

下面是一个使用 JSON-LD 代码的招聘信息示例。

<html>
  <head>
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "employmentType" : "CONTRACTOR",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "jobLocation": {
      "@type": "Place",
        "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Amphitheatre Pkwy",
        "addressLocality": "Mountain View",
        "addressRegion": "CA",
        "postalCode": "94043",
        "addressCountry": "US"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
        }
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
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "employmentType" : "CONTRACTOR",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "jobLocation": {
      "@type": "Place",
        "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Amphitheatre Pkwy",
        "addressLocality": "Mountain View",
        "addressRegion": "CA",
        "postalCode": "94043",
        "addressCountry": "US"
        }
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
        }
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

### 
  在家办公招聘信息

下面是一个使用 JSON-LD 代码的在家办公招聘信息示例。

<html>
  <head>
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": "USA"
      },
      "jobLocationType": "TELECOMMUTE",
      "employmentType": "FULL_TIME",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
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
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "applicantLocationRequirements": {
        "@type": "Country",
        "name": "USA"
      },
      "jobLocationType": "TELECOMMUTE",
      "employmentType": "FULL_TIME",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
        }
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

## 移除招聘信息

    对于不再接受申请的招聘信息，必须通过以下某种方式使其变为过期状态。如果您未能及时对过期的招聘信息采取措施，我们可能会对其采取[人工处置措施](https://support.google.com/webmasters/answer/2604824?hl=zh-cn)。

如需移除不再接受申请的招聘信息，请按以下步骤操作：

1. 执行以下任一操作，确保您的网页已移除：

- 确保已填写 validThrough 属性，且填写的是过去的时间。
- 移除整个网页（这样一来，当用户请求访问相应网页时，系统会返回 404 或 410 状态代码）。
- 从网页中移除 JobPosting 结构化数据。
2. 及时通知 Google 相关变更：
            对于招聘信息网址，我们建议使用 Indexing API 而不是站点地图，因为相较于从站点地图中移除网址，Indexing API 会提示 Googlebot 更早地抓取您的网页。不过，我们仍建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)，以便 Google 全面抓取您的整个网站。

- 使用 [Indexing API](https://developers.google.com/search/apis/indexing-api?hl=zh-cn) 请求从 Google 搜索索引中移除招聘信息网址。

我们会提取整个站点地图，并重新抓取 lastmod 时间晚于上次抓取时间的网页。

## 标记在家办公的职位

    为了让求职者能更轻松地发现在家办公和远程工作机会，我们建议您为在家办公的职位添加结构化数据。

   下面显示了在家办公的职位在 Google 搜索结果中的显示效果。

    您还可以在Google 搜索中尝试一下：

    [search在家办公的职位](https://www.google.com/search?q=work+from+home+jobs&hl=zh-cn)

  功能可用性**：在搜索结果中的实际显示效果可能会有所不同，并且您可能无法立即看到在家办公的职位出现在您所在地区的搜索结果中。要让在家办公的职位能够显示在该功能对应的搜索结果中，请提前标记在家办公的职位。

有 3 个属性有助于 Google 了解哪些职位为在家办公的职位：

- [jobLocationType](#job-location-type)：可以使用此属性指定职位是在家办公的职位。
- [applicantLocationRequirements](#applicant-location-requirements)：可以使用此属性指定员工可以在哪些地理位置从事在家办公的职位。至少需要指定一个国家/地区。
- [jobLocation](#job-location)：可以使用此属性指定职位的实际工作地点。如果职位没有实际工作地点（例如办公室或建筑工地），则无需使用此属性。请注意，如果使用此属性，则必须指定 addressCountry 属性。

以下是在家办公职位的一些常见情形：

- 员工可以在家工作，但对于员工所在的地点有地理位置限制。员工无需前往实际工作地点或办公室。请使用 applicantLocationRequirements 和 jobLocationType。

```
"applicantLocationRequirements": {
  "@type": "Country",
  "name": "USA"
},
"jobLocationType": "TELECOMMUTE"
```
- 员工可以在位于密歇根州底特律的实际工作地点开展工作，也可以在美国境内的家中工作。请使用 jobLocation 和 jobLocationType。

```
"jobLocation": {
  "@type": "Place",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Detroit",
    "addressRegion": "MI",
    "addressCountry": "US"
  }
 },
"jobLocationType": "TELECOMMUTE"
```
- 员工可以在位于底特律的实际工作地点开展工作，也可以在位于密歇根州或德克萨斯州的家中工作。请使用 jobLocation、jobLocationType 和 applicantLocationRequirements。

```
"jobLocation": {
  "@type": "Place",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "555 Clancy St",
    "addressLocality": "Detroit",
    "addressRegion": "MI",
    "postalCode": "48201",
    "addressCountry": "US"
  }
 },
"applicantLocationRequirements": [{
    "@type": "State",
    "name": "Michigan, USA"
 },{
    "@type": "State",
    "name": "Texas, USA"
 }],
"jobLocationType": "TELECOMMUTE"
```

## 更新公司徽标

在显示您的招聘信息时，Google 会使用贵公司知识图谱卡片中的图片作为徽标。如果您想使用其他徽标，可以[提出更改建议](https://support.google.com/websearch/answer/6325583?hl=zh-cn)，也可以[使用结构化数据](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn#logo)指明您的首选徽标（同时用于贵公司的 Google 知识面板和招聘信息）。

  **注意**：在大多数情况下，Google 会在几天内审核您的请求。

如果您使用了第三方招聘网站，可以为给定组织提供与其 Google 知识面板中不同的徽标图片。Google 会在搜索结果中显示最合适的徽标，有可能是知识面板中的徽标，也可能是 hiringOrganization 徽标。logo 属性只可显示在您的招聘网站上，不会被视为组织的规范徽标。有关详情，请参阅 [hiringOrganization](#hiring)。

## 技术指南

- 尽可能将结构化数据放在最详细的叶级页中。请勿将结构化数据添加到用来显示职位列表的网页（例如搜索结果页），而是要将其添加到描述单个职位且包含相关详情的最具体的网页。
- 为要宣传的每条招聘信息分别添加一个 JobPosting 属性。结构化数据必须显示在职位说明所在的网页中，以便求职者在浏览器中查看。
- 在招聘信息网页中，大多数属性都必须仅出现一次，除非说明中特别指明可多次添加该属性。
- 如果您选择使用站点地图告知 Google 您对招聘信息网址所做的更改，请遵循[站点地图常规指南](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap?hl=zh-cn#general-guidelines)。
         此外，以下站点地图指南也适用于招聘信息网址。

          确保 Googlebot 可以访问站点地图中的网址。请确保您添加到站点地图中的网址未被防火墙阻拦或未被 robots.txt 文件禁止。
- 尽可能为 （站点地图）、
 (RSS) 或  (Atom) 值提供准确的时间，以指明添加或更改网页的时间。这个值必须是网址内容最后变动的时间。请务必使用准确的时间；抓取带宽有限，准确的时间有助于我们避免重新抓取没有更改的网页。此外，Google 需要抓取的网页越多，给您的服务器带来的负荷就越重。
- 请勿在站点地图中纳入搜索结果页、列表页面或其他动态网页。
- 站点地图中的网址必须包含每条招聘信息的[规范网页](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)。

## 
      招聘信息内容政策

      我们制定了招聘信息内容政策，确保我们的用户能找到相关且易于申请的空缺职位。[结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)和 [Google 网页搜索网络垃圾政策](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn)也适用于招聘信息。一旦发现违反这些政策的内容，我们会采取适当的措施，可能包括执行[手动操作](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)以及从 Google 上的招聘信息搜索结果中移除相关招聘信息。

### 内容不相关

      JobPosting 标记只能用于包含一条招聘信息的网页。我们不允许在任何其他网页（包括未列出任何职位的网页）中使用 JobPosting 标记。

### 
      内容不完整

      我们不允许发布职位说明不完整的招聘信息。

### 虚假陈述

      我们不允许在招聘信息中试图冒充其他人员或组织，或以其他方式从事旨在欺骗、欺诈或误导他人的活动。虚假陈述包括暗示与其他个人或组织有关联，或获得了其他个人或组织的认可，但事实并非如此。还包括使用多个账号规避我们的政策、绕过屏蔽或以其他方式打破对您的账号设置的限制。

      政策违规行为示例包括：

- 招聘信息或内容中描述雇主的部分不准确、不符合实际或不真实。
- 招聘信息中的职位是假的或不存在。这包括主要目的是收集申请者的信息而非寻求聘用申请者的招聘信息。
- 使用[关键字堆砌](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#keyword-stuffing)来操纵搜索排名的职位名称、说明和其他详情。
- 提供与实际工作地点不符的虚假位置数据。
- 在未经授权的情况下代表组织或公司发布招聘信息。

### 亵渎和粗俗的语言

      我们不允许在招聘信息中包含淫秽、亵渎或攻击性的语言。

### 伪装成招聘信息的广告

      我们不允许将宣传内容伪装成招聘信息，例如由第三方（如[联属计划](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#thin-affiliate-pages)）发布的内容。

### 法律移除要求

      如果 Google 收到关于招聘信息中的内容可能违法的投诉，我们将根据[搜索政策](https://support.google.com/legal/answer/3110420?hl=zh-cn)处理该招聘信息。

### 招聘信息已过期

      我们不允许存在过期的招聘信息。最好从您的网站中[移除过期的招聘信息](#remove-job-postings)。如果您不希望移除它们，则需要确保已提供 validThrough 属性，且提供的是过去的时间。这有助于用户仅查看仍在招人的招聘信息。

### 职位缺少申请方式

      我们不允许招聘信息没有申请方式。其中包括：

- 宣传招聘会邀请等活动的招聘信息。
- 要求登录才能查看职位说明的招聘信息。用户必须能够无需登录即可查看招聘信息详情。

### 简历收集

      发布商只能针对空缺职位请求收集简历。我们可能会移除仅收集求职者数据、但当前并不招人的请求。

### 求职申请

      招聘信息必须说明空缺职位，包括所需的资格要求，以及与求职用户相关的其他信息。我们不允许求职者在招聘信息中主动提出担任某项职位。

### 要求付款

      我们不允许招聘信息要求应聘者付款。

### 
      编辑内容

      为确保我们的用户可以理解您的内容并轻松申请职位，我们不允许内容中充斥着会造成妨碍的文字和图片、过多且会分散注意力的广告，以及对招聘信息毫无增值作用的内容。

      我们不允许发布语法不正确的内容。请遵循适用于您内容语言或书写系统的基本语法规则（例如，适当进行大写，避免所有文字全都大写），并且仅使用大家熟知的首字母缩写词或缩写。

## 结构化数据类型定义

本部分介绍了与招聘信息相关的结构化数据类型。

若要使您的内容能够显示在 Google 上的招聘信息搜索结果中，您必须为其添加必要的属性。您还可添加建议属性，以便添加与您的内容相关的更多信息，进而提供更好的用户体验。

### JobPosting

      如需了解 JobPosting 的完整定义，请访问 [schema.org/JobPosting](https://schema.org/JobPosting)。
      Google 支持的属性包括：

          必要属性

          datePosted

[Date](https://schema.org/Date)

雇主发布招聘信息的最初日期（采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)）。
              例如，“2017-01-24”或“2017-01-24T19:33:17+00:00”。

```
"datePosted": "2016-02-18"
```

          description

[Text](https://schema.org/Text)

完整的职位说明（HTML 格式）。

description 必须是对职位的完整说明，包括工作职责、资格要求、技能要求、工作时长、教育背景要求和经验要求。description 不能与 title 相同。

其他指南：

- 说明必须采用 HTML 格式。
- 至少要使用 **、
 或 \n 划分段落。
- 该功能可识别以下 HTML 标记：、 和 。
- 该功能无法识别标头和字符级标记，例如 、 和 。标记不会影响功能中的格式，因此您可以放心地将其添加到网页上。

          hiringOrganization
          [Organization](https://schema.org/Organization)

提供相应职位的单位。它必须是公司名称（例如，“Starbucks, Inc”），而不是正在招人的具体地点（例如，“主街上的星巴克”）。例如：

```
"hiringOrganization": {
  "@type": "Organization",
  "name": "MagsRUs Wheel Company",
  "sameAs": "http://www.magsruswheelcompany.com"
}
```

              如果组织以匿名方式招聘员工（例如，代表匿名雇主或雇主直接在您的平台上招聘的人事机构），请针对 hiringOrganization.name 字段使用 confidential 值。 例如：

```
"hiringOrganization": {
  "@type": "Organization",
  "name": "confidential"
}
```

第三方招聘网站上的徽标**

如果您使用了第三方招聘网站，可以为给定组织提供与其 Google 知识面板中不同的徽标图片。若要请求为招聘组织使用其他徽标，请将徽标属性添加到 hiringOrganization 数组。对于 JobPosting 结构化数据，图片的宽高比必须介于 0.75 到 2.5 之间。
              请务必遵循[徽标图片指南](https://developers.google.com/search/docs/appearance/structured-data/organization?hl=zh-cn#logo)和[公司徽标指南](#company-logo)。例如：

```
"hiringOrganization": {
  "@type": "Organization",
  "name": "MagsRUs Wheel Company",
  "sameAs": "http://www.magsruswheelcompany.com",
  "logo": "https://www.example.com/images/logo.png"
}
```

        jobLocation

[Place](https://schema.org/Place)

员工上班的实际工作地点（例如办公室或工作场所），而不是发布招聘信息的地点。请添加尽可能多的属性。您提供的属性越多，招聘信息对用户来说质量就越高。请注意，您必须添加 addressCountry 属性。例如：

```
"jobLocation": {
  "@type": "Place",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "555 Clancy St",
    "addressLocality": "Detroit",
    "addressRegion": "MI",
    "postalCode": "48201",
    "addressCountry": "US"
  }
}
```

**多个实际工作地点**

如果职位有多个工作地点，请以数组的方式添加多个 jobLocation 属性。Google 会根据求职者的查询内容显示最合适的工作地点。

**远程职位**

对于员工可以或必须始终远程工作的职位，您必须使用 [jobLocationType](#job-location-type)。如果存在 [applicantLocationRequirements](#applicant-location-requirements)，则无需使用 jobLocation
           属性。

      title

[Text](https://schema.org/Text)

职位名称（而非招聘信息标题）。例如，“软件工程师”或“咖啡师”。例如：

```
"title": "Software Engineer"
```

最佳做法：

- 此属性必须仅填入职位名称。
- 请勿在 title 属性中包含职位代码、地址、日期、工资或公司名称。
**不建议**：立即申请 IT 职位 - 位于布加勒斯特，会说法语

**建议**：市场专员，会说法语
- 提供简单明了的职位名称。
- 不要过度使用 ! 和 * 等特殊字符。滥用特殊字符可能会导致系统将您的结构化数据视为[垃圾性质的结构化标记](https://support.google.com/webmasters/answer/3498001?ref_topic=6003164&hl=zh-cn)。可以使用数字以及 / 和 - 等字符。

**不建议**：*** 仓库正在招聘工作人员！！有公交可抵达！！***

**建议**：仓库发货和收货助理
- 不要使用 name，而是使用 title。title 和 name 属性不可互换。
- 如果是第三方招聘网站，请不要尝试按照相应[指南](#guidelines)修改职位名称，否则可能会导致系统无法读取职位名称。请提供雇主指定的职位名称。

    建议属性

      applicantLocationRequirements

[AdministrativeArea](https://schema.org/AdministrativeArea)

指定员工可以在哪些地理位置从事在家办公的工作。职位说明中必须明确指出只有位于特定地理位置的求职者符合申请条件。如果求职者位于一个或多个地理位置，且该职位必须远程工作，则此属性为必需属性。

以下示例表明相应职位允许在美国境内的任何地点远程工作：

```
"applicantLocationRequirements": {
  "@type": "Country",
  "name": "USA"
},
"jobLocationType": "TELECOMMUTE"
```

以下示例表明职位允许在加拿大境内远程工作，也允许在位于密歇根州底特律的实际工作地点开展工作：

```
"jobLocation": {
  "@type": "Place",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "555 Clancy St",
    "addressLocality": "Detroit",
    "addressRegion": "MI",
    "postalCode": "48201",
    "addressCountry": "US"
  }
 },
"applicantLocationRequirements": {
    "@type": "Country",
    "name": "Canada"
 },
"jobLocationType": "TELECOMMUTE"
```

         baseSalary

[MonetaryAmount](https://schema.org/MonetaryAmount)

职位的实际基本工资，由雇主提供（非估算工资）。

**注意**：只有雇主能够提供 baseSalary。

对于 [QuantitativeValue](https://schema.org/QuantitativeValue) 的 unitText，请使用以下某个值（区分大小写）：

- HOUR
- DAY
- WEEK
- MONTH
- YEAR

例如：

```
"baseSalary": {
  "@type": "MonetaryAmount",
  "currency": "USD",
  "value": {
    "@type": "QuantitativeValue",
    "value": 40.00,
    "unitText": "HOUR"
  }
}
```

如需指定工资范围，请定义 minValue 和 maxValue，而非定义单个 value。例如：

```
"baseSalary": {
  "@type": "MonetaryAmount",
  "currency": "USD",
  "value": {
    "@type": "QuantitativeValue",
    "minValue": 40.00,
    "maxValue": 50.00,
    "unitText": "HOUR"
  }
}
```

      directApply

[Boolean](https://schema.org/Boolean)

表明与此招聘信息相关联的网址是否为相应职位启用了直接申请功能。

        鉴于我们仍在开发此类信息的使用方式，您可能不会立即在 Google 搜索中看到任何外观或效果变化。

我们将根据用户申请职位所需的操作判断是否为直接申请体验。直接申请体验是指用户只需在您的页面上完成简短的申请流程，无需完成不必要的中间步骤。如果用户需要点击“申请”，填写申请表，在申请过程中登录多次，这意味着您提供的申请体验算不上直接申请。

          如果您提供下列某种体验，则该体验可能属于直接申请体验：

- 用户在您的网站上完成申请流程。
- 用户从 Google 到达您的网页后，无需多次点击“申请”并提供用户信息即可完成申请流程
- 招聘信息包括申请方式说明（例如，招聘信息中列出了电子邮件地址、电话号码或供求职者提交申请的实际地址），或直接安排与雇主面试。这些说明必须介绍的是如何直接与招聘相应职位的实际公司或其代表联系。

      employmentType

[Text](https://schema.org/Text)

雇佣类型。例如：

```
"employmentType": "CONTRACTOR"
```

选择以下一个或多个值（区分大小写）：

- FULL_TIME：该职位是全职职位。
- PART_TIME：该职位是兼职职位。
- CONTRACTOR：该职位是承包商职位。
- TEMPORARY：该职位是临时职位。
- INTERN：该职位是实习职位。
- VOLUNTEER：该职位是志愿者职位。
- PER_DIEM：该职位按天支付薪酬。
- OTHER：该职位是另一种类型的职位，不属于任何其他可能的值。

您可以添加多个 employmentType 属性。例如：

```
"employmentType": ["FULL_TIME", "CONTRACTOR"]
```

      identifier

[PropertyValue](https://schema.org/PropertyValue)

招聘组织为职位提供的唯一标识符。

例如：

```
"identifier": {
  "@type": "PropertyValue",
  "name": "MagsRUs Wheel Company",
  "value": "1234567"
}
```

      jobLocationType

[Text](https://schema.org/Text)

对于员工可以或必须始终远程工作（在家中或自行选择的其他地点）的职位，请将此属性设为值 TELECOMMUTE。除了添加 jobLocationType 外，职位说明中还必须明确指出这是始终远程工作的职位。如果是始终远程工作的职位，则必须使用 jobLocationType 属性。

**要求**

- 标记为 TELECOMMUTE 的职位必须是始终远程工作的职位。如果职位允许偶尔在家工作、将远程工作作为一项可协商的福利或有其他不是始终远程工作的安排，请勿使用此标记。职位的“零工经济”性质并不暗示着它是或不是远程职位。
- 您必须指定求职者可以开展工作的至少一个国家/地区：最好使用 [applicantLocationRequirements](#applicant-location-requirements) 指定，也可以默认使用 jobLocation 所在的国家/地区（前提是刚好也有在实际工作地点工作的选项）。如果远程职位不包含 applicantLocationRequirements，则 Google 会向 jobLocation 中指定的国家/地区内的所有人显示该职位。

以下示例表明员工可以在位于亚利桑那州图森的工作场所上班，也可以在美国境内远程工作：

```
"jobLocation": {
  "@type": "Place",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Tucson",
    "addressRegion": "AZ",
    "addressCountry": "US"
  }
 },
"jobLocationType": "TELECOMMUTE"
```

        Google 继续支持使用 TELECOMMUTE 作为 jobLocation of additionalProperty。虽然我们近期尚无弃用 additionalProperty 的计划，但建议您尽可能使用新架构。

      validThrough

[DateTime](https://schema.org/DateTime)

        **注意**：对于有失效日期的招聘信息，这是必需的属性。

招聘信息的过期日期（采用 [ISO 8601 格式](https://en.wikipedia.org/wiki/ISO_8601)）。例如，“2017-02-24”或“2017-02-24T19:33:17+00:00”。例如：

```
"validThrough": "2017-03-18T00:00"
```

如果招聘信息永不过期，或者您不知道招聘信息何时过期，请不要添加此属性。如果在招聘信息过期之前招到合适的人员，请[移除招聘信息](#remove)。

### 
      教育背景和经验属性（Beta 版）

      除了建议的 JobPosting 属性之外，您还可以添加以下 Beta 版属性，以便添加更多与招聘信息的教育背景和经验相关的信息。
      鉴于我们仍在开发此类信息的使用方式，您可能不会立即在 Google 搜索中看到任何外观或效果变化。

下面是一个要求具有学士学位和三年工作经验的招聘信息示例。

<html>
  <head>
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "educationRequirements" : {
        "@type" : "EducationalOccupationalCredential",
        "credentialCategory" : "bachelor degree"
      },
      "experienceRequirements" : {
        "@type" : "OccupationalExperienceRequirements",
        "monthsOfExperience" : "36"
      },
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "employmentType" : "CONTRACTOR",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Amphitheatre Pkwy",
        "addressLocality": ", Mountain View",
        "addressRegion": "CA",
        "postalCode": "94043",
        "addressCountry": "US"
        }
      },
     "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
        }
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
    <title>Software Engineer</title>
    <script type="application/ld+json">
    {
      "@context" : "https://schema.org/",
      "@type" : "JobPosting",
      "title" : "Software Engineer",
      "educationRequirements" : {
        "@type" : "EducationalOccupationalCredential",
        "credentialCategory" : "bachelor degree"
      },
      "experienceRequirements" : {
        "@type" : "OccupationalExperienceRequirements",
        "monthsOfExperience" : "36"
      },
      "description" : "<p>Google aspires to be an organization that reflects the globally diverse audience that our products and technology serve. We believe that in addition to hiring the best talent, a diversity of perspectives, ideas and cultures leads to the creation of better products and services.</p>",
      "identifier": {
        "@type": "PropertyValue",
        "name": "Google",
        "value": "1234567"
      },
      "datePosted" : "2024-01-18",
      "validThrough" : "2024-03-18T00:00",
      "employmentType" : "CONTRACTOR",
      "hiringOrganization" : {
        "@type" : "Organization",
        "name" : "Google",
        "sameAs" : "https://www.google.com",
        "logo" : "https://www.example.com/images/logo.png"
      },
      "jobLocation": {
        "@type": "Place",
        "address": {
        "@type": "PostalAddress",
        "streetAddress": "1600 Amphitheatre Pkwy",
        "addressLocality": ", Mountain View",
        "addressRegion": "CA",
        "postalCode": "94043",
        "addressCountry": "US"
        }
      },
     "baseSalary": {
        "@type": "MonetaryAmount",
        "currency": "USD",
        "value": {
          "@type": "QuantitativeValue",
          "value": 40.00,
          "unitText": "HOUR"
        }
      }
    }
    </script>
  </head>
  <body>
  </body>
</html>
```

          建议属性（Beta 版）

          educationRequirements

[EducationalOccupationalCredential](https://schema.org/EducationalOccupationalCredential) 或 [Text](https://schema.org/Text)

招聘信息所要求的教育背景。如果没有任何教育背景要求，请使用 no requirements 值。如果您不了解教育背景要求，请勿添加此属性。

          此属性可以重复（以数组形式）。例如：

```
"educationRequirements": [
  {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "bachelor degree" },
  {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "postgraduate degree"
  }
]
```

      educationRequirements.credentialCategory

          [Text](https://schema.org/Text)

招聘信息所要求的受教育水平。请使用以下某个值：

- high school：该职位需要高中教育学历。
- associate degree：该职位需要副学士学位。
- bachelor degree：该职位需要学士学位。
- professional certificate：该职位需要专业证书。
- postgraduate degree：该职位需要研究生学位。

        列表中的值可能并不适用于所有国家/地区；您可以选择最接近的等同项。

          除了添加此属性之外，请继续在 [description](#description) 属性中补充教育背景要求。

      experienceRequirements

[OccupationalExperienceRequirements](https://schema.org/OccupationalExperienceRequirements) 或 [Text](https://schema.org/Text)

招聘信息所要求的经验。如果没有任何要求，请使用 no requirements 值。

          除了添加此属性之外，请继续在 [description](#description) 属性中补充经验要求。

      experienceRequirements.monthsOfExperience

[Number](https://schema.org/Number)

招聘信息所要求的经验水平的最低月数。

          如果经验要求较为复杂，请指定在这些要求当中，求职者必须达到的最低月数。例如：

- 担任主厨 12 个月**或**担任副厨 24 个月：这表示求职者必须具备两种经验之一，最低要求为 12 个月。
- 担任主厨 12 个月**并且**担任副厨 24 个月：这表示求职者需要满足所有给定要求，最低要求为 24 个月。

      experienceInPlaceOfEducation

布尔值

如果设置为 true，则此属性表示该招聘信息是否接受以工作经验代替正式教育背景。如果设置为 true，则必须同时添加 experienceRequirements 和 educationRequirements 属性。

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

如果您的招聘信息没有显示在招聘信息搜索结果中，或者您在 Search Console 中收到关于网站因存在[垃圾结构化标记](https://support.google.com/webmasters/answer/3498001?ref_topic=6003164&hl=zh-cn)而遭受人工处置措施的警告，请尝试解决最常见的问题。如果您仍然遇到问题，请务必[查看我们的指南](#guidelines)。

### 结构化数据位于错误的网页上

error* 导致问题的原因**：职位列表页面（包含一条或多条招聘信息的搜索结果页）包含 JobPosting 结构化数据。JobPosting 结构化数据只能位于招聘信息页面（包含单个职位且不是搜索结果页的页面）上。您可能收到了以下 Search Console 消息：“违反了结构化数据政策 - 列表页面不得包含单个职位的结构化数据。”

*done* **解决问题**

1. 从列表页面中移除 JobPosting 结构化数据。只能将 JobPosting 结构化数据放在专门用于发布单条招聘信息的网页上。
2. 解决问题后，请[提交网站以供重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

### 内容与结构化数据不匹配

*error* **导致问题的原因**：网页包含的内容与该网页上的结构化数据不匹配。例如，该网页上某个职位的名称与为 title 属性列出的值不匹配。此外，该网页上也可能存在垃圾内容，例如点击诱饵类的标题和说明、貌似虚假的职位，或者[招聘信息不代表](#misrepresentation)实际工作。

      另一个例子是薪资出现在标记中，但没有出现在招聘信息页面中。这也违反了内容指南，因为标记中的所有信息都必须显示在招聘信息页面上。

      如需查看完整的示例列表，请参阅[我们的内容政策](#content-policies)中的示例。您可能收到了以下 Search Console 消息：“违反了结构化数据政策 - 我们发现网页上的内容与网页上的结构化数据不同。”

*done* **解决问题**

1. 确认结构化数据与网页上的实际内容一致、代表要实际从事的工作，并且不会误导用户。
2. 使用[网址检查工具](https://support.google.com/webmasters/answer/9012289?hl=zh-cn)确保相关内容在呈现的网页上可见（呈现的网页是指向 Google 呈现的网页）。
3. 解决问题后，请[提交网站以供重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

### 过期职位仍旧存在

*error* **导致问题的原因**：虽然职位已过期，但用户仍可通过 Google 上的招聘信息搜索结果访问相应网页。通常，这是由以下原因所致：

- validThrough 属性缺失或未设为过去的时间。
- 相应网页仍旧存在。
- 招聘信息的申请选项流程定向到过期的招聘信息网页。
- 虽然职位已过期，但相应网页上仍然存在 JobPosting 结构化数据。

您可能收到了以下 Search Console 消息：“违反了结构化数据政策 - 过期的职位仍有对应的 JobPosting 结构化数据。”

*done* **解决问题**

1. 执行以下任一操作，移除过期的招聘信息：

- 确保已填写 validThrough 属性，且填写的是过去的时间。
- 移除整个网页（这样一来，当用户请求访问相应网页时，系统会返回 404 或 410 状态代码）。
- 从网页中移除 JobPosting 结构化数据。
2. 使用 [Indexing API](https://developers.google.com/search/apis/indexing-api?hl=zh-cn) 通知 Google。对于招聘信息网址，我们建议使用 Indexing API 而不是站点地图，因为相较于从站点地图中移除网址，Indexing API 会提示 Googlebot 更早地抓取您的网页。不过，我们仍建议您[提交站点地图](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview?hl=zh-cn)，以便 Google 全面抓取您的整个网站。
3. 解决问题后，请[提交网站以供重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

### 申请选项缺失

*error* **导致问题的原因**：用户无法在招聘信息网页上申请职位。您可能收到了以下 Search Console 消息：“违反了结构化数据政策 - 无法在招聘网页上提交申请。”

*done* **解决问题**

1. 确保用户可以在网页上申请职位。
2. 解决问题后，请[提交您的网站以供重新审核](https://support.google.com/webmasters/answer/35843?hl=zh-cn)。

### 徽标不正确

*error* **导致问题的原因**：您的网站没有 Google 知识面板，或知识面板显示的网站徽标不正确。在显示您的招聘信息时，Google 会使用贵公司知识面板卡片中的图片作为徽标。如需详细了解 Google 如何选择您的徽标，请参阅[更新您的公司徽标](#company-logo)。

*done* **解决问题**

您可以通过以下两种方式解决此问题：

- **务必使用 [hiringOrganization.logo](#hiring) 属性指定正确的徽标**。
        确保图片的宽高比介于 0.75 到 2.5 之间。
        更新结构化数据比更新 Google 知识面板更快，并且不需要进行知识面板验证。
- **[提出更改](https://support.google.com/posts/answer/7534842?hl=zh-cn)知识面板的建议**。更新知识面板可让您更好地控制贵组织在 Google 中的显示效果，不过可能需要的时间较长。如果您需要快速解决徽标问题，请添加 [hiringOrganization.logo](#hiring) 属性。

### 工作地点缺失或不正确

*error* **导致问题的原因**：Google 无法理解您为 jobLocation、addressLocality 或 addressRegion 属性提供的值。Google 尝试将工作地点信息与实际地点进行匹配，但您没有提供工作地点或提供的工作地点不正确。

*done* **解决问题**

1. 确保结构化数据包含 jobLocation、addressLocality 或 addressRegion 的值（取决于工作地点，并非所有工作地点属性都适用）。
        我们建议您添加尽可能多的工作地点属性。您提供的属性越多，招聘信息对用户来说质量就越高。
2. 验证工作地点问题是否已解决：

        打开[富媒体搜索结果测试](https://search.google.com/test/rich-results?hl=zh-cn)。
3. 在“抓取网址”方框中输入招聘信息网址。
4. 点击**验证**。
5. 点击**预览**。

**成功**：富媒体搜索结果测试在 Google 搜索预览工具中显示正确的工作地点。

**重试**：富媒体搜索结果测试在 Google 搜索预览工具中针对工作地点显示“false”。确保工作地点为真实地点。

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

### 
      在 Google Analytics 中使用自定义 UTM 参数

使用我们的自定义 [UTM 参数](https://support.google.com/analytics/answer/1037445?hl=zh-cn)跟踪用户从招聘信息详情页面定向到您的网站后用户的访问次数。您可以将这些参数与 [Google Analytics ](https://google.com/analytics?hl=zh-cn)或其他第三方跟踪工具一起使用：

```
utm_campaign=google_jobs_apply
```

```
utm_source=google_jobs_apply
```

```
utm_medium=organic
```

如果您的网站流量出现意外波动或不一致的情况，请使用[问题排查工具](https://support.google.com/analytics/troubleshooter/7480067?hl=zh-cn)找出问题并加以解决。

## 推出地区

我们非常高兴能够向全球更多地区的用户提供在 Google 上搜索招聘信息的体验。目前，我们已在以下地区推出这一体验。

- **亚洲**：已在以下国家/地区推出：

      孟加拉
- 香港
- 印度
- 印度尼西亚
- 日本
- 哈萨克斯坦
- 吉尔吉斯斯坦
- 马来西亚
- 巴基斯坦
- 菲律宾
- 新加坡
- 斯里兰卡
- 台湾
- 泰国
- 乌兹别克斯坦
- 越南

  **欧洲**：已在以下国家/地区推出：

- 奥地利
- 白俄罗斯
- 比利时
- 丹麦
- 法国
- 德国
- 希腊
- 意大利
- 荷兰
- 葡萄牙
- 俄罗斯
- 西班牙
- 瑞士
- 英国

  **拉丁美洲**：已在整个地区推出
  **中东和北非**：已在以下国家/地区推出：

- 阿尔及利亚
- 巴林
- 埃及
- 伊拉克
- 约旦
- 科威特
- 黎巴嫩
- 利比亚
- 摩洛哥
- 阿曼
- 巴勒斯坦
- 卡塔尔
- 沙特阿拉伯
- 突尼斯
- 阿拉伯联合酋长国

  **北美洲**：已在整个地区推出
  **撒哈拉以南非洲**：已在整个地区推出

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。