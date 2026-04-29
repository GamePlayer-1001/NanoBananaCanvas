/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供前后端共享的类型定义 (含 P2 AsyncTask / TaskOrchestrator 类型)
 * [POS]: packages/shared/types 的入口桶文件
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/** 任务状态 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

/** AI 模型分类 */
export type ModelCategory = 'text' | 'image' | 'video' | 'audio'

/* ─── P2: Async Task Queue ──────────────────────────── */

/** 异步任务类型 */
export type AsyncTaskType = 'video_gen' | 'image_gen' | 'audio_gen'

/** 异步任务状态 (Method C: D1-as-Queue, 5 态状态机) */
export type AsyncTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/** AI 执行模式 */
export type ExecutionMode = 'platform' | 'user_key'

/** 长任务编排器 */
export type TaskOrchestrator = 'legacy_queue' | 'workflow'

/** Queue 中传递的最小任务消息 */
export interface TaskQueueMessage {
  taskId: string
  userId: string
}
