/**
 * [INPUT]: 依赖 ./engine, ./crypto, ./pricing
 * [OUTPUT]: 对外提供积分系统全部公共 API
 * [POS]: lib/credits 的聚合导出入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export {
  getBalance,
  freezeCredits,
  confirmSpend,
  refundCredits,
  addCredits,
  resetMonthlyCredits,
  type CreditBalance,
} from './engine'

export { encryptApiKey, decryptApiKey, maskApiKey } from './crypto'
