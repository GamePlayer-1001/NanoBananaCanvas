# cron/
> L2 | 父级: apps/worker/CLAUDE.md

Cloudflare Worker Cron 定时任务 — 每 10 分钟执行一次 (`*/10 * * * *`)

## 成员清单

- `cleanup.ts`: 清理过期 AI 输出文件，并额外修剪超过 14 天的终态 `async_tasks` 冷数据，避免 D1 长期堆积历史任务
- `timeout.ts`: 标记 legacy queue 超时异步任务为 failed，按 `TASK_CONFIG.timeoutMs` 判定，并为平台模式退回冻结 credits；Workflow 主编排任务不再由 Cron 误杀

## 架构

- 两个 handler 完全独立，任一失败不影响其他
- 由 `src/index.ts` 的 `scheduled` 事件统一调度
- 依赖 `@nano-banana/shared` 的任务配置常量，不依赖 `apps/web` 的任何模块

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
