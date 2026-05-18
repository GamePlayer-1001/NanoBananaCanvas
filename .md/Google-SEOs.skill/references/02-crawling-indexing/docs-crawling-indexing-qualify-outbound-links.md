---

---
source: https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
---

# 向 Google 说明您的出站链接的用意

- 

# 向 Google 说明您的出站链接的用意

对于您网站上的某些链接，您可能需要向 Google 说明您的网站与链接页之间的关系。为此，请在  标记中使用下列 rel 属性值之一。

```

```

```
rel
```

对于您希望 Google 无任何限定条件便直接提取和解析的常规链接，您无需添加 rel 属性。例如：

```
rel
```

```

My favorite horse is the [palomino](https://horses.example.com/Palomino).

```

对于其他链接，请使用以下一个或多个值：

```
rel
```

### rel="sponsored"

```
rel="sponsored"
```

请使用 sponsored 值标记广告链接或付费展示位置链接（通常称为“付费链接”）。详细了解 Google 对付费链接的态度。

```
sponsored
```

```
[Appenzeller](https://cheese.example.com/Appenzeller_cheese)
```

```
nofollow
```

```
sponsored
```

### rel="ugc"

```
rel="ugc"
```

建议您使用 ugc 值标记用户生成的内容（例如评论和论坛帖子）的链接。

```
ugc
```

```
[Appenzeller](https://cheese.example.com/Appenzeller_cheese)
```

如果您想对值得信赖的贡献者（始终如一地做出高质量贡献的成员或用户）表示认可和奖励，则可从他们发布的链接中移除此属性。 详细了解如何防止网站和平台存在用户生成的垃圾内容。

### rel="nofollow"

```
rel="nofollow"
```

如果其他值不适用，并且您希望 Google 不跟踪您网站上的出站链接，或不从您的网站上抓取链接页，请使用 nofollow 值。对于您网站中的链接，请使用 robots.txt disallow 规则。

```
nofollow
```

```
disallow
```

```
[Appenzeller](https://cheese.example.com/Appenzeller_cheese)
```

### 多个值

您可以使用以空格或英文逗号分隔的列表，指定多个 rel 值。示例：

```
rel
```

```

I love [Appenzeller](https://cheese.example.com/Appenzeller_cheese) cheese.

```

```

I hate [Blue](https://cheese.example.com/blue_cheese) cheese.

```

Google 通常不会跟踪标有这些 rel 属性的链接。请注意，链接页也可能经由其他途径找到（例如站点地图或其他网站的出站链接），因此仍有可能被抓取。这些 rel 属性仅能在 Google 可抓取的  元素中使用，但 nofollow 除外，该属性还可用作漫游器 meta 标记。

```
rel
```

```
rel
```

```

```

```
nofollow
```

```
meta
```

如果您不想让 Google 提取指向您的站内网页的链接，请使用 robots.txt disallow 规则。

```
disallow
```

如果您不想让 Google 将某个网页编入索引，请允许抓取并使用 noindex robots 规则。

```
noindex
```