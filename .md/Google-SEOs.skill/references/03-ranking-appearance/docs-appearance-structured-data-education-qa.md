# Cell Transport

---

---
source: https://developers.google.com/search/docs/appearance/structured-data/education-qa
---

# 知识问答（Quiz、Question 和 Answer）结构化数据

- 

# 知识问答（Quiz、Question 和 Answer）结构化数据

```
Quiz
```

```
Question
```

```
Answer
```

如果您有抽认卡页面，可以通过向其中添加 Quiz 结构化数据来帮助学生更好地找到教育类问题的答案。添加结构化数据后，您的内容将会显示在 Google 搜索结果、Google 助理和 Google 智能镜头搜索结果的问答轮播界面中。

```
Quiz
```

以下页面类型符合知识问答轮播界面的条件：

- 抽认卡页面：这种页面包含抽认卡，该卡的一面通常包含问题，另一面提供答案。如需标记抽认卡页面，请继续阅读本指南，了解如何添加知识问答架构。
- 单个问答页面：这种页面仅包含一个问题，后跟用户提交的答案。如需标记单个问答页面，请改为添加 QAPage 标记。

```
QAPage
```

## 功能可用性

仅当在桌面设备和移动设备上搜索教育相关主题时，才能使用知识问答轮播界面。例如，尝试搜索 "the measure of
      three angles of a quadrilateral are 80 90 and 103 degrees" 或 "the
      ratio of surface energy to surface area is" 之类的查询。

知识问答轮播界面已面向以下语言和地区推出：

## 如何添加结构化数据

结构化数据是一种提供网页相关信息并对网页内容进行分类的标准化格式。如果您不熟悉结构化数据，可以详细了解结构化数据的运作方式。

下面概述了如何构建、测试和发布结构化数据。如需获得向网页添加结构化数据的分步指南，请查看结构化数据 Codelab。

- 添加必要属性。根据您使用的格式，了解在网页上的什么位置插入结构化数据。
使用了 CMS？使用集成到 CMS 中的插件可能更简单。

使用了 JavaScript？了解如何使用 JavaScript 生成结构化数据。
- 遵循指南。
- 使用富媒体搜索结果测试验证您的代码，并修复所有严重错误。此外，您还可以考虑修正该工具中可能会标记的任何非严重问题，因为这些这样有助于提升结构化数据的质量（不过，要使内容能够显示为富媒体搜索结果，并非必须这么做）。
- 部署一些包含您的结构化数据的网页，然后使用网址检查工具测试 Google 看到的网页样貌。请确保您的网页可供 Google 访问，不会因 robots.txt 文件、noindex 标记或登录要求而被屏蔽。如果网页看起来没有问题，您可以请求 Google 重新抓取您的网址。
    注意：Google 重新抓取您的网页并重新将其编入索引需要一段时间，请耐心等待。网页发布后，Google 可能需要几天时间才会找到和抓取该网页。
- 为了让 Google 随时了解日后发生的更改，我们建议您提交站点地图。Search Console Sitemap API 可以帮助您自动执行此操作。

```
noindex
```

## 示例

下面是一个包含知识问答结构化数据的抽认卡页面示例。

```

    Cell Transport

```

## 指南

若想让您的网页可显示为知识问答富媒体搜索结果，您必须遵循以下指南：

- 结构化数据常规指南
- 搜索要素
- 技术指南
- 内容指南

### 技术指南

- 尽可能将结构化数据放在最详细的叶级页中。请勿将结构化数据添加到没有问题的网页中。
- 所有问题都必须使用 eduQuestionType 属性的 Flashcard 值。包含其他问题类型的网页没有资格出现在知识问答轮播界面中。
- 确保 Googlebot 能够高效抓取您的网站。
- 相应网页上的用户应该会立即看到您网站上的问题，这意味着这些问题并非仅以数据文件或 PDF 格式提供。
- 如果您的网页只有一个问题，后跟多个用户提交的答案，请改用 QAPage 标记。

```
eduQuestionType
```

```
Flashcard
```

```
QAPage
```

### 内容指南

