# apps/web/lib/agent/

> L2 | 父级: apps/web/lib/CLAUDE.md

Agent 编排语义层。这里承载右侧助手与左侧画布之间的中间语义，不承载 React 视图，也不直接越权改动持久化层。

## 成员清单

```
types.ts                — Agent 核心类型定义，收口 AgentMode / AgentMessage / AgentPlan / CanvasSummary / 模板上下文 / 优化信号 / diagnose/explain API 契约
constants.ts            — Agent 常量与阈值真相源，收口允许操作、摘要裁剪规则与默认过程文案
summarize-canvas.ts     — 画布摘要器，从 Flow/Execution/节点元数据提炼稳定上下文，并注入 workflow goal / 资产摘要 / 节点簇 / 子链路 / recent timeline / 模板来源 / 改造方向 / 优化线索
template-catalog.ts     — 模板目录与起手工作流真相源，为模板新建、解释与改造规划提供统一入口
build-agent-plan.ts     — 计划构建器，连接前端会话与 `/api/agent/plan`
build-template-plan.ts  — 模板计划构建器，连接前端会话与 `/api/agent/template-plan`
diagnose-canvas.ts      — 诊断语义层，连接前端会话与 `/api/agent/diagnose`
optimize-canvas.ts      — 优化语义层，连接前端会话与 `/api/agent/optimize`
explain-canvas.ts       — 解释语义层，连接前端会话与 `/api/agent/explain`
validate-agent-plan.ts  — 本地安全校验器，约束 nodeType / nodeId / 连线兼容与高风险确认
apply-agent-plan.ts     — 落图应用器，把结构化 operation 映射到 FlowStore / HistoryStore，并支持 focus nodes 视角聚焦
explain-agent-change.ts — 变更解释器，把落图结果翻译成用户可读摘要
prompt-confirmation.ts  — Prompt 确认语义层，请求 refine-prompt API，处理原始意图 / 画面提案 / 执行提示词三段结构
plan-rules.ts           — Planner 规则拆分层，承载创建链路、节点级改动、结果续写与多提案规则 helper，避免 plan route 继续膨胀
```

## 职责边界

1. 本目录只负责 Agent 编排语义，不包含 React 组件
2. 最终工作流真相源仍是 `useFlowStore`，本目录只能生成与应用结构化意图
3. 所有高风险改动必须先经过 `validate-agent-plan.ts`，不得绕过确认规则
4. 真正执行工作流仍复用既有执行链与 `lib/tasks/`，不自建第二套运行时

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
