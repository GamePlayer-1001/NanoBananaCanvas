# .md/

> L2 | 父级: /CLAUDE.md

项目文档主目录。这里不承载运行时代码，但承载当前项目的活文档、归档入口与推荐阅读顺序。

## 当前活文档

项目规划清单.md: 当前项目主链状态、剩余闭环与阶段优先级  
项目框架结构.md: 当前系统的真实模块边界、主运行时链路与真相源分层  
项目执行规范.md: 当前项目的开发流程、验证、Git 留痕与文档回环规范  
公域宣传卖点与内容钩子.md: 面向公开流量渠道的卖点提炼、传播钩子与内容角度库
私域转化与留存话术.md: 面向社群、私信与用户运营的转化承接、留存触达与分层话术库
100个内容选题库.md: 面向 SEO、公众号、知乎、小红书、短视频与社群教育的百条选题总库
多模态架构设计.md: 当前多模态消息层、异步任务层与画布层的真实关系说明
异步任务队列架构设计.md: 异步任务系统的历史设计文档，现主要作为任务主链背景参考  
SEO 与 Open Graph 策略.md: SEO、OG、Sitemap 与结构化数据策略  
Landing Page 视觉策略.md: Landing 页视觉语言与动效策略  
SEO 检测与执行清单.md: 基于当前代码与 SEO 资料的站点诊断与分阶段执行清单
explore-import-manifest-template.csv: Explore 批量导入 CSV 模板，按标准字段填写本地作品、来源链接、作者信息与媒体路径，供导入脚本直接消费

## 常引用归档

archive/AI Provider 适配层设计.md: Provider 抽象层历史设计稿，当前主要作为差异分析参考  
archive/Clerk 登录系统回装方案与清单.md: Clerk 接回运行时的专项结案与边界说明
archive/Stripe 支付系统嵌入执行清单.md: Stripe 商业化重建专项清单，当前主要用于生产手测与回溯
archive/Agent 工作流画板完整方案.md: Agent 画板的产品思路与能力边界背景稿
archive/Agent 工作流画板最终技术设计稿.md: Agent 系统专项技术真相源，描述已落地的模块、协议与边界
archive/Agent 工作流画板实现任务执行清单.md: Agent 系统阶段任务清单与验收背景记录
archive/异步任务队列架构设计.md: 任务系统历史设计演进稿，便于理解双轨编排的来路
archive/积分与支付系统架构设计.md: 商业化主方案的背景技术稿，便于理解账本与套餐语义
archive/生产环境迁移清单.md: Live 接线与生产切换回溯记录
archive/差距分析报告.md: 对标 martini.art 的历史差距分析，仍可用于识别长期缺口
archive/项目可行性分析.md: 立项期定位、目标用户与差异化分析背景稿

## 历史归档

archive/: 历史文档归档目录，存放已完成阶段使命但仍有回溯价值的方案、迁移清单与旧设计稿  
archive/登录系统移除清单.md: 旧 Clerk 登录体系拆除清单  
archive/商业化移除清单.md: 旧商业化体系拆除清单  
archive/服务条款Terms of Service: 旧法务底稿，现以运行时页面源文件为准
archive/隐私政策Privacy Policy: 旧法务底稿，现以运行时页面源文件为准
archive/seo.txt: 外部 SEO 资料汇总底稿，非当前项目真相源

## 阅读顺序

1. 先读 项目框架结构.md，建立当前项目现实与模块边界
2. 再读 项目规划清单.md，理解当前主链状态与剩余闭环
3. 再读 项目执行规范.md，理解开发流程、验证与文档回环约束
4. 涉及多模态、Agent、支付、身份、任务时，优先查看主文档中的现状摘要，再按需进入“常引用归档”
5. 涉及增长、运营、宣传、投放时，再进入宣传与内容类文档

## 职责边界

1. 本文件只负责文档地图、分类与阅读顺序
2. 项目级结构细节归 项目框架结构.md
3. 当前阶段状态与剩余任务归 项目规划清单.md
4. 开发流程、验证与回环归 项目执行规范.md
5. archive 文档默认不视为当前真相源，除非主文档明确指向
6. “常引用归档”表示仍有参考价值，但仍需以代码现实和主文档口径为准

## 执行约束

1. 请先阅读当前项目内容然后再根据以下规则执行
2. 请在后续的沟通中使用中文与我沟通
3. 请先阅读 `D:\Software\画板\.md` 所有的文件并作为规范进行后续的执行
4. 在后续执行期间，每执行一个步骤的时候都要告诉我你上一步做了什么、你这一步要做什么、你为什么要这么做、你这么做是否是最好的实现方式
5. 你每次执行完一个动作的时候都要上传 git 分支，方便我留存历史和回溯
6. 在后续的沟通中，每当我提出需求的时候，你要进行二次、三次甚至多次沟通以确认我的需求，以避免我们的沟通过程中出现词不达意和沟通信息缺失的情况
7. 后续每次执行任务之后都要自动检查代码质量，尽量不要出现报错等代码问题，然后向我汇报总结你完成了什么任务
8. 后续开发过程中，如果不是我的需求就不要调整 UI 界面。此外如果有调整的需求，请用中文告诉我原因
9. 后续开发过程中，如果我提出新的需求或者 bug 需要你修改，你如果有什么不懂的需要多次询问，而不是自作主张，这很容易污染当前代码的洁净度
10. 在执行任务之前要先评估任务量，然后根据所要消耗的 token 量来判断是否使用 Agent 或其他方式协作
11. 在执行任务之前要先判断，这个世界上最适合解决这个任务的人或者团队是谁；他们会如何解决；然后代入他们的身份解决这些任务

## 参考资料

openrouter API 配置文档链接：https://openrouter.ai/docs/quickstart  
deepseek API 配置文档链接：https://api-docs.deepseek.com/zh-cn/  
google gemini API 配置文档链接（文本生成）：https://ai.google.dev/gemini-api/docs/text-generation?hl=zh-cn  
google gemini API 配置文档链接（图片生成）：https://ai.google.dev/gemini-api/docs/image-generation?hl=zh-cn  
google gemini API 配置文档链接（图片理解）：https://ai.google.dev/gemini-api/docs/image-understanding?hl=zh-cn  
Kling API 配置文档链接：https://app.klingai.com/cn/dev/document-api/apiReference/commonInfo  
QWEN IMAGE api 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=2975126  
qwen-image-edit-plus api 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=2976416  
Z-Image api 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=3002354  
wan 首帧 API 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=2867393  
wan 首尾帧 API 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=2880649  
wan 参考生视频 API 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=3001146  
wan 文生视频 API 配置文档链接：https://bailian.console.aliyun.com/?tab=api#/api/?type=model&url=2865250

## 参考网站

https://martini.art/

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
