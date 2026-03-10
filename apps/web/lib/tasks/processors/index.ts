/**
 * [INPUT]: 依赖 ./registry, ./types
 * [OUTPUT]: 对外提供 getProcessor + Processor 类型
 * [POS]: lib/tasks/processors 的桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export { getProcessor } from './registry'
export type {
  CheckResult,
  SubmitInput,
  SubmitResult,
  TaskOutput,
  TaskProcessor,
} from './types'
