# Agent 工作流画板实现任务执行清单

> 文档版本：v2.0
> 创建日期：2026-04-30
> 上游文档：`Agent 工作流画板最终技术设计稿.md`
> 说明：本清单用于指导 Agent 工作流画板 V1~V3 的真实开发执行、验收与留痕

---

## 一、执行原则

1. 先搭骨架，再接能力，再收口体验
2. 先保证画布真相源安全，再追求 Agent 聪明程度
3. 每一阶段必须可演示、可验证、可回滚
4. 每完成一个闭环，都必须更新文档并做 git 留痕

---

## 二、里程碑

| 里程碑 | 名称 | 目标 | 状态 |
| --- | --- | --- | --- |
| M1 | 面板骨架 | 右侧 Agent UI 与状态骨架可运行 | [x] |
| M2 | 计划链路 | 从用户输入到结构化 plan 跑通 | [x] |
| M3 | 落图链路 | plan 可安全修改画布并自动保存 | [x] |
| M4 | 提示词确认 | refine + confirm + execute 跑通 | [x] |
| M5 | 诊断与收口 | diagnose、任务联动、体验打磨完成 | [x] |
| M6 | 增量改造 | Agent 能对已有工作流做稳定、小中型增量改造 | [x] |
| M7 | 模板对话化 | 模板选择、模板解释、模板改造主链打通 | [x] |
| M8 | 优化建议 | 成本/速度/结构优化建议与半自动修复打通 | [x] |
| M9 | 结果续写 | 基于输出资产自动建议下一步并可安全落图 | [x] |
| M10 | 节点语境 | 选中节点语境、节点级操作理解与局部执行打通 | [x] |
| M11 | 上下文增强 | 更强画布摘要、资产理解、历史记忆与多提案机制落地 | [x] |
| M12 | 共创闭环 | V3 共创能力、审计、测试、体验与文档全部收口 | [x] |

---

## 三、任务清单

## 3.1 M1 面板骨架

### 文档与结构准备

- [x] `AGENT-001` 在 `.md/CLAUDE.MD` 中登记新增 Agent 技术文档与清单
- [x] `AGENT-002` 为 `apps/web/components/agent/` 创建 `CLAUDE.md`
- [x] `AGENT-003` 为 `apps/web/lib/agent/` 创建 `CLAUDE.md`

### 前端目录与空组件

- [x] `AGENT-010` 创建 `components/agent/agent-panel.tsx`
- [x] `AGENT-011` 创建 `components/agent/agent-header.tsx`
- [x] `AGENT-012` 创建 `components/agent/agent-conversation.tsx`
- [x] `AGENT-013` 创建 `components/agent/agent-message-item.tsx`
- [x] `AGENT-014` 创建 `components/agent/agent-composer.tsx`
- [x] `AGENT-015` 创建 `components/agent/agent-quick-actions.tsx`
- [x] `AGENT-016` 创建 `components/agent/agent-process-message.tsx`
- [x] `AGENT-017` 创建 `components/agent/agent-proposal-card.tsx`
- [x] `AGENT-018` 创建 `components/agent/agent-prompt-compare-card.tsx`

### 状态骨架

- [x] `AGENT-020` 创建 `stores/use-agent-store.ts`
- [x] `AGENT-021` 定义 `AgentMode / AgentSessionStatus / AgentMessage / AgentPlan` 基础类型
- [x] `AGENT-022` 实现消息追加、状态切换、待确认计划设置与清空

### 编辑器接入

- [x] `AGENT-030` 将 `AgentPanel` 接入编辑器页布局
- [x] `AGENT-031` 调整画布区与 Agent 区宽度布局
- [x] `AGENT-032` 保证接入后不破坏现有 Canvas 工具栏、缩略图、自动保存与快捷键

### M1 验收

