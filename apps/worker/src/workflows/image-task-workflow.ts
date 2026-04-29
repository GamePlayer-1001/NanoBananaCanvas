/**
 * [INPUT]: 依赖 cloudflare:workers 的 WorkflowEntrypoint/WorkflowEvent/WorkflowStep，依赖 ../queue/process-task 的 createWorkerTaskRuntime/WorkerTaskBindings，依赖 ../../../web/lib/tasks 的 processQueuedTask
 * [OUTPUT]: 对外提供 ImageTaskWorkflow 工作流类，负责把 image_gen 长任务实例编排到 Cloudflare Workflows
 * [POS]: worker/workflows 的图片任务编排入口，作为 Queue/Cron 之外的新主调度中枢，当前先复用共享任务执行内核
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from 'cloudflare:workers'

import { processQueuedTask } from '../../../web/lib/tasks'

import {
  createWorkerTaskRuntime,
  type WorkerTaskBindings,
} from '../queue/process-task'

interface ImageTaskWorkflowParams {
  taskId: string
  userId: string
}

/* ─── Image Task Workflow ───────────────────────────── */

export class ImageTaskWorkflow extends WorkflowEntrypoint<
  WorkerTaskBindings,
  ImageTaskWorkflowParams
> {
  async run(
    event: WorkflowEvent<ImageTaskWorkflowParams>,
    step: WorkflowStep,
  ): Promise<{ taskId: string; userId: string; status: 'processed' }> {
    const { taskId, userId } = event.payload

    await step.do('process image task', async () => {
      await processQueuedTask(
        this.env.DB,
        { taskId, userId },
        createWorkerTaskRuntime(this.env),
      )

      return { taskId, userId }
    })

    return {
      taskId,
      userId,
      status: 'processed',
    }
  }
}
