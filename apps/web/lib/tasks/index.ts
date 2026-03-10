/**
 * [INPUT]: 依赖 ./service, ./processors
 * [OUTPUT]: 对外提供 task service 全部公共 API + processor 类型
 * [POS]: lib/tasks 的桶文件入口
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export {
  checkConcurrency,
  submitTask,
  checkTask,
  cancelTask,
  listTasks,
} from './service'

export type {
  SubmitTaskParams,
  TaskDetail,
  ListTasksResult,
} from './service'

export { getProcessor } from './processors'

export type {
  TaskProcessor,
  SubmitInput,
  SubmitResult,
  CheckResult,
  TaskOutput,
} from './processors'
