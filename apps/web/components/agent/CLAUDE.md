# apps/web/components/agent/

> L2 | 父级: apps/web/components/CLAUDE.md

Agent 面板 UI 模块。这里只承载右侧助手面板的展示层，不承载 Planner、落图校验或工作流真相源。

## 成员清单

```
agent-panel.tsx               — Agent 面板总装配，组织 Header / Conversation / Quick Actions / Composer
agent-header.tsx              — 面板头部，展示模式、上下文摘要与提案/诊断状态入口
agent-conversation.tsx        — 对话滚动区，串联用户消息、过程消息、提案卡片与确认卡片，并把 prompt 确认动作透传给会话层
agent-message-item.tsx        — 基础消息渲染器，按 role 渲染用户/助手/诊断等通用消息
agent-process-message.tsx     — 过程消息组件，承载“正在理解 / 正在搭建 / 已同步”等轻反馈，并提供 reduced motion 兼容状态条
agent-proposal-card.tsx       — 工作流提案卡片，展示计划摘要、理由、改动项与确认需求
agent-prompt-compare-card.tsx — Prompt 对比卡片，展示原始意图 / 画面提案 / 执行提示词 / 风格方向，并承载确认/重写/展开动作
agent-quick-actions.tsx       — 轻量建议动作区，承载诊断 / 解释 / 优化 / 风格调整等下一步建议
agent-composer.tsx            — 输入区，负责文本输入、发送动作与最小工作流影响提示
```

## 职责边界

1. 本目录只负责 Agent 展示层与交互壳，不直接操作 `useFlowStore`
2. 复杂状态切换由 `use-agent-store.ts` 驱动，组件只消费状态
3. Planner、Validator、Applier 等编排逻辑归 `apps/web/lib/agent/`
4. 与画布的真正数据同步由 hooks/store 层完成，不在组件里拼装 operation plan

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
