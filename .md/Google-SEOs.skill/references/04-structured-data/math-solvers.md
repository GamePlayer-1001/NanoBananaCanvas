# 数学求解器 (MathSolver) 结构化数据 | Google 搜索中心  |  Documentation  |  Google for Developers

> 原文链接: https://developers.google.com/search/docs/appearance/structured-data/math-solvers?hl=zh-cn

---

  # 数学求解器 (MathSolver) 结构化数据

    为帮助学生、老师和其他人求解数学题，您可以使用结构化数据表示数学题类型并链接到关于特定数学题的分步讲解。以下示例展示了数学求解器在 Google 搜索结果中的可能显示效果（实际外观可能会有所不同）：

      注意**：在 Google 搜索结果中的实际显示效果可能会有不同。您可以使用[富媒体搜索结果测试](https://support.google.com/webmasters/answer/7445569?hl=zh-cn)来预览大多数功能。

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

### 一项求解器操作

下面是一个包含一项求解器操作的数学求解器首页示例，该求解器可解多项式方程和求导题，提供英语和西班牙语版本。

<html>
<head>
<title>An awesome math solver</title>
</head>
<body>
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": ["MathSolver", "LearningResource"],
    "name": "An awesome math solver",
    "url": "https://www.mathdomain.com/",
    "usageInfo": "https://www.mathdomain.com/privacy",
    "inLanguage": "en",
    "potentialAction": [{
      "@type": "SolveMathAction",
      "target": "https://mathdomain.com/solve?q={math_expression_string}",
      "mathExpression-input": "required name=math_expression_string",
      "eduQuestionType": ["Polynomial Equation","Derivative"]
     }],
    "learningResourceType": "Math solver"
  },
  {
    "@context": "https://schema.org",
    "@type": ["MathSolver", "LearningResource"],
    "name": "Un solucionador de matemáticas increíble",
    "url": "https://es.mathdomain.com/",
    "usageInfo": "https://es.mathdomain.com/privacy",
    "inLanguage": "es",
    "potentialAction": [{
      "@type": "SolveMathAction",
      "target": "https://es.mathdomain.com/solve?q={math_expression_string}",
      "mathExpression-input": "required name=math_expression_string",
      "eduQuestionType": ["Polynomial Equation","Derivative"]
     }],
    "learningResourceType": "Math solver"
  }
]
</script>
</body>
</html>

      **

```

<html>
<head>
<title>An awesome math solver</title>
</head>
<body>
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": ["MathSolver", "LearningResource"],
    "name": "An awesome math solver",
    "url": "https://www.mathdomain.com/",
    "usageInfo": "https://www.mathdomain.com/privacy",
    "inLanguage": "en",
    "potentialAction": [{
      "@type": "SolveMathAction",
      "target": "https://mathdomain.com/solve?q={math_expression_string}",
      "mathExpression-input": "required name=math_expression_string",
      "eduQuestionType": ["Polynomial Equation","Derivative"]
     }],
    "learningResourceType": "Math solver"
  },
  {
    "@context": "https://schema.org",
    "@type": ["MathSolver", "LearningResource"],
    "name": "Un solucionador de matemáticas increíble",
    "url": "https://es.mathdomain.com/",
    "usageInfo": "https://es.mathdomain.com/privacy",
    "inLanguage": "es",
    "potentialAction": [{
      "@type": "SolveMathAction",
      "target": "https://es.mathdomain.com/solve?q={math_expression_string}",
      "mathExpression-input": "required name=math_expression_string",
      "eduQuestionType": ["Polynomial Equation","Derivative"]
     }],
    "learningResourceType": "Math solver"
  }
]
</script>
</body>
</html>
```

      数学求解器的西班牙语版标记可以直接放在 https://es.mathdomain.com/ 上，而不是放置在英语版标记旁边。

### 两项求解器操作

下面是一个包含两个求解器端点的数学求解器首页示例：一个端点可以解多项式方程，另一个端点可以解三角方程。该求解器仅提供英语版本。

<html>
<head>
<title>An awesome math solver</title>
</head>
<body>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["MathSolver", "LearningResource"],
  "name": "An awesome math solver",
  "url": "https://www.mathdomain.com/",
  "usageInfo": "https://www.mathdomain.com/privacy",
  "inLanguage": "en",
  "potentialAction": [{
     "@type": "SolveMathAction",
     "target": "https://mathdomain.com/solve?q={math_expression_string}",
     "mathExpression-input": "required name=math_expression_string",
     "eduQuestionType": "Polynomial Equation"
   },
   {
     "@type": "SolveMathAction",
     "target": "https://mathdomain.com/trig?q={math_expression_string}",
     "mathExpression-input": "required name=math_expression_string",
     "eduQuestionType": "Trigonometric Equation"
   }],
  "learningResourceType": "Math solver"
}
</script>
</body>
</html>

