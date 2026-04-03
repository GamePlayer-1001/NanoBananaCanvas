# apps/web/stores/

> L2 | 父级: apps/web/CLAUDE.md

Zustand 客户端状态管理

## 成员清单

```
use-flow-store.ts         — 画布核心状态 (nodes/edges/viewport CRUD + ReactFlow 事件)
use-canvas-tool-store.ts  — 画布工具状态 (select/hand/text-input/llm/display 工具切换)
use-execution-store.ts    — 工作流执行状态 (当前节点/执行顺序/结果/错误追踪)
use-history-store.ts      — 撤销/重做快照栈 (past/future 各 50 条上限，防抖推入)
use-workspace-store.ts    — 工作区 UI 状态 (viewMode/sortBy/searchQuery)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
