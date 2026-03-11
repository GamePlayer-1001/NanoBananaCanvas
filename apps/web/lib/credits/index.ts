/**
 * [INPUT]: 依赖 ./types, ./query, ./freeze, ./topup, ./crypto, ./pricing
 * [OUTPUT]: 对外提供积分系统全部公共 API
 * [POS]: lib/credits 的聚合导出入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export { type CreditBalance, type Pool } from './types'

export { getBalance, unfreezeStaleCredits } from './query'

export { freezeCredits, confirmSpend, refundCredits } from './freeze'

export { addCredits, resetMonthlyCredits } from './topup'

export { encryptApiKey, decryptApiKey, maskApiKey } from './crypto'

export { getModelPricing, checkModelAccess, type ModelPricing } from './pricing'
