# Agent 工作流画板最终技术设计稿

> 文档版本：v2.0
> 创建日期：2026-04-30
> 适用范围：Nano Banana Canvas 右侧 Agent 面板、画布联动、Agent 编排与执行链路
> 上游文档：`Agent 工作流画板完整方案.md`

---

## 一、文档目标

本文档不是产品愿景稿，而是正式进入实现阶段前的技术真相源。

它回答六个问题：

1. Agent 工作流画板到底要新增哪些系统模块
2. 这些模块之间如何通信
3. 哪些状态归谁管理
4. Agent 对画布的修改如何安全落地
5. 执行、诊断、确认如何复用现有运行时
6. 第一版的边界和禁区是什么

---

## 二、范围定义

### 2.1 本期纳入范围

V1 技术实现只覆盖：

1. 右侧 Agent 单面板 UI
2. 自然语言创建最小工作流
3. 对已有工作流的小范围增量修改
4. 提示词润色与确认卡片
5. 基础工作流诊断
6. 与左侧 ReactFlow 画布的双向同步
7. 与现有自动保存、执行、异步任务体系对接

### 2.2 本期明确不做

1. 多 Agent 协作
2. 长期创作记忆库
3. 全自动大规模工作流重构
4. 多模态聊天附件系统
5. 复杂模板商城编排
6. 后台自主连续执行

### 2.3 V2 范围定义

V2 技术实现新增覆盖：

1. 对已有工作流的小中型增量改造
2. 模板解释、模板改造、模板到工作流的对话化收口
3. 成本/速度/结构优化建议与确认应用
4. 基于结果资产的下一步建议与分支续写
5. 更丰富但仍受控的 operation 协议

### 2.4 V3 范围定义

V3 技术实现新增覆盖：

1. 节点语境自动理解
2. 更强上下文摘要与节点簇/资产语义压缩
3. 多版本提案比较
4. 工作流内短期创作记忆
5. Agent 改图审计、回放与分析

### 2.5 V2 / V3 仍然不做

即便进入 V2 / V3，也仍然不做：

1. LLM 直接覆盖整份 workflow JSON
2. 脱离现有 FlowStore 的平行工作流真相源
3. 无边界后台自主连续执行
4. 未经确认的大规模 destructive 改图
5. 为炫技引入复杂多面板控制台

---

## 三、设计原则

### 3.1 单一真相源

最终工作流状态只能存在于：

1. `useFlowStore`
2. 自动保存后的 workflow 持久化结果
3. 执行记录与异步任务运行时

Agent 不允许维护一套平行 workflow 树。

### 3.2 Agent 只产生结构化意图，不直接操作原始 JSON

正确链路：

`对话输入 -> 画布摘要 -> Planner -> Operation Plan -> 校验 -> 应用 -> 保存`

错误链路：

`对话输入 -> LLM 直接输出完整 workflow JSON -> 覆盖 store`

### 3.3 UI 与编排解耦

Agent UI 只负责展示与触发。

真正的推理、校验、应用必须落在独立 `lib/agent/*` 层，否则 `Canvas` 会迅速膨胀为巨石组件。

### 3.4 可确认优先于可自动化

用户信任比一次性自动化更重要。

对于删除、替换核心模型、高成本执行、大面积改图，必须先确认。

但“确认优先”不等于“所有创建请求都先卡审批”。

创建类请求的推荐主链是：

1. 先生成最小工作流
2. 再按需展示 prompt confirmation
3. 用户通过聊天确认后再继续高成本生成

### 3.5 最小惊扰

Agent 面板应作为右下角悬浮卡片浮在画布上层，不主动打断用户，不抢画布焦点，不制造第二个复杂工作台。

---

## 四、现有系统约束

### 4.1 已存在的核心基础设施

当前项目已具备：

1. `ReactFlow` 画布引擎
2. `useFlowStore` 节点/连线/视口真相源
3. `plugin-registry.ts` 节点元数据真相源
4. `useHistoryStore` 撤销/重做快照
5. `useAutoSave` 自动保存
6. `useExecutionStore` 执行态
7. `lib/tasks/service.ts` 异步任务服务层
8. 各类 AI Node 运行时配置语义层

### 4.2 对新增 Agent 系统的直接约束

因此 Agent 系统必须：