```

<html>
<head>
<title>An awesome math solver</title>
</head>
<body>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["MathSolver", "LearningResource"],
  "name": "An awesome math solver",
  "url": "https://www.mathdomain.com/",
  "usageInfo": "https://www.mathdomain.com/privacy",
  "inLanguage": "en",
  "potentialAction": [{
     "@type": "SolveMathAction",
     "target": "https://mathdomain.com/solve?q={math_expression_string}",
     "mathExpression-input": "required name=math_expression_string",
     "eduQuestionType": "Polynomial Equation"
   },
   {
     "@type": "SolveMathAction",
     "target": "https://mathdomain.com/trig?q={math_expression_string}",
     "mathExpression-input": "required name=math_expression_string",
     "eduQuestionType": "Trigonometric Equation"
   }],
  "learningResourceType": "Math solver"
}
</script>
</body>
</html>
```

## 指南

若想让您的网页可显示为数学求解器富媒体搜索结果，您必须遵循以下指南：

- [结构化数据常规指南](https://developers.google.com/search/docs/appearance/structured-data/sd-policies?hl=zh-cn)
- [搜索要素](https://developers.google.com/search/docs/essentials?hl=zh-cn)
- [技术指南](#technical-guidelines)
- [内容指南](#content-guidelines)

### 技术指南

- 将 MathSolver 结构化数据添加到您网站的首页。
- 确保 Googlebot 能够[高效抓取您的网站](https://developers.google.com/search/docs/crawling-indexing/troubleshoot-crawling-errors?hl=zh-cn#improve_crawl_efficiency)。
- 如果您在不同网址下托管了同一数学求解器的多个相同副本，请在网页的每个副本中使用[规范网址](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls?hl=zh-cn)。
- 我们不允许将数学求解器完全隐藏在登录机制或付费墙后面。用户从 Google 上的功能导航到您的网站后，必须能够访问初始问题的解法和分步讲解。其他内容可要求用户登录后才能访问或隐藏在付费墙后面。

### 内容指南

    我们之所以制定这些数学求解器内容指南，是为了确保我们的用户能够找到相关的学习资源。如果我们发现内容违反这些政策，将采取适当措施，这可能包括采取[人工处置措施](https://support.google.com/webmasters/answer/9044175?hl=zh-cn)并将您的网页从 Google 上的数学求解器功能中移除。

- 我们不允许将宣传内容伪装成数学求解器，例如由第三方（如[联属营销计划](https://developers.google.com/search/docs/essentials/spam-policies?hl=zh-cn#thin-affiliate-pages)）发布的内容。
- 通过此功能呈现数学求解器时，您将对其准确性和质量负责。在质量审核流程中，如果我们发现一定数量的不准确数据，则根据不准确的程度，可能会从该功能中移除您的求解器，直到问题得到解决为止。适用范围：

        求解器能够求解的数学题类型的准确性。
- 求解器声明可以求解的数学题的解法准确性。

## 结构化数据类型定义

要使您的内容能够显示为富媒体搜索结果，您必须为其添加必需属性。您还可以添加建议的属性，以便向结构化数据添加更多信息，进而提供更好的用户体验。

### MathSolver

    MathSolver 是一款工具，可以为学生、老师和其他人列出求解步骤，从而帮助他们求解数学题。请在网站的首页上使用 MathSolver 结构化数据。

如需了解 MathSolver 的完整定义，请访问 [schema.org/MathSolver](https://schema.org/MathSolver)。

Google 支持的属性如下：

      必要属性

      potentialAction

[SolveMathAction](https://schema.org/SolveMathAction)

该操作会转到数学表达式的数学解释（例如求解步骤或图表）。

```
{
"@type": "MathSolver",
"potentialAction": [{
  "@type": "SolveMathAction",
  "target": "https://mathdomain.com/solve?q={math_expression_string}",
  "mathExpression-input": "required name=math_expression_string",
  "eduQuestionType": "Polynomial Equation"
  }]
}
```

      potentialAction.mathExpression-input

[Text](https://schema.org/Text)

          Google 发送到您网站的数学表达式（例如：x^2-3x=0）的占位符。然后，您可以“求解”该数学表达式，这可能涉及简化、转换或求解特定变量。此表达式可以采用多种格式（例如：LaTeX、Ascii-Math，或者您可以使用键盘输入的数学表达式）。

            mathExpression-input 是一个带注解的属性。如需了解详情，请参阅 [Potential Actions](https://schema.org/docs/actions.html#part-4) 页面。

对于某些问题类型，math_expression_string 会指明问题类型和问题类型的参数。以下是一些更复杂的问题类型示例，以便您可以正确预测和解析这些问题。

求导**

Google 会发送以下两种格式之一的 math_expression_string：

- ```
(math_expression)'
          d/dvariable math_expression

        Examples:

          (x^2+x)'
          d/dx (x^2+x)
          d/dy y^2+y

        Integrals
        Google will send a math_expression_string in one of two forms:

          \int math_expression
```
- ```
\int_{from}^{to} math_expression
```

示例：

- \int x^2+x
- \int_{0}^{2} x^2+x

**限制**

Google 会发送以下两种格式之一的 math_expression_string：

- ```
\lim math_expression
```
- ```
\lim_{variable\rightarrowvalue} math_expression
```

示例：

- \lim_{x\rightarrow0} sin(x)/x
- \lim_{y\rightarrow\infty} sin(y)/y
- \lim sin(x)/x

      url

[URL](https://schema.org/URL)

MathSolver 的网址。

      usageInfo

[URL](https://schema.org/URL)

数学题求解网站的隐私权政策。

```
{
  "@type": "MathSolver",
  "usageInfo": "https://www.mathdomain.com/privacy"
}
```

      potentialAction.target

[EntryPoint](https://schema.org/EntryPoint)

操作的网址目标入口点。potentialAction.target 属性接受字符串来表示该操作求解的数学表达式。

```
{
"@type": "MathSolver",
"potentialAction": [{
  "@type": "SolveMathAction",
  "target": "https://mathdomain.com/solve?q={math_expression_string}"
  }]
}
```

      建议属性

      inLanguage

[Text](https://schema.org/Text)

数学题求解网站支持的语言。如需查看可用语言的列表，请参阅[此表](https://developers.google.com/custom-search/docs/xml_results_appendices?hl=zh-cn#interfaceLanguages)。

```
{
  "@type": "MathSolver",
  "inLanguage": "es"
}
```

      assesses

[数学题类型定义](#problem-type-definitions)的 [Text](https://schema.org/Text) 列表

通过 HowTo 求解的数学题类型。如果除了 MathSolver 标记之外，您还使用 HowTo 标记，请使用 assesses 属性。

```
{
  "@type": "MathSolver",
  "assesses": "Polynomial Equation"
}
```

      potentialAction.eduQuestionType

[数学题类型定义](#problem-type-definitions)的 [Text](https://schema.org/Text) 列表

能够通过 potentialAction.target 属性求解的数学题类型。

```
{
  "@type": "SolveMathAction",
  "eduQuestionType": "Polynomial Equation"
}
```

### LearningResource

    LearningResource 表明标记对象是可帮助学生、老师和其他人开展教育学习的资源。请在网站的首页上使用 LearningResource。

如需了解 LearningResource 的完整定义，请访问 [schema.org/LearningResource](https://schema.org/LearningResource)。

Google 支持的属性如下：

      必要属性

      learningResourceType

[Text](https://schema.org/Text)

此学习资源的类型。请使用以下固定值：Math Solver。

```
{
  "@type": ["MathSolver", "LearningResource"],
  "learningResourceType": "Math Solver"
}
```

## 
    数学题类型定义

    当 MathSolver 附有提供特定数学题讲解的 HowTo 时，请将以下数学题类型列表用作 MathSolver.potentialAction 的 eduQuestionType 或 MathSolver 的 assesses 字段。

下表显示了一些您可以添加注释的问题类型的示例：

      示例数学题类型（此列表仅举例说明，并不包含所有情况）

      Absolute Value Equation

绝对值方程。例如：|x - 5| = 9

      Algebra

可与其他数学题类型一起放置的通用数学题类型。例如：多项式方程、指数方程和根式表达式。

      Arc Length

弧长题。例如：确定 x = 4 (3 + y)^2, 1 < y < 4 的长度。

      Arithmetic

算术题。例如：求出 5 + 7 的总和。

      Biquadratic Equation

双二次方程。例如：x^4 - x^2 - 2 = 0。

      Calculus

可与其他数学题类型一起放置的通用数学题类型。例如：积分、求导和微分方程。

      Characteristic Polynomial

求出 &#123;&#123;1,2,5&#125;, &#123;3,-1,1&#125;, &#123;1,2,3&#125;&#125; 的特征多项式。

      Circle

与圆相关的数学题。例如：求出 x^2 + y^2 = 3 的半径。

      Derivative

求出 5x^4 + 2x^3 + 4x - 2 的导数。

      Differential Equation

微分方程题。例如：y+dy/dx=5x。

      Distance

距离题。例如：求出 (6,-1) 与 (-3,2) 之间的距离。

      Eigenvalue

特征值题。例如：求出矩阵 [[-6, 3], [4, 5]] 的特征值。

      Eigenvector

特征向量题。例如：矩阵 [[-6, 3], [4, 5]] 的特征值为 [-7, 6]，请求出矩阵的特征向量。

      Ellipse

椭圆题。例如：求出 9x^2 x 4y^2 = 36 的 x 轴截距和 y 轴截距。

      Exponential Equation

指数方程。例如：7^x = 9。

      Function

多项式化简。例如：(x-5)^2 * (x+5)^2。

      Function Composition

当 f(x)=x^2-2x、g(x)=2x-2 时，求 f(g(x))

      Geometry

可与其他数学题类型一起放置的通用数学题类型。例如：圆、椭圆、抛物线、斜率。

      Hyperbola

双曲线题。例如：求出 (x^2)/4 - (y^2)/5 = 1 的 x 轴截距。

      Inflection Point

求出 f(x) = 1/2x^4 +x^3 - 6x^2 的拐点。

      Integral

求出 sqrt (x^2 - y^2) 的积分。

      Intercept

直线截距题。例如：求出直线 y = 10x - 5 的 x 轴截距。

      Limit

极限题。例如：求出 x 无限接近 1 时，函数 (x^2-1)/(x-1) 的极限。

      Line Equation

直线方程题。例如：求出经过点 (-7,-4) 和 (-2,-6) 的直线的方程。

      Linear Algebra

可与其他数学题类型一起放置的通用数学题类型。例如：矩阵和特征多项式。

      Linear Equation

线性方程。例如：4x - 3 = 2x + 9。

      Linear Inequality

线性不等式。例如：5x - 6 > 3x - 8。

      Logarithmic Equation

对数方程。例如：log(x) = log(100)。

      Logarithmic Inequality

对数不等式。例如：log(x) > log(100)。

      Matrix

求出 &#123;&#123;1,2,5&#125;, &#123;3,-1,1&#125;, &#123;1,2,3&#125;&#125; 的简化行阶梯形

      Midpoint

中点题。例如：求出 (-3, 7) 和 (5, -2) 的中点。

      Parabola

抛物线题。例如：求出 y2 - 4x - 4y = 0 的顶点。

      Parallel

平行线题。例如：两条直线 (y = 10x + 5, y = 20x + 10) 是否平行？

      Perpendicular

垂直判定题。例如：两条直线 (y = 10x + 5, y = 20x + 10) 是否垂直？

      Polynomial Equation

多项式方程。例如：x^5 - 3x = 0。

      Polynomial Expression

多项式表达式。例如：(x - 5)^4 * (x + 5)^2。

      Polynomial Inequality

多项式不等式。例如：x^4 - x^2 - 6 > x^3 - 3x^2。

      Quadratic Equation

二次方程。例如：x^2 - 3x - 4 = 0。

      Quadratic Expression

二次表达式。例如：x^2 - 3x - 2。

      Quadratic Inequality

二次不等式。例如：x^2 - x - 6 > x^2 - 3x。

      Radical Equation

根式方程。例如：sqrt(x) - x = 0。

      Radical Inequality

根式不等式。例如：sqrt(x) - x > 0。

      Rational Equation

有理方程。例如：5/(x - 3) = 2/(x - 1)。

      Rational Expression

有理表达式。例如：1/(x^3 + 4x^2 + 5x + 2)。

      Rational Inequality

有理不等式。例如：5/(x - 3) > 2/(x - 1)。

      Slope

斜率题。例如：求出 y = 10x + 5 的斜率。

      Statistics

统计题。例如：求出一组数字 (3, 8, 2, 10) 的平均值。

      System of Equations

方程组题。例如：求解 2x + 5y = 16;3x - 5y = - 1。

      Trigonometry

求解 sin(t) + cos(t) = 1。

如未另行说明，那么本页面中的内容已根据[知识共享署名 4.0 许可](https://creativecommons.org/licenses/by/4.0/)获得了许可，并且代码示例已根据 [Apache 2.0 许可](https://www.apache.org/licenses/LICENSE-2.0)获得了许可。有关详情，请参阅 [Google 开发者网站政策](https://developers.google.com/site-policies?hl=zh-cn)。