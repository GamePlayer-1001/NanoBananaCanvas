---

---
source: https://developers.google.com/search/docs/crawling-indexing/prevent-images-on-your-page
---

# 从搜索结果中移除您网站上托管的图片

- 

# 从搜索结果中移除您网站上托管的图片

## 在紧急情况下移除图片

如需从 Google 搜索结果中快速移除托管在您网站上的图片，请使用“移除”工具。
  请注意，除非您还从您的网站中移除图片或屏蔽图片（如“非紧急图片移除”部分中所述），否则当内容移除要求失效后，这些图片可能会重新出现在 Google 的搜索结果中。

## 在非紧急情况下移除图片

您可以通过以下两种方式从 Google 搜索结果中移除您网站中的图片：

- robots.txt 禁止规则
- noindex X-Robots-Tag HTTP 标头

```
noindex
```

```
X-Robots-Tag
```

这两种方法的效果相同，请选择对您的网站来说更方便的方法。
  请注意，Googlebot 必须抓取网址才能提取 HTTP 标头，因此同时实现这两种方法是不合理的。

如果您无法访问托管您的图片的网站（例如 CDN），或者您的 CMS 未提供使用 noindex X-Robots-Tag HTTP 标头或 robots.txt 屏蔽图片的方法，您可能需要从网站中彻底删除相应图片。

```
noindex
```

```
X-Robots-Tag
```

### 使用 robots.txt 规则移除图片

若要阻止您网站上的图片显示在 Google 搜索结果中，请在托管相应图片的网站的根目录下添加 robots.txt 文件，例如 https://yoursite.example.com/robots.txt。虽然与使用“移除”工具相比，使用 robots.txt 规则从 Google 搜索结果中移除图片需要更长的时间，但这种使用通配符或子路径屏蔽的方法可让您有更多的灵活性和控制权。这种方法还适用于所有搜索引擎，而“移除”工具仅适用于 Google。

```
https://yoursite.example.com/robots.txt
```

例如，如果您希望 Google 排除您网站上显示的 dogs.jpg 图片（网址为 yoursite.example.com/images/dogs.jpg），请在 robots.txt 文件中添加以下内容：

```
dogs.jpg
```

```
yoursite.example.com/images/dogs.jpg
```

```
User-agent: Googlebot-Image
Disallow: /images/dogs.jpg
```

下次 Google 抓取 dogs.jpg 图片时，我们就会根据这条规则从 Google 图片搜索结果中排除您的图片。

```
dogs.jpg
```

规则可以包含特殊字符，以实现更好的灵活性和控制。具体而言，* 字符可与任意字符序列相匹配，可让您使用一条规则匹配多个图片路径。

```
*
```

如需从 Google 索引中移除您网站上的多张图片，请为每张图片添加 disallow 规则，或者如果这些图片使用相同的格式（例如在文件名中添加后缀），请在文件名中使用 * 字符。例如：

```
disallow
```

```
*
```

```
User-agent: Googlebot-Image
# Repeated 'disallow' rules for each image:
Disallow: /images/dogs.jpg
Disallow: /images/cats.jpg
Disallow: /images/llamas.jpg

# Wildcard character in the filename for
# images that share a common suffix. For example,
#   animal-picture-UNICORN.jpg and
#   animal-picture-SQUIRREL.jpg
# in the "images" directory
# will be matched by this pattern.
Disallow: /images/animal-picture-*.jpg
```

如需从我们的索引中移除您网站上的所有图片，请在 robots.txt 文件中加入以下规则：

```
User-agent: Googlebot-Image
Disallow: /
```

如需移除某一文件类型的所有文件（例如，要包含 .jpg 图片但排除 .gif 图片），请使用下列 robots.txt 指令：

```
.jpg
```

```
.gif
```

```
User-agent: Googlebot-Image
Disallow: /*.gif$
```

通过将 Googlebot-Image 指定为 User-agent，可将图片从 Google 图片搜索结果中排除。若想将这些图片从 Google 的所有搜索结果（包括 Google 搜索和 Google 图片）中排除，请指定 Googlebot 用户代理。

```
Googlebot-Image
```

```
User-agent
```

```
Googlebot
```

### 使用 noindex X-Robots-Tag HTTP 标头移除图片

```
noindex
```

```
X-Robots-Tag
```

或者，您可以将 noindex X-Robots-Tag 添加到您要移除的图片的 HTTP 响应标头中，从 Google 搜索结果中移除托管在您网站上的图片。在这种情况下，您必须允许抓取图片网址，这样 Googlebot 才能提取 noindex 规则。如需实现 noindex X-Robots-Tag HTTP 响应标头，请遵循我们关于 noindex 的文档。

```
noindex
```

```
X-Robots-Tag
```

```
noindex
```

```
noindex
```

```
X-Robots-Tag
```

```
noindex
```

请注意，向特定网页添加 noimageindex 漫游器标记也会阻止该网页中嵌入的图片编入索引。不过，如果这些图片也出现在其他网页中，则可能会通过这些网页编入索引。为了确保特定图片无论出现在何处都被屏蔽，请使用 noindex X-Robots-Tag HTTP 响应标头。

```
noimageindex
```

```
noindex
```

```
X-Robots-Tag
```

## 如何从不归我所有的资源中移除图片？

请参阅关于如何从搜索结果中移除图片的 Google 搜索帮助文档。