1. 复用现有节点类型体系，不自建节点 schema
2. 复用 `useFlowStore` 做最终写入
3. 复用 `useHistoryStore` 确保撤销可用
4. 复用现有执行链，不自建任务引擎
5. 复用现有自动保存，不发明第二套草稿保存

---

## 五、总体架构

### 5.1 模块图

```text
User
  ↓
Agent Panel UI
  ↓
useAgentStore / useAgentSession
  ↓
Agent Action Layer
  ↓
Canvas Summarizer
  ↓
Planner / Optimize / Template / Diagnose API
  ↓
Operation Plan
  ↓
Plan Validator
  ↓
Plan Applier
  ↓
useFlowStore / useHistoryStore / useExecutionStore
  ↓
Auto Save / Workflow Execute / Async Tasks
  ↓
Agent Audit / Replay / Analytics
```

### 5.2 分层职责

1. `components/agent/*`
   只负责 UI 结构、消息渲染、动效和交互触发
2. `stores/use-agent-store.ts`
   负责会话状态、消息流、待确认 plan、当前模式
3. `hooks/use-agent-session.ts`
   负责把 UI 行为组装成高层动作
4. `lib/agent/summarize-canvas.ts`
   负责读取当前画布与执行态，输出压缩上下文
5. `lib/agent/build-agent-plan.ts`
   负责调用后端 Agent API，拿回结构化计划
6. `lib/agent/validate-agent-plan.ts`
   负责本地安全校验
7. `lib/agent/apply-agent-plan.ts`
   负责把 plan 应用到 store
8. `app/api/agent/*`
   负责真正的推理、解释、诊断与 prompt refine
9. `agent audit layer`
   负责记录用户原话、摘要、plan、确认、执行结果与回放索引

---

## 六、前端目录设计

```text
apps/web/components/agent/
  agent-panel.tsx
  agent-header.tsx
  agent-conversation.tsx
  agent-message-item.tsx
  agent-process-message.tsx
  agent-proposal-card.tsx
  agent-prompt-compare-card.tsx
  agent-quick-actions.tsx
  agent-composer.tsx
  agent-plan-compare-card.tsx
  agent-change-log-sheet.tsx

apps/web/stores/
  use-agent-store.ts

apps/web/hooks/
  use-agent-session.ts
  use-agent-actions.ts
  use-agent-selection-context.ts
  use-agent-audit.ts
  use-agent-replay.ts

apps/web/lib/agent/
  types.ts
  constants.ts
  summarize-canvas.ts
  build-agent-plan.ts
  validate-agent-plan.ts
  apply-agent-plan.ts
  explain-agent-change.ts
  prompt-confirmation.ts
  summarize-assets.ts
  build-optimize-plan.ts
  build-template-plan.ts
  compare-agent-plans.ts
  audit-agent-run.ts
```

---

## 七、前端 UI 结构

### 7.1 页面布局

编辑器页建议演进为：

```text
┌─────────────────────────────┬──────────────────────┐
│ Canvas Area                 │ Agent Panel          │
│ ReactFlow + Toolbars        │ Header               │
│                             │ Conversation         │
│                             │ Quick Actions        │
│                             │ Composer             │
└─────────────────────────────┴──────────────────────┘
```

### 7.2 宽度建议

1. 桌面宽屏：Agent 面板 `360px`
2. 1366 宽度以下：Agent 面板 `320px`
3. 小于 `lg`：继续保持桌面专属，不开启移动端编辑器

### 7.3 组件显示规则

1. `Header` 永远显示
2. `Conversation` 永远显示
3. `Quick Actions` 在 `idle / awaiting-confirmation / ready-to-run` 显示
4. `Proposal Card` 只在 `patch-ready / awaiting-confirmation` 显示
5. `Prompt Compare Card` 只在需要 prompt 确认时显示
6. `Composer` 永远显示
7. `Plan Compare Card` 只在多提案模式启用时显示
8. `Change Log Sheet` 在用户主动查看改动时显示

---

## 八、状态管理设计

### 8.1 Agent Store 职责边界

`useAgentStore` 不得持有：

1. `nodes`
2. `edges`
3. `viewport`
4. `完整执行结果`

`useAgentStore` 只持有：

