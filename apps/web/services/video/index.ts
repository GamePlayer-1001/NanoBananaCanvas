/**
 * [INPUT]: 依赖 ./kling
 * [OUTPUT]: 对外提供 KlingClient + 类型
 * [POS]: services/video 的桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export { KlingClient } from './kling'
export type {
  KlingConfig,
  KlingTextToVideoParams,
  KlingImageToVideoParams,
  KlingTaskResult,
} from './kling'
