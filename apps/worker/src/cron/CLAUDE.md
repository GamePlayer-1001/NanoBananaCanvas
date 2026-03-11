# cron/
> L2 | 父级: apps/worker/CLAUDE.md

Cloudflare Worker Cron 定时任务 — 每 10 分钟执行一次 (`*/10 * * * *`)

## 成员清单

- `unfreeze.ts`: 批量解冻超时冻结积分，扫描 `credit_transactions` 中超过 `FREEZE_TTL_MINUTES` 的 freeze 记录
- `cleanup.ts`: 清理过期 AI 输出文件，按 plan 保留期过滤 (free=7d, pro=90d)，删除 R2 对象
- `timeout.ts`: 标记超时异步任务为 failed，按 `TASK_CONFIG.timeoutMs` 判定，退还冻结积分

## 架构

- 三个 handler 完全独立，任一失败不影响其他
- 由 `src/index.ts` 的 `scheduled` 事件统一调度
- 依赖 `@nano-banana/shared` 的常量和工具函数，不依赖 `apps/web` 的任何模块

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