1. 消息列表
2. 当前 session 状态
3. 当前模式
4. 当前待确认 plan
5. 当前 prompt confirmation payload
6. 当前节点语境摘要
7. UI 级 loading / error

### 8.2 状态结构

```ts
type AgentMode =
  | 'create'
  | 'update'
  | 'diagnose'
  | 'optimize'
  | 'extend'
  | 'template'

type AgentSessionStatus =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'comparing'
  | 'patch-ready'
  | 'awaiting-confirmation'
  | 'applying-patch'
  | 'ready-to-run'
  | 'running'
  | 'diagnosing'
  | 'optimizing'
  | 'replaying'
  | 'error'

type AgentStoreState = {
  mode: AgentMode
  status: AgentSessionStatus
  messages: AgentMessage[]
  pendingPlan: AgentPlan | null
  candidatePlans: AgentPlan[]
  promptConfirmation: PromptConfirmationPayload | null
  selectionContext: AgentSelectionContext | null
  workflowMemory: AgentMemoryEntry[]
  latestAuditId: string | null
  lastAppliedPlanId: string | null
  errorMessage: string | null
}
```

### 8.3 状态迁移

```text
idle
  -> understanding
  -> planning
  -> comparing
  -> patch-ready
  -> awaiting-confirmation | applying-patch
  -> ready-to-run
  -> running
  -> idle

any
  -> error
```

---

## 九、核心类型设计

### 9.1 画布摘要

```ts
type CanvasSummary = {
  workflowId: string
  workflowName?: string
  workflowGoal?: string
  nodeCount: number
  edgeCount: number
  selectedNodeId?: string
  selectedNodeType?: string
  selectedNodeLabel?: string
  nodes: Array<{
    id: string
    type: string
    label: string
    inputs: string[]
    outputs: string[]
    configSummary: Record<string, unknown>
    latestResultSummary?: string
    costHint?: string
    speedHint?: string
  }>
  nodeClusters?: Array<{
    id: string
    label: string
    nodeIds: string[]
  }>
  disconnectedNodeIds: string[]
  displayMissingForNodeIds: string[]
  assets?: Array<{
    id: string
    kind: 'image' | 'video' | 'audio' | 'text'
    sourceNodeId: string
    summary: string
  }>
  recentOperations?: Array<{
    kind: string
    summary: string
    createdAt: string
  }>
  latestExecution?: {
    status: 'idle' | 'running' | 'completed' | 'failed'
    failedNodeId?: string
    failedReason?: string
  }
}
```

### 9.2 Agent Message

```ts
type AgentMessage =
  | { id: string; role: 'user'; text: string; createdAt: string }
  | { id: string; role: 'assistant'; text: string; createdAt: string }
  | { id: string; role: 'process'; text: string; step?: string; createdAt: string }
  | { id: string; role: 'proposal'; planId: string; createdAt: string }
  | { id: string; role: 'plan-compare'; candidatePlanIds: string[]; createdAt: string }
  | { id: string; role: 'prompt-confirmation'; payloadId: string; createdAt: string }
  | { id: string; role: 'diagnosis'; text: string; severity: 'info' | 'warning' | 'error'; createdAt: string }
```

### 9.3 Agent Plan

```ts
type AgentPlan = {
  id: string
  goal: string
  mode: 'create' | 'update' | 'diagnose' | 'optimize' | 'extend' | 'template'
  summary: string
  reasons: string[]
  requiresConfirmation: boolean
  operations: WorkflowOperation[]
  riskLevel?: 'low' | 'medium' | 'high'
  estimatedCostImpact?: 'lower' | 'same' | 'higher'
  estimatedSpeedImpact?: 'faster' | 'same' | 'slower'
  promptConfirmation?: PromptConfirmationPayload
}
```

### 9.4 Workflow Operation

