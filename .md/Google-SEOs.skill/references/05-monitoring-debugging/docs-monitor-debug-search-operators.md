---

---
source: https://developers.google.com/search/docs/monitor-debug/search-operators
---

# Google 搜索运算符概览

- 

# Google 搜索运算符概览

Google 搜索支持多种搜索运算符，您可以使用这些搜索运算符优化或定位搜索。此外，以下搜索运算符还能在调试网站时发挥作用。

例如，site: 搜索运算符可用于监控网站上的垃圾评论，而图片搜索运算符 imagesize: 可用于查找网站上的小图片。

```
site:
```

```
imagesize:
```

下表列出了可用于在 Google 搜索结果中检查网页各个方面的搜索运算符：

## filetype:

```
filetype:
```

查找特定文件类型（由 content-type HTTP 标头或文件扩展名定义）的搜索结果。例如，您可以搜索以 .rtf 结尾且内容中包含“galway”一词的 RTF 文件和网址：

```
content-type
```

```
.rtf
```

```
filetype:rtf galway
```

## imagesize:

```
imagesize:
```

查找包含特定尺寸的图片的网页。此搜索运算符仅适用于 Google 图片。例如：

```
imagesize:1200x800
```

## site:

```
site:
```

查找来自特定的网域、网址或网址前缀的搜索结果。例如：

```
site:https://www.google.com/
```

## src:

```
src:
```

查找在 src 属性中引用了特定图片网址的网页。此搜索运算符仅适用于 Google 图片。例如：

```
src
```

```
src:https://www.example.com/images/peanut-butter.png
```