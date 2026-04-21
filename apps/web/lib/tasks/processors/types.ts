/**
 * [INPUT]: 依赖 @nano-banana/shared 的 AsyncTaskType, AsyncTaskStatus
 * [OUTPUT]: 对外提供 TaskProcessor 接口 + SubmitInput/SubmitResult/CheckResult/TaskOutput 类型
 * [POS]: lib/tasks/processors 的类型基石，定义所有 Provider 处理器的统一契约
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { AsyncTaskType } from '@nano-banana/shared'

/* ─── Submit ────────────────────────────────────────── */

export interface SubmitInput {
  /** Provider 内部模型标识 */
  model: string
  /** Provider 特定参数 (各处理器自行解析) */
  params: Record<string, unknown>
}

export interface SubmitResult {
  /** Provider 返回的外部任务 ID */
  externalTaskId: string
  /** 初始状态 — 有些 Provider 直接开始执行 */
  initialStatus: 'pending' | 'running'
}

/* ─── Check ─────────────────────────────────────────── */

export interface CheckResult {
  /** Provider 当前状态 */
  status: 'pending' | 'running' | 'completed' | 'failed'
  /** 进度百分比 0-100 */
  progress: number
  /** 完成时的输出结果 */
  result?: TaskOutput
  /** 失败时的错误信息 */
  error?: string
}

export interface TaskOutput {
  /** 结果类型 */
  type: 'url' | 'json'
  /** 外部 CDN URL (视频/图片/音频文件) */
  url?: string
  /** MIME 类型 */
  contentType?: string
  /** 落盘后的 R2 Key，供私有读取/清理使用 */
  r2_key?: string
  /** 原始文件名或推导后的文件名 */
  fileName?: string
  /** 结构化数据 (某些 Provider 返回 JSON) */
  data?: unknown
}

/* ─── Processor Interface ───────────────────────────── */

export interface TaskProcessor {
  /** 处理器对应的任务类型 */
  readonly taskType: AsyncTaskType
  /** Provider 标识 */
  readonly provider: string

  /** 提交任务到外部 Provider */
  submit(input: SubmitInput, apiKey: string): Promise<SubmitResult>

  /** 检查任务状态 (懒评估: 客户端 poll 时调用) */
  checkStatus(externalTaskId: string, apiKey: string): Promise<CheckResult>

  /** 取消任务 (best-effort, 并非所有 Provider 支持) */
  cancel(externalTaskId: string, apiKey: string): Promise<void>
}