- [x] `AGENT-040` 面板可显示
- [x] `AGENT-041` 输入框可输入
- [x] `AGENT-042` 发送消息后可渲染用户消息与本地过程消息
- [x] `AGENT-043` 无画布功能回归

---

## 3.2 M2 计划链路

### Agent 基础能力层

- [x] `AGENT-100` 创建 `lib/agent/types.ts`
- [x] `AGENT-101` 创建 `lib/agent/constants.ts`
- [x] `AGENT-102` 创建 `lib/agent/summarize-canvas.ts`
- [x] `AGENT-103` 创建 `lib/agent/build-agent-plan.ts`
- [x] `AGENT-104` 创建 `lib/agent/validate-agent-plan.ts`

### 画布摘要

- [x] `AGENT-110` 从 `useFlowStore` 提取节点与连线摘要
- [x] `AGENT-111` 从 `plugin-registry` 提取 label / ports 元信息
- [x] `AGENT-112` 接入最近执行状态与失败节点摘要
- [x] `AGENT-113` 接入当前选中节点语境
- [x] `AGENT-114` 对长文本和复杂节点配置做压缩

### 后端 API

- [x] `AGENT-120` 创建 `app/api/agent/CLAUDE.md`
- [x] `AGENT-121` 创建 `app/api/agent/plan/route.ts`
- [x] `AGENT-122` 定义 `AgentPlanRequest / AgentPlanResponse` schema
- [x] `AGENT-123` 实现服务端 planner 输出 JSON schema 校验
- [x] `AGENT-124` 实现失败时的稳定错误响应

### 前后端打通

- [x] `AGENT-130` 创建 `hooks/use-agent-session.ts`
- [x] `AGENT-131` 发送用户消息后串起 `summary -> plan API -> pendingPlan`
- [x] `AGENT-132` 面板中渲染 Proposal Card
- [x] `AGENT-133` plan 返回后切换到 `patch-ready` 或 `awaiting-confirmation`

### M2 验收

- [x] `AGENT-140` 用户输入一句话后能得到结构化提案
- [x] `AGENT-141` 提案在 UI 中可读，不暴露原始 JSON
- [x] `AGENT-142` 失败时有清晰错误提示

---

## 3.3 M3 落图链路

### Plan 应用层

- [x] `AGENT-200` 创建 `lib/agent/apply-agent-plan.ts`
- [x] `AGENT-201` 实现 `add_node` 应用
- [x] `AGENT-202` 实现 `update_node_data` 应用
- [x] `AGENT-203` 实现 `connect` 应用
- [x] `AGENT-204` 实现 `disconnect` 应用
- [x] `AGENT-205` 实现 `focus_nodes` 应用

### 安全校验

- [x] `AGENT-210` 校验 nodeType 是否存在
- [x] `AGENT-211` 校验 nodeId 是否存在
- [x] `AGENT-212` 校验端口连接合法性
- [x] `AGENT-213` 校验高风险 operation 是否转确认态

### 与现有 store 衔接

- [x] `AGENT-220` 应用前接入 `useHistoryStore` 快照
- [x] `AGENT-221` 通过 `useFlowStore` 真正修改节点与边
- [x] `AGENT-222` 落图后生成用户可读的 change summary
- [x] `AGENT-223` 验证 `useAutoSave` 能自动接住变更

### 错误与回滚

- [x] `AGENT-230` 实现 apply 中断与错误上报
- [x] `AGENT-231` 实现 apply 失败时的回滚策略
- [x] `AGENT-232` 在聊天区返回“是否已回滚”的真实状态

### M3 验收

- [x] `AGENT-240` 一句话可在左侧生成最小工作流
- [x] `AGENT-241` 小范围修改可成功落到现有画布
- [x] `AGENT-242` 用户可撤销 Agent 改动
- [x] `AGENT-243` 自动保存无回归

---

## 3.4 M4 提示词确认

### Prompt refine API