我们之所以制定这些知识问答内容准则，是为了确保用户能够找到相关的学习资源。如果我们发现违反这些指南的内容，将采取适当措施，这可能包括采取人工处置措施以及不将您的内容显示在 Google 上的知识问答富媒体搜索结果中。

- 知识问答页面必须遵循问答页面的内容准则。
- 您的网页必须包含与知识相关的问题和回答。您的网页上必须至少有一对问答，并且解答必须与用户的问题相关。
- 通过此功能呈现知识问答页面时，您将对其准确性和质量负责。在质量和教学审核流程中，如果我们发现一定数量的不准确内容，您的部分或全部问答网页可能无法使用此功能，直到您解决问题为止。

## 标记教育标准

学习标准是指学生在各年级应当了解并且能够实现的学习目标。学习标准具有多种用途，例如链接到内容或组成学习进度的一部分。标记与在线学习资料关联的标准（位于 educationalAlignment 字段下）后，当用户根据这些标准搜索学习内容时，Google 能够以最实用的方式为用户整理并显示相关信息。下面是此架构的简要概览：

```
educationalAlignment
```

下面列举了一些教育标准示例：

- 共同核心州立标准
- 德州基础知识与技能 (TEKS)
- 弗吉尼亚州学习标准 (SOL)
- 不列颠哥伦比亚省课堂成就标准
- 艾伯塔省学习课程
- 澳大利亚课程（澳大利亚课程、评估和报告管理局 [ACARA]）
- 维多利亚州课程 (F-10)
- 英国国家课程

## 结构化数据类型定义

要让内容能够显示为富媒体搜索结果，您必须为其添加必要属性。您还可以添加建议属性，以便添加更多与内容相关的信息，进而提供更好的用户体验。

### Quiz

Quiz 是一组抽认卡（一张或多张），通常与同一概念或主题相关。

```
Quiz
```

如需了解 Quiz 的完整定义，请访问 schema.org。
      Google 支持的属性如下：

```
hasPart
```

Question

```
Question
```

测验中具体抽认卡问题的嵌套信息。使用一个 hasPart 属性可表示单个抽认卡。

```
hasPart
```

如需添加多张抽认卡，请重复添加此属性。

```
{
  "@type": "Quiz",
  "hasPart": {
    "@type": "Question"
  }
}
```

```
about
```

Thing

```
Thing
```

Quiz 背后的基本概念的嵌套信息。

```
Quiz
```

```
{
  "@type": "Quiz",
  "about": {
    "@type": "Thing"
  }
}
```

```
about.name
```

Text

```
Text
```

Quiz 背后的基本概念的嵌套信息。此属性支持添加多个条目。

```
Quiz
```

```
{
  "@type": "Quiz",
  "about": {
    "@type": "Thing",
    "name": "Cell transport"
  }
}
```

```
educationalAlignment
```

AlignmentObject

```
AlignmentObject
```

测验与某个现有教育框架的对应关系。您可以重复添加此属性，将测验与某个学习领域、目标年级或教育标准相对应。

```
{
  "@type": "Quiz",
  "educationalAlignment": []
}
```

```
educationalAlignment.alignmentType
```

Text

```
Text
```

学习资源和测验的教育框架节点之间对应关系的类别。Google 搜索采用 LRMI 标准。

重复添加 alignmentType 属性可指定学习领域及目标年级或教育标准。

```
alignmentType
```

- 如需指定测验的学习领域，请将 alignmentType 属性设置为 educationalSubject 值。
- 如需指定测验的目标年级或教育标准，请将 alignmentType 属性设置为 educationalLevel 值。

```
alignmentType
```

```
educationalSubject
```

```
alignmentType
```

```
educationalLevel
```

下面是如何同时指定 educationalSubject 和 educationalLevel 属性的示例。

```
educationalSubject
```

```
educationalLevel
```

```
{
  "@type": "Quiz",
  "educationalAlignment": [
     {
       "@type": "AlignmentObject",
       "alignmentType": "educationalSubject",
       "targetName": "Biology"
     },
     {
       "@type": "AlignmentObject",
       "alignmentType": "educationalLevel",
       "targetName": "Fifth grade"
     }

  ]
}
```

```
educationalAlignment.targetName
```

Text