```ts
type WorkflowOperation =
  | {
      type: 'add_node'
      nodeId?: string
      nodeType: string
      position?: { x: number; y: number }
      initialData?: Record<string, unknown>
    }
  | {
      type: 'update_node_data'
      nodeId: string
      patch: Record<string, unknown>
    }
  | {
      type: 'remove_node'
      nodeId: string
    }
  | {
      type: 'connect'
      source: string
      sourceHandle?: string
      target: string
      targetHandle?: string
    }
  | {
      type: 'insert_between'
      source: string
      target: string
      nodeId?: string
      nodeType: string
      initialData?: Record<string, unknown>
    }
  | {
      type: 'replace_node'
      nodeId: string
      nextNodeType: string
      configPatch?: Record<string, unknown>
    }
  | {
      type: 'duplicate_node_branch'
      nodeId: string
      count: number
      strategy?: 'parallel-variants' | 'style-variants'
    }
  | {
      type: 'batch_update_node_data'
      nodeIds: string[]
      patch: Record<string, unknown>
    }
  | {
      type: 'disconnect'
      edgeId: string
    }
  | {
      type: 'focus_nodes'
      nodeIds: string[]
    }
  | {
      type: 'request_prompt_confirmation'
      payload: PromptConfirmationPayload
    }
  | {
      type: 'run_workflow'
      scope?: 'all' | 'from-node'
      nodeId?: string
    }
```

### 9.5 Prompt Confirmation Payload

```ts
type PromptConfirmationPayload = {
  id: string
  originalIntent: string
  visualProposal: string
  executionPrompt: string
  targetNodeId?: string
  styleOptions?: Array<{
    id: string
    label: string
    promptDelta: string
  }>
}
```

### 9.6 Agent Memory Entry

```ts
type AgentMemoryEntry = {
  id: string
  kind: 'user-goal' | 'applied-plan' | 'result-summary' | 'diagnosis'
  summary: string
  relatedNodeIds?: string[]
  createdAt: string
}
```

### 9.7 Agent Audit Record

```ts
type AgentAuditRecord = {
  id: string
  workflowId: string
  userMessage: string
  mode: AgentMode
  canvasSummaryDigest: string
  planIds: string[]
  appliedPlanId?: string
  requiresConfirmation: boolean
  executionTriggered: boolean
  result: 'accepted' | 'rejected' | 'failed'
  createdAt: string
}
```

---

## 十、画布摘要器设计

### 10.1 输入来源

摘要器必须读取：

1. `useFlowStore` 的 `nodes / edges / viewport`
2. `useExecutionStore` 的最近执行状态
3. 当前选中节点
4. `plugin-registry` 的 ports 与 label

### 10.2 输出目标

摘要器输出给 Planner 的信息必须：

1. 够短
2. 够稳定
3. 能让 Agent 判断结构问题
4. 不把整份 store 原封不动传过去

### 10.3 规则

1. 只提炼关键 config，不传所有节点内部 UI 字段
2. 图片、视频、音频节点重点保留 provider / model / size / mode
3. 文本节点重点保留摘要，不传超长全文
4. 输出节点缺失、未连线、失败节点必须显式输出
5. V2 起必须补充最近输出资产摘要
6. V3 起必须补充节点簇、近期改动轨迹与短期创作记忆摘要

### 10.4 V2 / V3 增强目标

V2 摘要器至少新增：

1. 成本线索
2. 速度线索
3. 结果资产摘要
4. 当前模板上下文

V3 摘要器至少新增：

1. 节点簇语义
2. 历史操作压缩
3. 当前工作流目标摘要
4. 近期多轮会话记忆摘要

---

## 十一、Planner 设计

### 11.1 后端职责

Planner 放在服务端，而不是浏览器端。

原因：

1. 便于使用平台模型与密钥
2. 便于后续接审计日志
3. 便于统一 schema 校验

### 11.2 输入

```ts
type AgentPlanRequest = {
  userMessage: string
  mode: AgentMode
  canvasSummary: CanvasSummary
  locale: string
}
```

### 11.3 输出

后端必须返回严格结构化 JSON，不能返回自由文本混杂结构。

### 11.4 生成策略

Planner 至少要有三层提示词约束：

1. 系统层：只能使用允许的 operation 集
2. 业务层：画布是真相源，不可覆盖用户原意
3. 输出层：必须返回 JSON schema

### 11.5 V2 Planner 扩展

V2 Planner 需要新增三类能力：

1. `template planner`
   负责模板解释与模板改造
2. `optimize planner`
   负责成本/速度/结构优化建议
3. `extend planner`
   负责基于结果资产续写下一步分支

### 11.6 V3 Planner 扩展

V3 Planner 需要支持：

1. 多提案同时输出
2. 节点语境优先决策
3. 基于短期工作流记忆减少重复追问
4. 复杂工作流下限制单次 plan 动作规模

