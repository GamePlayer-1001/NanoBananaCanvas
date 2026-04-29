/**
 * [INPUT]: 依赖 @nano-banana/shared 的 TaskQueueMessage，依赖 ../task-runtime/process-dispatch 的 executeDispatchedTask/WorkerTaskBindings
 * [OUTPUT]: 对外提供 handleTaskQueueMessage，把 Cloudflare Queue 消息接到统一任务分发执行桥
 * [POS]: worker/queue 的队列消费者适配层，只负责消费消息，不再承载共享执行 runtime
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { TaskQueueMessage } from '@nano-banana/shared'

import {
  executeDispatchedTask,
  type WorkerTaskBindings,
} from '../task-runtime/process-dispatch'

export async function handleTaskQueueMessage(
  env: WorkerTaskBindings,
  message: TaskQueueMessage,
): Promise<void> {
  await executeDispatchedTask(env, message)
}
