# apps/web/db/

> L2 | 父级: apps/web/CLAUDE.md

D1 数据库 Schema 与种子数据

## 成员清单

```
schema.sql               — D1 完整 Schema (9 表 + 索引: 基础内容表 + ai_models + user_api_keys + ai_usage_logs + async_tasks + execution_history)
migration-async-tasks.sql — P2 异步任务表独立迁移脚本 (async_tasks + 4 索引)
seed.sql         — 分类种子数据 (8 个 AI 工作流分类，双语 name_en/name_zh)
seed-models.sql — 模型目录种子 (18 模型: 9 text + 4 image + 2 video + 2 audio，统一免费目录)
migration-008-media-runtime.sql — 媒体运行时对齐迁移 (Kling 视频模型 + OpenAI TTS 定价)
```

## 设计决策

- Raw D1 SQL (不用 Drizzle/Prisma)：D1 是 SQLite，直接 prepare/bind 最透明
- 反范式 like_count/clone_count：避免广场列表 COUNT JOIN
- 复合主键 likes/favorites：天然去重
- 当前匿名模式复用 `users.clerk_id` 作为历史身份列：先稳定运行，再做数据库迁移
- 已移除 `credit_balances / credit_transactions / subscriptions / processed_stripe_events`：运行时已不再消费

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