---

## 十二、Plan Validator 设计

### 12.1 校验目标

在真正落图前，本地必须做第二层校验。

### 12.2 校验项

1. `nodeType` 是否存在于 `plugin-registry`
2. `nodeId` 是否真实存在
3. `connect` 的端口是否兼容
4. `remove_node` 是否触发强确认
5. 是否存在超出第一版边界的 operation
6. 是否有超过阈值的批量改动
7. `insert_between` 是否会破坏主链连接
8. `replace_node` 是否存在必要的端口兼容迁移
9. `duplicate_node_branch` 是否超过分支扩张阈值
10. `batch_update_node_data` 是否误改用户手写核心字段

### 12.3 输出

```ts
type AgentPlanValidationResult = {
  ok: boolean
  requiresConfirmation: boolean
  errors: string[]
  warnings: string[]
}
```

---

## 十三、Plan Applier 设计

### 13.1 应用原则

1. 先入历史快照
2. 再按 operation 顺序修改
3. 修改完成后产出用户可读的 change summary
4. 由现有自动保存链完成持久化

### 13.2 应用策略

`add_node`

1. 从 `createNode` 或节点默认工厂创建
2. 默认位置由策略计算
3. 需要时使用 planner 给的相对位置

`update_node_data`

1. 只做浅层 patch
2. 不覆盖未声明字段

`connect`

1. 复用现有 `onConnect`
2. 触发已有合法性校验

`remove_node`

1. 必须在确认后执行
2. 走 store 原生删除逻辑

`insert_between`

1. 先断开原有 source -> target
2. 新增中间节点
3. 重连 source -> inserted -> target

`replace_node`

1. 保留旧节点位置
2. 尝试迁移兼容配置
3. 尽量保留上下游连接

`duplicate_node_branch`

1. 复制当前节点或节点簇
2. 为变体分支重新生成稳定 nodeId
3. 只在 Planner 明确要求时自动连接后续展示节点

### 13.3 回滚

应用阶段任何一步失败时：

1. 立即停止后续 operation
2. 标记会话为 `error`
3. 尝试使用最近快照回滚
4. 明确告诉用户是否已经回滚成功

### 13.4 V2 / V3 额外要求

1. 批量改图必须产出可读变更摘要
2. 多提案只允许在用户明确选择后应用
3. 节点替换与分支复制必须保留可撤销性
4. 所有 Agent 落图行为都应进入审计链

---

## 十四、与现有执行体系的集成

### 14.1 执行触发

Agent 不直接执行模型 API。

它只做两件事：

1. 触发 `run_workflow`
2. 订阅现有执行态与异步任务态

### 14.2 同步节点执行

如果工作流是同步链，继续走现有执行器。

### 14.3 异步任务执行

如果工作流中含图片、视频、音频异步任务：

1. 继续交给 `lib/tasks/service.ts`
2. Agent 面板只展示任务进度摘要
3. 完成后把结果反馈成自然语言消息

---

## 十五、诊断模式设计

### 15.1 输入

诊断请求需要：

1. 用户问题
2. 当前 `CanvasSummary`
3. 最近执行失败信息
4. 选中节点语境
5. 成本与耗时线索
6. 最近输出资产摘要

### 15.2 输出

诊断结果建议结构：

```ts
type AgentDiagnosis = {
  summary: string
  phenomenon: string
  rootCause: string
  repairSuggestion: string
  affectedNodeIds: string[]
  suggestedOperations?: WorkflowOperation[]
  requiresConfirmation: boolean
}
```

### 15.3 产品要求

诊断不能只复述报错原文，必须输出：

1. 现象
2. 根因
3. 修复建议
4. 是否可直接代为修复

### 15.4 Optimize 模式

V2 起在 diagnose 旁新增 optimize 模式：

1. 输入同样基于 `CanvasSummary`
2. 输出除了问题，还要包含收益预估
3. 默认先给建议，确认后再落图

---

## 十六、Prompt Refine 与确认设计

### 16.1 接口职责

`/api/agent/refine-prompt` 只负责：

1. 保留原始意图
2. 产出画面提案
3. 产出执行 prompt
4. 产出若干风格变体建议

### 16.2 确认策略

