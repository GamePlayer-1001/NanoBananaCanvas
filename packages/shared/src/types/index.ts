/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供前后端共享的类型定义
 * [POS]: packages/shared/types 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 套餐类型 */
export type PlanType = 'free' | 'standard' | 'pro' | 'ultimate'

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

/** AI 模型分类 */
export type ModelCategory = 'text' | 'image' | 'video' | 'audio'

/** 积分交易类型 */
export type CreditTransactionType = 'earn' | 'spend' | 'refund'

/** 积分来源 */
export type CreditSource = 'subscription' | 'topup' | 'bonus' | 'ai_call' | 'refund'