- [x] `AGENT-300` 创建 `app/api/agent/refine-prompt/route.ts`
- [x] `AGENT-301` 定义 `PromptConfirmationPayload` schema
- [x] `AGENT-302` 服务端实现原始意图、画面提案、执行 prompt 三段输出
- [x] `AGENT-303` 支持基础风格变体建议

### 前端确认卡片

- [x] `AGENT-310` 完成 `agent-prompt-compare-card.tsx` 正式结构
- [x] `AGENT-311` 支持“确认并执行”
- [x] `AGENT-312` 支持“再来一版”
- [x] `AGENT-313` 支持“更写实 / 更动漫 / 更商业”
- [x] `AGENT-314` 支持展开查看完整 prompt

### 执行联动

- [x] `AGENT-320` 将确认后的 prompt patch 回对应节点
- [x] `AGENT-321` 支持确认后触发 `run_workflow`
- [x] `AGENT-322` 聊天区展示执行开始过程消息

### M4 验收

- [x] `AGENT-330` 图片工作流创建后能进入 prompt 确认态
- [x] `AGENT-331` 用户确认后左侧节点配置被更新
- [x] `AGENT-332` 用户可基于风格建议快速再生成一版

---

## 3.5 M5 诊断与收口

### Diagnose API

- [x] `AGENT-400` 创建 `app/api/agent/diagnose/route.ts`
- [x] `AGENT-401` 定义 `AgentDiagnosis` schema
- [x] `AGENT-402` 接入最近执行失败摘要
- [x] `AGENT-403` 输出现象、根因、修复建议

### Explain API

- [x] `AGENT-410` 创建 `app/api/agent/explain/route.ts`
- [x] `AGENT-411` 支持解释当前工作流
- [x] `AGENT-412` 支持解释当前选中节点

### 异步任务联动

- [x] `AGENT-420` 聊天区订阅现有任务/执行状态
- [x] `AGENT-421` 异步任务运行中显示简洁进度反馈
- [x] `AGENT-422` 异步任务完成后生成自然语言结果消息

### 体验打磨

- [x] `AGENT-430` 接入面板动效与 reduced motion 降级
- [x] `AGENT-431` 接入节点高亮、连线描边、focus nodes 视图定位
- [x] `AGENT-432` 接入 Quick Actions
- [x] `AGENT-433` 完成中英文文案补齐

### M5 验收

- [x] `AGENT-440` 用户可询问“为什么跑不通”
- [x] `AGENT-441` 聊天区能给出像样诊断
- [x] `AGENT-442` 执行与异步任务状态可被理解
- [x] `AGENT-443` 体验达到可内测水平

---

## 四、补充任务

### 4.1 测试

- [x] `AGENT-500` 为 `summarize-canvas.ts` 添加单测
- [x] `AGENT-501` 为 `validate-agent-plan.ts` 添加单测
- [x] `AGENT-502` 为 `apply-agent-plan.ts` 添加单测
- [x] `AGENT-503` 为 `use-agent-store.ts` 添加单测
- [x] `AGENT-504` 为 Agent API route 添加路由测试
- [x] `AGENT-505` 增加一条 E2E：一句话生成工作流
- [x] `AGENT-506` 增加一条 E2E：prompt 确认并执行
- [x] `AGENT-507` 增加一条 E2E：诊断失败链路

### 4.2 文案与国际化

- [x] `AGENT-520` 在 `messages/zh.json` 增加 Agent 文案
- [x] `AGENT-521` 在 `messages/en.json` 增加 Agent 文案
- [x] `AGENT-522` 为系统过程消息建立统一 key 命名

### 4.3 文档回环

- [x] `AGENT-530` 为新增目录编写 `CLAUDE.md`
- [x] `AGENT-531` 为核心业务文件补 L3 头部注释
- [x] `AGENT-532` 在实现过程结束后回写本清单与技术设计稿状态

---

## 五、V2 执行清单（改造版）

## 5.1 M6 增量改造

