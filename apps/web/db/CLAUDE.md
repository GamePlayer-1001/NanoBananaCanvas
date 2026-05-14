# apps/web/db/

> L2 | 父级: apps/web/CLAUDE.md

D1 数据库 Schema 与种子数据

## 成员清单

```
schema.sql               — D1 完整 Schema (基础内容表 + Stripe 账本/订阅/积分包 + ai_models + user_api_keys + ai_usage_logs + async_tasks + execution_history + agent_audit_logs + video_analysis_history + published_outputs 社区作品实体)
migration-async-tasks.sql — P2 异步任务表独立迁移脚本 (async_tasks + 4 索引)
migration-008-media-runtime.sql — 媒体运行时对齐迁移 (Kling 视频模型 + OpenAI TTS 定价)
migration-009-user-account-profile.sql — users 账户资料扩展迁移 (username/first_name/last_name/membership_status)
migration-010-category-i18n.sql — categories 多语言迁移 (新增 name_i18n + 用历史 name_en/name_zh 回填 JSON)
migration-011-billing-rebuild.sql — Stripe 商业化重建迁移 (credit_balances / credit_transactions / subscriptions / model_pricing / credit_packages / processed_stripe_events / billing_orders)
migration-012-billing-metering.sql — usage 计量补列迁移 (ai_usage_logs.billable_units / estimated_credits)
migration-013-daily-signin-credits.sql — 签到试用积分迁移 (credit_balances.trial_balance / trial_expires_at + daily_signins)
migration-013-video-analysis-history.sql — 视频分析历史迁移 (user 级分析记录 + 状态 + 结果 JSON)
migration-014-agent-audit.sql — Agent 共创审计迁移 (用户原话 / plan / alternatives / 结果 / replay snapshot 持久化)
migration-015-model-pricing-credits-per-1k-units.sql — model_pricing 历史兼容迁移 (为旧生产库补齐 credits_per_1k_units，并用 credits_per_call 回填)
migration-016-credit-transactions-trial-pool.sql — credit_transactions 约束兼容迁移 (把历史生产库的 pool 检查条件从 monthly/permanent 升级为 trial/monthly/permanent)
migration-017-user-timezone.sql — users 时区迁移 (新增 timezone，用于按账号本地日界线判定签到状态)
migration-018-agent-audit-r2.sql — Agent 审计瘦身迁移 (新增 R2 指针/摘要/存在性索引列，把大 JSON 从 D1 正文降为对象存储正文)
migration-019-standard-trial-guard.sql — Standard 30 天试用防重复迁移 (users.standard_trial_used_at 账号级锁)
migration-020-published-outputs.sql — 社区生成作品迁移 (published_outputs + likes/favorites/reports 独立互动表)
migration-021-explore-import-compat.sql — Explore 作品兼容迁移 (published_outputs 从 task-only 升级为 task/import 双来源兼容，并重建 likes/favorites/reports 外键到新作品实体)
migration-022-billing-production-compat.sql — 生产账单兼容迁移 (为旧生产库补齐 users.standard_trial_used_at、subscriptions.purchase_mode、subscriptions.storage_gb)
migration-023-published-outputs-category.sql — Explore 作品分类真相源迁移 (为 published_outputs 增加 category_id，并用关联工作流分类回填历史公开作品)
migration-024-explore-import-use-case-categories.sql — Explore 导入图库分类迁移 (为 Excel/外部图库导入补齐 Design/Photography/Concept Art/UI-UX/Illustration/Marketing/Product 七类可筛选分类)
seed.sql                 — 分类种子数据 (8 个 AI 工作流分类，name_i18n JSON 真相源 + 历史兼容列)
seed-models.sql          — 模型目录种子 (23 模型: 13 text + 6 image + 2 video + 2 audio，覆盖 openrouter/deepseek/gemini/openai/kling 的平台目录)
seed-pricing.sql         — 商业化种子数据 (4 个积分包 + token 计费版 model_pricing)
```

## 设计决策

- Raw D1 SQL (不用 Drizzle/Prisma)：D1 是 SQLite，直接 prepare/bind 最透明
- 反范式 like_count/clone_count：避免广场列表 COUNT JOIN
- 复合主键 likes/favorites：天然去重
- 当前匿名模式复用 `users.clerk_id` 作为历史身份列：先稳定运行，再做数据库迁移
- Stripe 账本采用“双池余额 + 订单审计 + Webhook 幂等”最小闭环：先把表结构立稳，再接 Checkout / Portal / Webhook

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
