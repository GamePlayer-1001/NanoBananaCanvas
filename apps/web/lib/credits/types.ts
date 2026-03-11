/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 CreditBalance 接口、Pool 类型、FREEZE_TTL_MINUTES 常量
 * [POS]: lib/credits 的共享类型定义，被 query/freeze/topup 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Types ──────────────────────────────────────────── */

export interface CreditBalance {
  userId: string
  monthlyBalance: number
  permanentBalance: number
  frozen: number
  totalEarned: number
  totalSpent: number
}

export type Pool = 'monthly' | 'permanent'

/* ─── Re-export from shared ────────────────────────── */

export { FREEZE_TTL_MINUTES } from '@nano-banana/shared'