### Planner 增强

- [x] `AGENT-600` 扩展 `AgentMode`，细分 `update / optimize / extend / repair`
- [x] `AGENT-601` 为增量改造新增 `plan intent` 分类：加步骤 / 拆步骤 / 替换模型 / 改输出规模 / 补分支
- [x] `AGENT-602` 为 Planner 增加“保持现有主链”的系统约束，禁止默认全量重建
- [x] `AGENT-603` 为 Planner 增加“基于选中节点优先改造”的决策逻辑
- [x] `AGENT-604` 支持把一句自然语言拆成多步结构化 patch，而不是单操作聚焦

### Operation 协议扩展

- [x] `AGENT-610` 新增 `insert_between` 操作，支持在两节点之间插入中间步骤
- [x] `AGENT-611` 新增 `duplicate_node_branch` 操作，支持生成变体分支
- [x] `AGENT-612` 新增 `replace_node` 操作，支持替换模型节点并保留上下游连接
- [x] `AGENT-613` 新增 `batch_update_node_data` 操作，支持多节点小范围参数批改
- [x] `AGENT-614` 新增 `relabel_node` / `annotate_change` 操作，提升改动可读性

### 落图与校验

- [x] `AGENT-620` 扩展 `validate-agent-plan.ts`，校验中间插入、替换节点、分支复制的安全性
- [x] `AGENT-621` 扩展 `apply-agent-plan.ts`，实现插入中间节点的断边重连
- [x] `AGENT-622` 实现替换节点时保留兼容端口与局部配置迁移
- [x] `AGENT-623` 实现批量改造时的分阶段回滚，避免单点失败污染整图
- [x] `AGENT-624` 为增量改造生成更细粒度的 change summary

### M6 验收

- [x] `AGENT-630` 用户可说“在这个流程前面加一个风格分析步骤”
- [x] `AGENT-631` 用户可说“把这个图片节点换成更便宜的模型”
- [x] `AGENT-632` 用户可说“把输出改成 4 个变体”
- [x] `AGENT-633` 增量改造成功后原有主链不被意外破坏

---

## 5.2 M7 模板对话化

### 模板上下文

- [x] `AGENT-700` 梳理当前模板来源与模板元数据真相源
- [x] `AGENT-701` 为模板建立 `TemplateSummary` 类型与序列化规范
- [x] `AGENT-702` 在画布摘要器中加入“当前基于哪个模板创建”的上下文
- [x] `AGENT-703` 支持 Agent 解释模板目标、适用场景与当前结构

### 模板改造链路

- [x] `AGENT-710` 新增 `POST /api/agent/template-plan`
- [x] `AGENT-711` 支持“按行业/风格/目标改模板”的结构化计划输出
- [x] `AGENT-712` 支持模板改造前先生成用户可读提案卡
- [x] `AGENT-713` 支持模板改造后同步更新默认 prompt、模型、输出规格
- [x] `AGENT-714` 支持模板改造结果回写到工作流审计记录

### UI 与体验

- [x] `AGENT-720` Quick Actions 增加模板起手建议
- [x] `AGENT-721` Proposal Card 增加“基于模板改造”来源标识
- [x] `AGENT-722` 会话中展示“当前模板已被改造成什么方向”

### M7 验收

- [x] `AGENT-730` 用户可先选模板再说“改成适合服装商品的”
- [x] `AGENT-731` Agent 可解释模板与修改方向
- [x] `AGENT-732` 模板改造结果能安全落图并自动保存

---

## 5.3 M8 优化建议

### Diagnose / Optimize 语义增强

- [x] `AGENT-800` 扩展 `AgentDiagnosis`，新增成本、速度、结构冗余三类诊断维度
- [x] `AGENT-801` 在摘要器中加入模型价格、任务耗时、失败率、重复节点线索
- [x] `AGENT-802` 新增 `POST /api/agent/optimize`
- [x] `AGENT-803` 支持输出“问题 -> 原因 -> 优化提案 -> 风险”的标准结构

