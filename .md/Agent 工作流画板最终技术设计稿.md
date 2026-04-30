# Agent 工作流画板最终技术设计稿

> 文档版本：v1.0
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

### 3.5 最小惊扰

右侧 Agent 面板不主动打断用户，不抢画布焦点，不制造第二个复杂工作台。

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
Planner API
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

apps/web/stores/
  use-agent-store.ts

apps/web/hooks/
  use-agent-session.ts
  use-agent-actions.ts
  use-agent-selection-context.ts

apps/web/lib/agent/
  types.ts
  constants.ts
  summarize-canvas.ts
  build-agent-plan.ts
  validate-agent-plan.ts
  apply-agent-plan.ts
  explain-agent-change.ts
  prompt-confirmation.ts
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
type AgentMode = 'create' | 'update' | 'diagnose' | 'optimize'

type AgentSessionStatus =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'patch-ready'
  | 'awaiting-confirmation'
  | 'applying-patch'
  | 'ready-to-run'
  | 'running'
  | 'diagnosing'
  | 'error'

type AgentStoreState = {
  mode: AgentMode
  status: AgentSessionStatus
  messages: AgentMessage[]
  pendingPlan: AgentPlan | null
  promptConfirmation: PromptConfirmationPayload | null
  selectionContext: AgentSelectionContext | null
  lastAppliedPlanId: string | null
  errorMessage: string | null
}
```

### 8.3 状态迁移

```text
idle
  -> understanding
  -> planning
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
  }>
  disconnectedNodeIds: string[]
  displayMissingForNodeIds: string[]
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
  | { id: string; role: 'prompt-confirmation'; payloadId: string; createdAt: string }
  | { id: string; role: 'diagnosis'; text: string; severity: 'info' | 'warning' | 'error'; createdAt: string }
```

### 9.3 Agent Plan

```ts
type AgentPlan = {
  id: string
  goal: string
  mode: 'create' | 'update' | 'diagnose' | 'optimize'
  summary: string
  reasons: string[]
  requiresConfirmation: boolean
  operations: WorkflowOperation[]
  promptConfirmation?: PromptConfirmationPayload
}
```

### 9.4 Workflow Operation

```ts
type WorkflowOperation =
  | {
      type: 'add_node'
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
  styleOptions?: Array<{
    id: string
    label: string
    promptDelta: string
  }>
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

### 13.3 回滚

应用阶段任何一步失败时：

1. 立即停止后续 operation
2. 标记会话为 `error`
3. 尝试使用最近快照回滚
4. 明确告诉用户是否已经回滚成功

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

### 15.2 输出

诊断结果建议结构：

```ts
type AgentDiagnosis = {
  summary: string
  rootCause: string
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

### 16.3 用户操作

1. `确认并执行`
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

### 18.2 防失控约束

1. Operation 集必须白名单化
2. 不允许任意脚本执行
3. 不允许任意文件写入
4. 不允许直接操作数据库持久层

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

建议审计字段：

1. 用户原话
2. 当前模式
3. 计划摘要
4. operation 数量
5. 是否确认
6. 是否执行成功

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

## 二十二、第一版落地顺序

推荐技术顺序：

1. 先搭 UI 骨架与 `useAgentStore`
2. 再接 `CanvasSummary`
3. 再做 `/api/agent/plan`
4. 再做 `Plan Validator + Plan Applier`
5. 再做 prompt 确认卡片
6. 最后接诊断与执行联动

---

## 二十三、验收标准

满足以下条件才算 V1 完成：

1. 用户能一句话生成最小工作流
2. 生成前后左侧画布确实变化
3. Agent 改动可撤销
4. 高风险改动会要求确认
5. Prompt 确认链可跑通
6. 异步任务执行状态能被聊天区感知
7. 故障诊断能给出有用结论

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
