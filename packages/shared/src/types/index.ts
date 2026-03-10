/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供前后端共享的类型定义 (含 P2 AsyncTask 类型)
 * [POS]: packages/shared/types 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 套餐类型 */
export type PlanType = 'free' | 'pro'

/** 计费周期 */
export type BillingPeriod = 'weekly' | 'monthly' | 'yearly'

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

/** AI 模型分类 */
export type ModelCategory = 'text' | 'image' | 'video' | 'audio'

/** 积分交易类型 (含冻结/解冻，与 D1 schema CHECK 一致) */
export type CreditTransactionType = 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'refund'

/** 积分来源 */
export type CreditSource = 'subscription' | 'bonus' | 'ai_call' | 'refund'

/* ─── P2: Async Task Queue ──────────────────────────── */

/** 异步任务类型 */
export type AsyncTaskType = 'video_gen' | 'image_gen' | 'audio_gen'

/** 异步任务状态 (Method C: D1-as-Queue, 5 态状态机) */
export type AsyncTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/** AI 执行模式 */
export type ExecutionMode = 'credits' | 'user_key'