```
Text
```

某个现有教育框架的节点名称。例如：“Grade 7: Cell Structure”。

```
{
  "@type": "Quiz",
  "educationalAlignment": [
     {
       "@type": "AlignmentObject",
       "targetName": "Grade 7: Cell Structure"
     }
  ]
}
```

### Question

每个问题都对应一张抽认卡，该卡嵌套在 Quiz 的 hasPart 属性下。请注意，这些 Question 要求与 QAPage 的问题要求不同。

```
Quiz
```

```
hasPart
```

```
Question
```

```
QAPage
```

如需了解 Question 的完整定义，请访问 schema.org。Google 支持的属性如下：

```
acceptedAnswer
```

Answer

```
Answer
```

抽认卡答案的完整内容。每个 Question 类型只能有一个 acceptedAnswer 属性。

```
Question
```

```
acceptedAnswer
```

```
{
  "@type": "Question",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "cell membranes"
  }
}
```

```
eduQuestionType
```

Text

```
Text
```

问题的类型。您必须使用此固定值：Flashcard。

```
Flashcard
```

```
{
  "@type": "Question",
  "eduQuestionType": "Flashcard”
}
```

```
text
```

Text

```
Text
```

抽认卡问题的完整内容。

```
{
  "@type": "Question",
  "text": "A protein on the surface of HIV can attach to proteins on the surface of healthy human cells. What are the attachment sites on the surface of the cells known as?"
}
```

## 使用 Search Console 监控富媒体搜索结果

Search Console 是一款工具，可帮助您监控网页在 Google 搜索结果中的显示效果。即使没有注册 Search Console，您的网页也可能会显示在 Google 搜索结果中，但注册 Search Console 能够帮助您了解 Google 如何查看您的网站并做出相应的改进。建议您在以下情况下查看 Search Console：

- 首次部署结构化数据后
- 发布新模板或更新代码后
- 定期分析流量时

### 首次部署结构化数据后

等 Google 将网页编入索引后，请在相关的富媒体搜索结果状态报告中查看是否存在问题。
    理想情况下，有效项目数量会增加，而无效项目数量不会增加。如果您发现结构化数据存在问题，请执行以下操作：

- 修正无效项目。
- 检查实际网址，核实问题是否仍然存在。
- 使用状态报告请求验证。

### 发布新模板或更新代码后

- 如果您发现无效项目增多了，可能是因为您推出的某个新模板无法正常工作，或者您的网站以一种新的错误方式与现有模板交互。
- 如果您发现有效项目减少了（但无效项目的增加情况并不对应），可能是因为您的网页中未再嵌入结构化数据。请通过网址检查工具了解导致此问题的原因。

### 定期分析流量时

## 问题排查

如果您在实施或调试结构化数据时遇到问题，请查看下面列出的一些实用资源。

- 如果您使用了内容管理系统 (CMS) 或其他人负责管理您的网站，请向其寻求帮助。请务必向其转发列明问题细节的任何 Search Console 消息。
- Google 不能保证使用结构化数据的功能一定会显示在搜索结果中。如需查看导致 Google 无法将您的内容显示为富媒体搜索结果的各种常见原因，请参阅结构化数据常规指南。
- 您的结构化数据可能存在错误。请参阅结构化数据错误列表。
- 如果您的网页受到结构化数据手动操作的影响，其中的结构化数据将会被忽略（但该网页仍可能会出现在 Google 搜索结果中）。如需修正结构化数据问题，请使用“人工处置措施”报告。
- 再次查看相关指南，确认您的内容是否未遵循指南。问题可能是因为出现垃圾内容或使用垃圾标记导致的。不过，问题可能不是语法问题，因此富媒体搜索结果测试无法识别这些问题。
- 针对富媒体搜索结果缺失/富媒体搜索结果总数下降进行问题排查。
- 请等待一段时间，以便 Google 重新抓取您的网页并重新将其编入索引。请注意，网页发布后，Google 可能需要几天时间才会找到和抓取该网页。有关抓取和索引编制的常见问题，请参阅 Google 搜索抓取和索引编制常见问题解答。
- 在 Google 搜索中心论坛中发帖提问。