# task-runtime/
> L2 | 父级: apps/worker/src/CLAUDE.md

成员清单
process-dispatch.ts: Queue/Workflow 共用的任务分发执行桥，负责创建 Worker runtime 并调用共享 `processTaskDispatch`；现补充 Worker 绑定缺失、provider→env 映射缺失、任务开始/完成的结构化日志，并显式为 `comfly/dlapi` 平台供应商提供 Worker 侧 API key 读取，避免后台回退到 Web 的 `getCloudflareContext()`

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
