---

---
source: https://developers.google.com/search/docs/crawling-indexing/indexable-file-types
---

# Google 编入索引的文件类型

- 

# Google 编入索引的文件类型

Google 可以将大多数文本文件和某些已编码文档格式的内容编入索引。文件类型由 Google 抓取文件时返回的 Content-Type HTTP 标头确定，不过在某些情况下，如果 Content-Type 标头缺失或不正确，Google 可能会使用文件扩展名或使用其他解析器重新解析文件。

```
Content-Type
```

```
Content-Type
```

## 支持的平面文件类型

支持以下平面文件类型。这些文件的内容以未编码的纯文本形式存储（不过它们可能会使用标记）。

- 以逗号分隔的值 (.csv)
- Google 地球（.kml、.kmz）
- GPS 交换格式 (.gpx)
- HTML（.htm、.html、其他文件扩展名）
- 可缩放矢量图形 (.svg)
- TeX/LaTeX (.tex)
- 文本文件（.txt、.text、其他文件扩展名），包括采用常用编程语言的源代码，例如：

Basic 源代码 (.bas)
C/C++ 源代码（.c、.cc、.cpp、.cxx、.h、.hpp）
C# 源代码 (.cs)
Java 源代码 (.java)
Perl 源代码 (.pl)
Python 源代码 (.py)
- Basic 源代码 (.bas)
- C/C++ 源代码（.c、.cc、.cpp、.cxx、.h、.hpp）
- C# 源代码 (.cs)
- Java 源代码 (.java)
- Perl 源代码 (.pl)
- Python 源代码 (.py)
- 无线标记语言（.wml、.wap）
- XML (.xml)

- Basic 源代码 (.bas)
- C/C++ 源代码（.c、.cc、.cpp、.cxx、.h、.hpp）
- C# 源代码 (.cs)
- Java 源代码 (.java)
- Perl 源代码 (.pl)
- Python 源代码 (.py)

## 支持的编码文件类型

支持以下编码文件类型。这些是二进制文件或复杂的容器，需要使用特定的解析器才能提取人类可读的文本。

- Adobe 便携式文档格式 (.pdf)
- Adobe PostScript (.ps)
- 电子出版物 (.epub)
- Hancom Hanword (.hwp)
- Microsoft Excel（.xls、.xlsx）
- Microsoft PowerPoint（.ppt、.pptx）
- Microsoft Word（.doc、.docx）
- OpenOffice 演示文稿 (.odp)
- OpenOffice 电子表格 (.ods)
- OpenOffice 文本文件 (.odt)
- 富文本格式 (.rtf)

## 支持的媒体格式

Google 还可以将以下媒体格式的内容编入索引：

- 图片格式： 

    BMP、GIF、JPEG、PNG、WebP、SVG 和 AVIF
- 视频格式： 3GP、3G2、ASF、AVI、DivX、M2V、M3U、M3U8、M4V、MKV、MOV、MP4、MPEG、OGV、QVT、RAM、RM、VOB、WebM、WMV 和 XAP

## 按文件类型搜索

您可以在 Google 搜索中使用 filetype: 运算符，将搜索结果限制为特定文件类型或文件扩展名。例如，filetype:rtf galway 会搜索以 .rtf 结尾且内容包含“galway”一词的 RTF 文件和网址。

```
filetype:
```

```
filetype:rtf galway
```

```
.rtf
```