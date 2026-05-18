> 原文链接: https://example.com/items.shtm?products=fish

---

---
source: https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
---

# 管理对分面导航网址的抓取

- 首页
- Crawling infrastructure
- 文档

# 管理对分面导航网址的抓取

分面导航是网站的常见功能，可让访问者更改内容（例如产品、文章或活动）在网页上的显示方式。这是一种常用且实用的功能，但其最常见的实现方式（基于网址参数）可能会生成无限的网址空间，并通过以下几种方式损害网站：

- 过度抓取：由于为分面导航创建的网址似乎是新创建的，并且抓取工具无法在先抓取网址之前确定这些网址是否有用，因此抓取工具通常会在确定这些网址实际上无用之前访问大量分面导航网址。
- 发现抓取速度变慢：基于前一点，如果抓取速度因抓取无用网址而变慢，抓取工具用于抓取有用新网址的时间就会减少。

典型的分面导航网址在查询字符串中可能包含与过滤的内容属性相关的各种参数。例如：

```
https://example.com/items.shtm?products=fish&color=radioactive_green&size=tiny
```

更改网址参数 products、color 和 size 中的任意一个，都会在底层网页上显示一组不同的内容。这通常意味着过滤条件的可能组合数量非常庞大，从而导致潜在网址数量非常庞大。为了节省资源，我们建议您通过以下任一方式处理这些网址：

```
products
```

```
color
```

```
size
```

- 如果您不需要将分面导航网址编入索引，请禁止 Google 抓取这些网址。
- 如果您需要将分面导航网址编入索引，请确保这些网址遵循下一部分中概述的最佳实践。请注意，由于渲染这些网页需要大量网址和操作，因此抓取分面网址往往会消耗网站大量的计算资源。

## 防止 Google 抓取分面导航网址

如果您想节省服务器资源，并且不需要分面导航网址显示在 Google 搜索结果或其他 Google 产品中，可以通过以下任一方式阻止 Google 抓取这些网址。

- 使用 robots.txt 禁止抓取分面导航网址。通常情况下，没必要允许抓取过滤后的内容，因为这会消耗服务器资源，而没有或几乎没有任何好处；相反，可以只允许抓取单个内容的网页以及一个专门的列表页面，其中显示未应用过滤条件的所有内容。user-agent: Googlebot
disallow: /*?*products=
disallow: /*?*color=
disallow: /*?*size=
allow: /*?products=all$
- 使用网址片段指定过滤条件。
Google 搜索在抓取和编制索引时通常不支持网址片段。
    如果您的过滤机制基于网址片段，则不会对抓取产生任何影响（无论是正面还是负面）。例如，使用网址片段而非网址参数：
https://example.com/items.shtm#products=fish&color=radioactive_green&size=tiny

```
user-agent: Googlebot
disallow: /*?*products=
disallow: /*?*color=
disallow: /*?*size=
allow: /*?products=all$
```

```
https://example.com/items.shtm#products=fish&color=radioactive_green&size=tiny
```

表明希望（不）抓取哪些分面导航网址的其他方式包括使用 rel="canonical" link 元素和 rel="nofollow" 锚标记属性。不过，从长期来看，这些方法的效果通常不如前面提到的方法。

```
rel="canonical"
```

```
link
```

```
rel="nofollow"
```

- 随着时间的推移，使用 rel="canonical" 指定哪个网址是分面导航网址的规范版本可能会降低这些网址非规范版本的抓取量。例如，如果您有 3 种过滤网页类型，不妨将 rel="canonical" 指向未过滤版本：https://example.com/items.shtm?products=fish&color=radioactive_green&size=tiny 指定 。
- 在指向过滤结果页面的锚标记上使用 rel="nofollow" 属性可能会有所帮助，但请注意，指向特定网址的每个锚标记都必须具有 rel="nofollow" 属性，才能使其生效。

```
rel="canonical"
```

```
rel="canonical"
```

```
https://example.com/items.shtm?products=fish&color=radioactive_green&size=tiny
```

```

```

```
rel="nofollow"
```

```
rel="nofollow"
```

## 确保根据最佳实践创建分面导航网址

如果您需要系统抓取分面导航网址并编入索引，请确保您遵循以下最佳实践，以尽量减少抓取您网站上大量潜在网址所带来的负面影响：

- 使用行业标准网址参数分隔符“&”。像英文逗号 (,)、分号 (;) 和方括号（[ 和 ]）这样的字符很难被抓取工具检测为参数分隔符（因为它们通常不是分隔符）。
- 如果您在网址路径中编码过滤条件，例如 /products/fish/green/tiny，请确保过滤条件的逻辑顺序始终保持不变，并且不存在重复的过滤条件。
- 当过滤条件组合未返回结果时，返回 HTTP 404 状态代码。
    如果网站目录中没有绿色的鱼，用户和抓取工具应该会收到“找不到网页”错误，并显示相应的 HTTP 状态代码 (404)。如果网址包含重复的过滤条件或其他无意义的过滤条件组合，以及不存在的分页网址，也应该会出现这种情况。同样，如果过滤条件组合没有结果，请勿重定向到常见的“找不到网页”错误页面。相反，应该在遇到该网址时，提供“找不到网页”错误，并返回 404 HTTP 状态代码。

      如果您的应用是单页应用，则可能无法实现此目的。
      请遵循单页应用的最佳实践。

```
&
```

```
,
```

```
;
```

```
[
```

```
]
```

```
/products/fish/green/tiny
```

```
404
```

```
404
```

```
404
```