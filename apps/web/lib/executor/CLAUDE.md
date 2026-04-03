# apps/web/lib/executor/

> L2 | 父级: apps/web/lib/CLAUDE.md

工作流 DAG 执行引擎 — 拓扑排序 + 逐节点执行 + 条件分支 + 循环迭代 + 流式输出

## 成员清单

```
index.ts              — 聚合导出执行引擎公共 API
topological-sort.ts   — Kahn 算法 BFS 拓扑排序 + 环检测 (O(V+E))
node-executor.ts      — 节点执行分发器 (12 种节点类型)，按 nodeType 路由到具体执行函数
workflow-executor.ts  — 顶层编排器 WorkflowExecutor 类 (排序→执行→条件跳过→循环迭代→中断→错误处理)
topological-sort.test.ts — 拓扑排序单元测试 (8 用例: 空图/线性/钻石/断连/环检测)
node-executor.test.ts — 节点执行单元测试 (text-input/conditional/loop 的输入解析与输出语义)
workflow-executor.test.ts — 执行器集成测试 (条件分支跳过传播 + 循环体迭代聚合)
```

## 架构

```
WorkflowExecutor.execute()
    ├── topologicalSort(nodes, edges)    → 确定执行顺序
    ├── for nodeId of order:
    │   ├── skip if in skippedNodes      → 被条件/循环标记的节点
    │   ├── collectInputs()              → 沿 edges 回溯上游输出
    │   ├── executeNode()                → 按 nodeType 分发
    │   │   ├── text-input → 直接输出 config.text
    │   │   ├── llm → /api/ai/execute or /api/ai/stream
    │   │   ├── image-gen → /api/tasks 提交 + 轮询完成
    │   │   ├── video-gen → /api/tasks 提交 + 轮询完成
    │   │   ├── audio-gen → /api/tasks 提交 + 轮询完成
    │   │   ├── conditional → 评估条件 → true-out/false-out (null 端口)
    │   │   ├── loop → 准备 items → body 子图迭代执行
    │   │   ├── note/group → noop
    │   │   └── display → 透传 content-in
    │   ├── handleConditionalSkip()      → 传播算法跳过 null 分支独占下游
    │   ├── executeLoopBody()            → 对每项迭代执行 body 子图
    │   └── callbacks → 更新 ExecutionStore + FlowStore
    └── abort() → AbortController 中断
```

## 条件分支算法

传播式跳过: 从 null 端口出发 BFS，每个候选节点检查所有入边是否都来自 null 分支或已跳过节点。
汇聚节点安全: 若节点有任意入边来自非 null 源，则不跳过。

## 循环迭代算法

1. executeLoop() 准备 items 数组 (forEach 分割文本 / repeat 生成索引)
2. findBodyNodes() BFS 从 item-out/index-out 可达的节点集合
3. 主循环标记 body 节点为 skipped，由 executeLoopBody() 独立驱动
4. 每次迭代: 更新 item-out/index-out → 按拓扑序执行 body（支持 body 内 conditional/loop）→ 收集终端输出
5. results-out = 所有迭代的聚合结果

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
