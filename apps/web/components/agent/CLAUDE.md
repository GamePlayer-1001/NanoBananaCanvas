# apps/web/components/agent/

> L2 | 父级: apps/web/components/CLAUDE.md

Agent 面板 UI 模块。这里只承载右下角悬浮助手卡片的展示层，不承载 Planner、落图校验或工作流真相源。

## 成员清单

```
agent-panel.tsx               — 悬浮 Agent 卡片外壳，负责折叠 / 展开 / 拖拽 / 拖宽，并组织 Header / Conversation / Quick Actions / Composer
agent-header.tsx              — 轻头部，展示一句主标题、当前上下文与最近改动入口
agent-conversation.tsx        — 对话滚动区，串联用户消息、自动折叠的过程记录与轻量 prompt 确认文本，首屏可承载轻引导 Hero
agent-message-item.tsx        — 基础消息渲染器，按 role 渲染更轻量的用户 / 助手 / 诊断消息气泡
agent-process-message.tsx     — 过程消息组件，承载“正在理解 / 正在搭建 / 已同步”等轻反馈，并提供 reduced motion 兼容状态条
agent-proposal-card.tsx       — 历史工作流提案卡片，当前主链已弱化展示，仅保留兼容与回放价值
agent-prompt-compare-card.tsx — Prompt 轻展示块，用纯文本分行呈现原始意图 / 画面提案 / 执行提示词 / 风格方向，并通过聊天确认继续执行
agent-change-log-sheet.tsx    — Agent 改动回看侧板，展示最近提案/回放摘要与“查看改动”内容
agent-quick-actions.tsx       — 轻量建议动作区，承载首屏引导按钮与诊断 / 解释 / 优化 / 模板改造等下一步建议
agent-composer.tsx            — 输入区，负责文本输入、发送动作，以及输入框上方的模型 / 平台模式切换
```

## 职责边界

1. 本目录只负责 Agent 展示层与交互壳，不直接操作 `useFlowStore`
2. 复杂状态切换由 `use-agent-store.ts` 驱动，组件只消费状态
3. Planner、Validator、Applier 等编排逻辑归 `apps/web/lib/agent/`
4. 与画布的真正数据同步由 hooks/store 层完成，不在组件里拼装 operation plan

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