### 优化落图

- [x] `AGENT-810` 支持“更便宜模型替换”提案
- [x] `AGENT-811` 支持“慢步骤拆分/并行建议”提案
- [x] `AGENT-812` 支持“缺 Display / 缺缓存 / 缺分支汇合”结构性修复提案
- [x] `AGENT-813` 支持“只建议不改图”与“确认后代改”两种模式

### M8 验收

- [x] `AGENT-820` 用户可问“哪里可以更省钱”
- [x] `AGENT-821` 用户可问“这个流程太慢了，帮我优化一下”
- [x] `AGENT-822` 系统能给出像样的优化提案并可选择是否应用

---

## 5.4 M9 结果续写

### 结果理解

- [x] `AGENT-900` 为摘要器加入最近输出资产摘要（图片/视频/音频/文本结果）
- [x] `AGENT-901` 抽取“最近一次成功结果”作为下一步建议输入
- [x] `AGENT-902` 支持结果导向的 follow-up 建议生成

### 建议到落图

- [x] `AGENT-910` Quick Actions 增加“基于结果继续”
- [x] `AGENT-911` 支持基于图片结果补视频分支
- [x] `AGENT-912` 支持基于生成结果补标题/正文/变体分支
- [x] `AGENT-913` 支持把 follow-up 建议先作为轻提案展示，再决定是否落图

### M9 验收

- [x] `AGENT-920` 图片生成完成后系统可建议下一步
- [x] `AGENT-921` 用户确认后可自动长出新分支
- [x] `AGENT-922` 新分支改动可撤销、可追踪、可解释

---

## 六、V3 执行清单（共创版）

## 6.1 M10 节点语境

### 节点选择上下文

- [x] `AGENT-1000` 创建 `use-agent-selection-context.ts`
- [x] `AGENT-1001` 在 `useFlowStore` 选中态基础上建立节点语境快照
- [x] `AGENT-1002` 支持识别当前节点输入、输出、关键配置、最近执行结果
- [x] `AGENT-1003` Header 展示“当前已选中某节点”的轻提示

### 节点级对话

- [x] `AGENT-1010` 支持“这个节点在做什么”的节点级解释
- [x] `AGENT-1011` 支持“把这个节点改成更写实/更便宜/更快”的节点级改动
- [x] `AGENT-1012` 支持“从这个节点开始执行”的局部执行提案
- [x] `AGENT-1013` 支持节点级 prompt 修改后只 patch 当前节点

### M10 验收

- [x] `AGENT-1020` 选中 `image-gen` 节点后系统理解当前节点语境
- [x] `AGENT-1021` 用户可对选中节点发出局部修改指令
- [x] `AGENT-1022` 节点级执行与解释结果可被聊天区理解

---

## 6.2 M11 上下文增强

### 摘要器增强

- [x] `AGENT-1100` 扩展 `CanvasSummary`，加入 workflow goal、资产摘要、历史诊断摘要
- [x] `AGENT-1101` 支持长文本、长 prompt、多节点配置的分级压缩
- [x] `AGENT-1102` 支持节点簇、子链路、结果资产的语义摘要
- [x] `AGENT-1103` 支持 recent operations timeline，帮助 Agent 理解刚刚改过什么

### 多提案与长链记忆

- [x] `AGENT-1110` 支持一个目标生成多版提案而非单版提案
- [x] `AGENT-1111` 支持“更保守 / 更激进 / 更省钱 / 更高质量”多方案比较
- [x] `AGENT-1112` 增加会话级短期创作记忆，只保存本工作流内近期上下文
- [x] `AGENT-1113` 为多提案建立统一比较卡片与选择动作

### M11 验收