以下情况默认进入确认：

1. 首次创建图片生成链
2. 修改图片 prompt 主文本
3. 切换风格方向
4. 高成本执行前

补充规则：

1. 创建工作流本身可以先自动落图
2. 若创建链同时伴随 prompt refinement，则先落工作流，再展示 prompt confirmation
3. prompt confirmation 的继续执行应通过聊天中的确认语句触发，而不是系统级确认按钮

### 16.3 用户操作

1. 聊天输入 `我确认 / 可以执行 / 继续`
2. `改得更写实`
3. `改得更像动漫`
4. `我自己改`
5. `再来一版`

---

## 十七、API 设计

### 17.1 路由建议

```text
POST /api/agent/plan
POST /api/agent/diagnose
POST /api/agent/refine-prompt
POST /api/agent/explain
POST /api/agent/optimize
POST /api/agent/template-plan
GET /api/agent/audits
POST /api/agent/replay
```

### 17.2 `/api/agent/plan`

职责：

1. 接收自然语言目标与画布摘要
2. 返回结构化 `AgentPlan`

### 17.3 `/api/agent/diagnose`

职责：

1. 接收用户问题、摘要与失败信息
2. 返回 `AgentDiagnosis`

### 17.4 `/api/agent/refine-prompt`

职责：

1. 返回 `PromptConfirmationPayload`

### 17.5 `/api/agent/explain`

职责：

1. 用自然语言解释当前工作流或选中节点

### 17.6 `/api/agent/optimize`

职责：

1. 接收优化意图、摘要与运行线索
2. 返回 `AgentPlan` 或 `AgentDiagnosis + optimize proposal`

### 17.7 `/api/agent/template-plan`

职责：

1. 接收模板上下文与改造目标
2. 返回模板改造提案

### 17.8 `/api/agent/audits`

职责：

1. 返回最近 Agent 改图与执行审计记录

### 17.9 `/api/agent/replay`

职责：

1. 根据审计记录回放最近一次 Agent 提案与变更摘要

---

## 十八、权限与安全边界

### 18.1 自动执行边界

允许自动落地：

1. 补 Display 节点
2. 新增 Prompt Refiner
3. 小范围参数 patch
4. 解释型回复

必须确认：

1. 删除节点
2. 替换核心模型
3. 超过 4 个节点改动
4. 触发高成本执行
5. 覆盖用户手写 prompt
6. 替换核心节点类型
7. 一次新增多个并行分支

### 18.2 防失控约束

1. Operation 集必须白名单化
2. 不允许任意脚本执行
3. 不允许任意文件写入
4. 不允许直接操作数据库持久层
5. 不允许在无确认情况下进行 destructive replay

---

## 十九、性能与体验要求

### 19.1 性能指标

1. 面板首次打开 `<= 250ms` 可交互
2. 普通 Agent 回复首个过程反馈 `<= 800ms`
3. 结构化 plan 返回目标 `<= 4s`
4. 本地 patch 应用目标 `<= 100ms`

### 19.2 体验指标

1. 用户发送后必须先看到过程反馈
2. 每次改图后必须知道“左侧改了什么”
3. 面板不阻塞画布拖拽
4. 动效必须支持 reduced motion

---

## 二十、埋点与审计

建议记录以下事件：

1. `agent_message_sent`
2. `agent_plan_generated`
3. `agent_plan_applied`
4. `agent_plan_rejected`
5. `agent_prompt_confirmed`
6. `agent_prompt_regenerated`
7. `agent_diagnosis_requested`
8. `agent_optimize_requested`
9. `agent_plan_compared`
10. `agent_replay_opened`

建议审计字段：

1. 用户原话
2. 当前模式
3. 计划摘要
4. operation 数量
5. 是否确认
6. 是否执行成功
7. 是否来自模板改造
8. 是否基于结果续写
9. 是否节点级操作

---

## 二十一、文案与视觉规范

### 21.1 系统消息语气

必须短、可信、自然。

推荐：

1. `我先理解一下你的目标。`
2. `正在为你搭建基础工作流。`
3. `我已经补上结果展示节点。`
4. `提示词我先帮你润色了一版。`

禁止：

1. 太长的技术解释
2. 强 AI 感的机械播报
3. 暴露内部提示词链路

### 21.2 视觉 token

