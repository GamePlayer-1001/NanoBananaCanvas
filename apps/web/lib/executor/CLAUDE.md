# apps/web/lib/executor/

> L2 | 父级: apps/web/lib/CLAUDE.md

工作流 DAG 执行引擎 — 拓扑排序 + 逐节点执行 + 流式输出

## 成员清单

```
index.ts              — 聚合导出执行引擎公共 API
topological-sort.ts   — Kahn 算法 BFS 拓扑排序 + 环检测 (O(V+E))
node-executor.ts      — 节点执行分发器 (text-input/llm/display/image-gen/video-gen/audio-gen)，按 nodeType 路由到具体执行函数
workflow-executor.ts  — 顶层编排器 WorkflowExecutor 类 (排序→输入收集→执行→状态更新→中断→错误处理)
topological-sort.test.ts — 拓扑排序单元测试 (8 用例: 空图/线性/钻石/断连/环检测)
```

## 架构

```
WorkflowExecutor.execute()
    ├── topologicalSort(nodes, edges)    → 确定执行顺序
    ├── for nodeId of order:
    │   ├── collectInputs()              → 沿 edges 回溯上游输出
    │   ├── executeNode()                → 按 nodeType 分发
    │   │   ├── text-input → 直接输出 config.text
    │   │   ├── llm → OpenRouter chat/chatStream
    │   │   ├── image-gen → ImageGenProcessor submit+check
    │   │   ├── video-gen → VideoGenProcessor submit (异步轮询)
    │   │   ├── audio-gen → AudioGenProcessor (OpenAI TTS) submit+check
    │   │   └── display → 透传 content-in
    │   └── callbacks → 更新 ExecutionStore + FlowStore
    └── abort() → AbortController 中断
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
