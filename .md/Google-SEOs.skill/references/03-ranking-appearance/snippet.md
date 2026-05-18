# 如何撰写元描述 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/snippet?hl=zh-cn

---

  # 控制搜索结果中的摘要

  “摘要”是指在 Google 搜索及其他 Google 产品和服务（例如 Google 新闻）的搜索结果中显示的描述或摘要部分。**Google 主要根据网页内容来自动确定合适的摘要。如果与其他内容相比，[元描述](#meta-descriptions)元素能够更好地描述网页，我们也可能会使用元描述元素中的描述性信息。

  该图示展示了 Google 搜索中的一条文本搜索结果，其中用突出显示的框圈出摘要部分
  *

汇集缝纫衣物所需的各类用品。位于时装区，营业时间为星期一至星期五上午 8 点至下午 5 点。

尽管我们无法手动更改各个网站的摘要，但我们一直在致力于增强它们的相关性。您可以遵循[创建优质元描述的最佳做法](#meta-descriptions)，帮助改善我们为您的网页显示的摘要的质量。

## 摘要是如何创建的

  摘要是 Google 根据网页内容自动创建的，旨在强调并预先显示与用户的具体搜索查询最相关的网页内容；这意味着 Google 搜索可能会因搜索查询不同而显示不同的摘要。

  摘要主要根据网页内容本身创建。不过，如果与直接从网页获取的内容相比，[元描述](#meta-descriptions) HTML 元素能够为用户提供更准确的网页描述，Google 有时就会使用这种元素。

## 如何阻止摘要的显示或调整摘要长度

您可以阻止 Google 为您的网站创建摘要以及在搜索结果中显示摘要，或者让 Google 了解您所需的摘要长度上限。如需阻止 Google 在搜索结果中为您的网页显示摘要，请使用 [nosnippet 元标记](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#nosnippet)。如需指定摘要的长度上限，请使用 [max-snippet:[number]*](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag?hl=zh-cn#max-snippet) meta 标记。您还可以使用 [data-nosnippet](https://developers.google.com/search/docs/crawling-indexing/special-tags?hl=zh-cn#data-nosnippet) 属性阻止网页的某些部分显示在摘要中。

## 创建优质元描述的最佳做法

Google 有时会利用网页中的 [<meta name="description"> 标记](https://developers.google.com/search/docs/crawling-indexing/special-tags?hl=zh-cn)来生成搜索结果摘要，因为在这些情况中，Google 认为与完全来自网页内容的摘要相比，这样生成的摘要可以为用户提供更准确的描述。元描述标记通常用简短且相关的摘要告知用户特定网页的内容是什么，并引起用户的兴趣。它们像宣传标语一样，旨在让用户确信相应网页正是他们要找的网页。元描述没有长度限制，但 Google 搜索结果中的摘要会在必要时被截断，通常是为了适应设备宽度。

        如果您使用 Wix、WordPress 或 Blogger 等 CMS**，则可能无法直接修改 HTML，也可能不希望修改 HTML。实际上，您的 CMS 可能具有搜索引擎设置页面或其他某种机制，能够将 meta 标记告知搜索引擎。

        如果您要向网站添加 meta 标记，请在您的 CMS 上搜索有关修改网页 <head> 的说明（例如，搜索“wix add meta tags”）。

### 为您网站上的每个网页创建独特的描述

  如果网站上的每个网页都使用相同或相似的描述，当多个网页同时出现在搜索结果中时，这些描述并不会起到很大的帮助。因此，请尽量创建能够准确概括特定网页的描述。您可以在首页或其他汇总页上使用网站级描述，在所有其他网页上使用网页级描述。如果您没有时间为每个网页分别创建描述，请尝试为内容划分优先级；至少为关键网址（例如，首页和热门网页）创建描述。

### 在描述中添加内容相关信息

  元描述并非必须为句子格式，也可以包含关于网页的信息。例如，新闻或博文可以列出作者、发布日期或署名信息。这可为潜在访问者提供相关度非常高的信息，如果没有这些数据，摘要中就不会显示这些信息。同样，产品页也可能包含一些分散在网页各处的重要信息片段，如价格、生产日期、制造商等。恰当的元描述可将所有这些数据汇总在一起。

    例如，下列元描述提供了有关某书籍的详细信息，并且每项信息都被清楚地标记并分隔开来：

**
  <meta name="description" content="作者：A.N.（作家）；插图：V. Gogh；价格：17.99 美元；页数：784 页">

### 以程序化的方式生成描述

  对于某些网站（例如新闻媒体来源），为每个网页生成准确且独特的描述非常简单：由于每篇文章都是手写的，因此再添加一句描述也毫不费力。对于较大型的由数据库驱动的网站，例如商品汇总网站，手写描述则不太实际。不过，在后一种情况下，以程序化方式生成描述较为可行，建议您不妨一试。恰当的描述应当简单易懂，并且不能千篇一律。网页级数据就非常适合以程序化方式生成描述。

  请注意，包含很多长串关键字的元描述不会让用户清楚地了解网页内容，也不太可能显示为摘要。

### 使用高质量的描述

  确保您的描述确实具有描述性。由于元描述不会显示在用户看到的网页中，因此此类内容很容易被忽视。不过，高质量的描述会显示在 Google 的搜索结果中，对提高搜索流量的质量和数量大有裨益。

  下面列举了一些示例来说明如何改进元描述：

  效果欠佳（列出关键字）**：

**
  <meta name="description" content="缝纫用品、纱线、彩色铅笔、缝纫机、线、线轴、针">

  效果较好（说明商店销售什么以及营业时间和位置等详细信息）**：

**
  <meta name="description" content="汇集缝纫衣物所需的各类用品。位于时装区，营业时间为星期一至星期五上午 8 点至下午 5 点。">

  效果欠佳（每篇新闻报道使用相同描述）**：

**
  <meta name="description" content="Whoville 的本地新闻，送货上门。及时了解当天资讯。">

  效果较好（使用特定新闻报道的摘要）**：

**
  <meta name="description" content="在小镇 Whoville，当地一位老年人在一场重要活动前夜偷走了所有人的礼物，使小镇陷入混乱。敬请关注关于此事件的实时动态。">

  效果欠佳（未能概括网页）**：

**
  <meta name="description" content="鸡蛋是每个人生活的欢乐源泉之一。当我还是个小孩子时，我记得曾从鸡舍取走鸡蛋放到厨房。那些日子真幸福。">

  效果较好（概括整个网页）**：

**
  <meta name="description" content="阅读这篇完整指南，了解如何在 1 小时内掌握各类鸡蛋烹饪方法。我们将介绍所有方法，包括：双面煎蛋、单面煎蛋、水煮蛋和煮荷包蛋。">

  效果欠佳（太短）**：

**
  <meta name="description" content="自动铅笔">

  效果较好（具体且详细）**：

  <meta name="description" content="自动削尖的自动铅笔，让你的笔迹更整洁。包含可自动补充的 2B 铅芯。有复古粉色和校车橙色两款。订购 50 支以上免收运费。">

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。