# apps/web/db/

> L2 | 父级: apps/web/CLAUDE.md

D1 数据库 Schema 与种子数据

## 成员清单

```
schema.sql               — D1 完整 Schema (基础内容表 + Stripe 账本/订阅/积分包 + ai_models + user_api_keys + ai_usage_logs + async_tasks + execution_history + video_analysis_history)
migration-async-tasks.sql — P2 异步任务表独立迁移脚本 (async_tasks + 4 索引)
migration-008-media-runtime.sql — 媒体运行时对齐迁移 (Kling 视频模型 + OpenAI TTS 定价)
migration-009-user-account-profile.sql — users 账户资料扩展迁移 (username/first_name/last_name/membership_status)
migration-010-category-i18n.sql — categories 多语言迁移 (新增 name_i18n + 用历史 name_en/name_zh 回填 JSON)
migration-011-billing-rebuild.sql — Stripe 商业化重建迁移 (credit_balances / credit_transactions / subscriptions / model_pricing / credit_packages / processed_stripe_events / billing_orders)
migration-012-billing-metering.sql — usage 计量补列迁移 (ai_usage_logs.billable_units / estimated_credits)
migration-013-video-analysis-history.sql — 视频分析历史迁移 (user 级分析记录 + 状态 + 结果 JSON)
seed.sql                 — 分类种子数据 (8 个 AI 工作流分类，name_i18n JSON 真相源 + 历史兼容列)
seed-models.sql          — 模型目录种子 (18 模型: 9 text + 4 image + 2 video + 2 audio，统一免费目录)
seed-pricing.sql         — 商业化种子数据 (4 个积分包 + token 计费版 model_pricing)
```

## 设计决策

- Raw D1 SQL (不用 Drizzle/Prisma)：D1 是 SQLite，直接 prepare/bind 最透明
- 反范式 like_count/clone_count：避免广场列表 COUNT JOIN
- 复合主键 likes/favorites：天然去重
- 当前匿名模式复用 `users.clerk_id` 作为历史身份列：先稳定运行，再做数据库迁移
- Stripe 账本采用“双池余额 + 订单审计 + Webhook 幂等”最小闭环：先把表结构立稳，再接 Checkout / Portal / Webhook

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