- [x] `AGENT-1120` 复杂工作流下摘要仍稳定可读
- [x] `AGENT-1121` 用户可在多版提案中选择方向
- [x] `AGENT-1122` Agent 能记住最近一两轮的创作上下文，不必重复问同样问题

---

## 6.3 M12 共创闭环

### API 与数据

- [x] `AGENT-1200` 为 Agent 审计记录建立持久化方案
- [x] `AGENT-1201` 记录用户原话、摘要、plan、确认、执行、结果
- [x] `AGENT-1202` 支持重放最近一次 Agent 改图记录
- [x] `AGENT-1203` 为关键 Agent 事件补齐埋点与分析字段

### 体验收口

- [x] `AGENT-1210` 实现“查看改动”聚焦入口
- [x] `AGENT-1211` 实现“回到最新提案”与“回看上次改动”入口
- [x] `AGENT-1212` 为多提案、节点语境、结果续写统一视觉规范
- [x] `AGENT-1213` 对低性能设备和 reduced motion 做完整降级

### 测试与验收

- [x] `AGENT-1220` 为新增 operation 与 optimize/template API 补单测
- [x] `AGENT-1221` 增加 E2E：模板改造链路
- [x] `AGENT-1222` 增加 E2E：节点级修改链路
- [x] `AGENT-1223` 增加 E2E：基于结果自动建议下一步
- [x] `AGENT-1224` 增加 E2E：多提案选择并落图
- [x] `AGENT-1225` 增加 E2E：优化建议并确认应用

### M12 验收

- [x] `AGENT-1230` V2 能力全部具备稳定测试覆盖
- [x] `AGENT-1231` V3 共创能力完成端到端闭环
- [x] `AGENT-1232` Agent 行为具备可追踪、可回放、可审计能力
- [x] `AGENT-1233` 体验达到公开灰度或深度内测标准

---

## 七、风险清单

### 高风险

1. `Canvas` 主组件被继续做胖
2. Planner 输出不稳定导致 plan schema 失控
3. 没有本地二次校验就直接落图
4. Agent 改图与现有撤销链断开

### 中风险

1. 提示词确认卡片做得太复杂
2. 聊天区进度反馈和真实任务状态不同步
3. 文案太多导致 UI 变重

### 低风险

1. 视觉细节还需继续优化
2. Quick Actions 第一版命中率一般

---

## 八、建议开发顺序

1. 先完成 M1 与 M2，拿到“能提案”的演示版本
2. 再完成 M3，拿到“能改图”的核心闭环
3. 然后补 M4，让图片工作流真正可用
4. 最后用 M5 诊断与体验打磨收尾
5. 接着做 M6 与 M7，先把“改已有图”和“模板对话化”打通
6. 再做 M8 与 M9，让 Agent 不只会搭图，还会优化和续写
7. 最后用 M10 ~ M12 收口节点语境、多提案、记忆、审计与完整测试闭环

---

## 九、完成定义

一个任务只有同时满足以下条件才算完成：

1. 功能已落地
2. 文档已同步
3. 至少完成静态自检
4. 可运行验证项已记录结果
5. 已做 git 留痕

---

## 十、版本完成定义

### 10.1 V1 完成定义

1. 用户能一句话生成最小工作流
2. Prompt 确认链、执行链、基础诊断链已打通
3. Agent 改图可撤销、可回滚、可自动保存

### 10.2 V2 完成定义

1. Agent 能对已有工作流做稳定增量改造，而不是频繁全量重建
2. 模板能被对话化解释与改造
3. 系统能给出成本/速度/结构优化建议，并支持确认后应用
4. 基于已有结果可建议下一步并长出新分支

### 10.3 V3 完成定义

1. 选中节点后 Agent 能进入稳定节点语境
2. 复杂工作流下摘要、提案、多方案比较仍保持可读和可控
3. Agent 共创行为具备短期记忆、审计、回放与完整测试闭环
4. 聊天与画布真正形成深度双向协作，而不是“右边说话、左边偶尔改图”

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