右侧面板采用中性浅背景 + 品牌蓝紫点缀，不新增重主题体系。

---

## 二十二、分阶段落地顺序

### 22.1 V1

推荐技术顺序：

1. 先搭 UI 骨架与 `useAgentStore`
2. 再接 `CanvasSummary`
3. 再做 `/api/agent/plan`
4. 再做 `Plan Validator + Plan Applier`
5. 再做 prompt 确认卡片
6. 最后接诊断与执行联动

### 22.2 V2

1. 先扩 operation 协议与 validator/applier
2. 再做增量改造 planner
3. 再做模板对话化
4. 再做 optimize 模式
5. 最后接结果续写

### 22.3 V3

1. 先做节点语境
2. 再做上下文增强与多提案
3. 再做短期记忆
4. 最后接审计/回放/分析与完整测试

---

## 二十三、验收标准

### 23.1 V1

满足以下条件才算 V1 完成：

1. 用户能一句话生成最小工作流
2. 生成前后左侧画布确实变化
3. Agent 改动可撤销
4. 高风险改动会要求确认
5. Prompt 确认链可跑通
6. 异步任务执行状态能被聊天区感知
7. 故障诊断能给出有用结论

### 23.2 V2

满足以下条件才算 V2 完成：

1. Agent 能在已有工作流上做稳定增量改造
2. 模板改造链能从提案到落图跑通
3. optimize 模式可输出成本/速度/结构建议
4. 基于结果资产可建议下一步并长出新分支
5. 新增能力具备单测与至少 3 条 E2E 覆盖

### 23.3 V3

满足以下条件才算 V3 完成：

1. 选中节点后 Agent 具备稳定节点语境理解
2. 复杂工作流下支持多提案比较且可控落图
3. 工作流内短期记忆能减少重复追问
4. Agent 审计、回放、分析链跑通
5. 体验、性能、测试与文档全部收口

---

## 二十三点五、实现状态

截至 2026-04-30，本设计稿对应的 V1 实现已完成闭环，当前状态如下：

1. 右侧 Agent 面板、结构化提案、Prompt 确认、落图执行、诊断解释链路均已接入编辑器主画布
2. `Plan -> Validate -> Apply -> Auto Save -> Execute -> Task Summary` 主链已打通，没有自建平行 workflow 真相源
3. `summarize-canvas / validate-agent-plan / apply-agent-plan / use-agent-store / Agent API route` 已补齐回归测试
4. 已新增 3 条 Agent E2E，覆盖一句话生成提案、Prompt 确认并执行、最近一次失败诊断
5. Agent 相关中英文文案与系统过程消息 key 已统一收口到 i18n 命名空间
6. Agent 新增目录与测试目录的 `CLAUDE.md` 镜像已补齐，核心业务文件 L3 契约已核查完成

这意味着本文档第 23 节定义的 V1 验收标准已经满足，可视为进入“可内测、可继续迭代”的实现状态。

### V2 / V3 当前状态

截至 2026-04-30：

1. V2 / V3 主链能力已在当前仓库落地，包括模板改造、优化建议、结果续写、节点语境、短期记忆、审计回放与多提案比较
2. 本文档中 V2 / V3 的范围、模块、类型、API、验收与安全边界已不只是设计口径，也对应当前实现现实
3. 后续若继续演进，应以 `.md/Agent 工作流画板实现任务执行清单.md` 的完成状态与代码现实共同校准，而不是再把 M6 ~ M12 视为“未启动”

---

## 二十四、禁区清单

1. 不允许 LLM 直接覆盖 workflow JSON
2. 不允许 Agent 自建平行节点状态
3. 不允许把逻辑直接堆进 `canvas.tsx`
4. 不允许新增脱离现有 `tasks` 的执行体系
5. 不允许为了炫技引入复杂多面板结构

---

## 二十五、结论

这套技术设计的核心不是“把聊天接到画板边上”，而是：

1. 用 `CanvasSummary` 压缩现有复杂画布
2. 用 `AgentPlan` 约束模型输出
3. 用 `Validator + Applier` 把 AI 意图安全落地
4. 用现有执行与任务系统承接真正运行

如果这四件事做对了，Agent 才会是“工作流编排助手”；做错任何一个，就会退化成不可信的聊天外挂。

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
