# .md/
> L2 | 父级: /CLAUDE.md

项目文档主目录。这里不承载运行时代码，但承载当前项目的活文档、归档文档入口与阅读顺序。

## 当前活文档

项目规划清单.md: 全项目阶段任务与里程碑清单，定义功能范围与完成状态  
项目框架结构.md: 当前系统的目录树、路由、技术栈与模块分层总览  
项目执行规范.md: 开发流程、验证、Git 留痕与文档回环规范  
多模态架构设计.md: 多模态端口、消息结构与类型兼容设计  
异步任务队列架构设计.md: D1-as-Queue 异步任务架构与生命周期  
SEO 与 Open Graph 策略.md: SEO、OG、Sitemap 与结构化数据策略  
Landing Page 视觉策略.md: Landing 页视觉语言与动效策略  
AI Provider 适配层设计.md: 多 Provider 抽象层与接入差异说明  
Clerk 登录系统回装方案与清单.md: 未来重新嵌入身份系统时的目标架构、前置条件与执行清单
Clerk 登录模块嵌入执行清单.md: 基于当前匿名主链整理的 Clerk 嵌入方案、路由跳转设计与分阶段执行清单

## 历史归档

archive/: 历史文档归档目录，存放已完成阶段使命但仍有回溯价值的方案与清单  
archive/项目可行性分析.md: 立项期背景与可行性分析  
archive/积分与支付系统架构设计.md: 历史商业化与计费方案  
archive/差距分析报告.md: 对标 martini.art 的阶段性差距审计  
archive/登录系统移除清单.md: 旧 Clerk 登录体系拆除清单  
archive/商业化移除清单.md: 旧商业化体系拆除清单  
archive/生产环境迁移清单.md: 旧 Clerk/Stripe 生产环境切换清单

## 阅读顺序

1. 先读 项目规划清单.md，理解当前目标与阶段状态
2. 再读 项目框架结构.md，建立系统结构与模块边界
3. 再读 项目执行规范.md，理解开发流程与验证约束
4. 最后按任务需要进入专项设计文档

## 职责边界

1. 本文件只负责文档地图、文档分类与阅读顺序
2. 不再重复维护项目级架构细节，这部分归 项目框架结构.md
3. 不再重复维护开发流程细节，这部分归 项目执行规范.md
4. 已经并入总览的子系统策略，不再保留独立主文档

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
