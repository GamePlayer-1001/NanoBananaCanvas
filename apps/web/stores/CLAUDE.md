# apps/web/stores/

> L2 | 父级: apps/web/CLAUDE.md

Zustand 客户端状态管理

## 成员清单

```
use-flow-store.ts         — 画布核心状态 (nodes/edges/viewport CRUD + ReactFlow 事件，onConnect/setFlow 校验连接并用新边替换同输入端口旧边)
use-flow-store.test.ts    — useFlowStore 连线替换行为测试 (同一输入端口新边覆盖旧边)
use-canvas-tool-store.ts  — 画布工具状态 (select/hand/text-input/llm/display 工具切换)
use-execution-store.ts    — 工作流执行状态 (当前节点/执行顺序/结果/错误追踪)
use-history-store.ts      — 撤销/重做快照栈 (past/future 各 50 条上限，防抖推入)
use-agent-store.ts        — Agent 会话状态 (消息流 / 模式 / 状态机 / 待确认计划 / prompt confirmation)
use-workspace-store.ts    — 工作区 UI 状态 (viewMode/sortBy/searchQuery)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
