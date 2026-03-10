/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 AppError 及其子类 (NetworkError/ValidationError/AuthError/AIServiceError/WorkflowError/CreditFreezeError/TaskError) + UPLOAD_*/TASK_* 错误码
 * [POS]: lib 的统一错误类型体系，被所有业务模块消费，是错误处理的唯一真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Error Codes ─────────────────────────────────────── */

export const ErrorCode = {
  // 网络层
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  API_ERROR: 'API_ERROR',

  // 认证层
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // 验证层
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  VALIDATION_SCHEMA: 'VALIDATION_SCHEMA',

  // AI 服务层
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
  AI_MODEL_UNAVAILABLE: 'AI_MODEL_UNAVAILABLE',

  // 积分层
  CREDITS_INSUFFICIENT: 'CREDITS_INSUFFICIENT',
  CREDITS_FROZEN_FAILED: 'CREDITS_FROZEN_FAILED',

  // 工作流层
  WORKFLOW_INVALID: 'WORKFLOW_INVALID',
  WORKFLOW_CYCLE_DETECTED: 'WORKFLOW_CYCLE_DETECTED',
  WORKFLOW_EXECUTION_FAILED: 'WORKFLOW_EXECUTION_FAILED',
  WORKFLOW_NODE_ERROR: 'WORKFLOW_NODE_ERROR',
  WORKFLOW_ABORTED: 'WORKFLOW_ABORTED',

  // 上传层
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',

  // 异步任务层 (P2)
  TASK_CONCURRENCY_EXCEEDED: 'TASK_CONCURRENCY_EXCEEDED',
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_PROVIDER_ERROR: 'TASK_PROVIDER_ERROR',
  TASK_TIMEOUT: 'TASK_TIMEOUT',
  TASK_ALREADY_TERMINAL: 'TASK_ALREADY_TERMINAL',

  // 资源层
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // 通用
  UNKNOWN: 'UNKNOWN',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

/* ─── Base Error ──────────────────────────────────────── */

export class AppError extends Error {
  readonly code: ErrorCode
  readonly meta: Record<string, unknown>
  readonly timestamp: number

  constructor(code: ErrorCode, message: string, meta: Record<string, unknown> = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.meta = meta
    this.timestamp = Date.now()
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      meta: this.meta,
      timestamp: this.timestamp,
    }
  }
}

/* ─── Specialized Errors ─────────────────────────────── */

export class NetworkError extends AppError {
  constructor(message: string, meta: Record<string, unknown> = {}) {
    super(ErrorCode.API_ERROR, message, meta)
    this.name = 'NetworkError'
  }
}

export class AuthError extends AppError {
  constructor(
    code: Extract<
      ErrorCode,
      'AUTH_UNAUTHORIZED' | 'AUTH_FORBIDDEN' | 'AUTH_SESSION_EXPIRED'
    >,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    super(code, message, meta)
    this.name = 'AuthError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, meta: Record<string, unknown> = {}) {
    super(ErrorCode.VALIDATION_FAILED, message, meta)
    this.name = 'ValidationError'
  }
}

export class AIServiceError extends AppError {
  constructor(
    code: Extract<
      ErrorCode,
      | 'AI_PROVIDER_ERROR'
      | 'AI_RATE_LIMITED'
      | 'AI_QUOTA_EXCEEDED'
      | 'AI_MODEL_UNAVAILABLE'
    >,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    super(code, message, meta)
    this.name = 'AIServiceError'
  }
}

export class InsufficientCreditsError extends AppError {
  constructor(meta: Record<string, unknown> = {}) {
    super(ErrorCode.CREDITS_INSUFFICIENT, 'Insufficient credits', meta)
    this.name = 'InsufficientCreditsError'
  }
}

export class CreditFreezeError extends AppError {
  constructor(meta: Record<string, unknown> = {}) {
    super(ErrorCode.CREDITS_FROZEN_FAILED, 'Failed to freeze credits', meta)
    this.name = 'CreditFreezeError'
  }
}

export class WorkflowError extends AppError {
  constructor(
    code: Extract<
      ErrorCode,
      | 'WORKFLOW_INVALID'
      | 'WORKFLOW_CYCLE_DETECTED'
      | 'WORKFLOW_EXECUTION_FAILED'
      | 'WORKFLOW_NODE_ERROR'
      | 'WORKFLOW_ABORTED'
    >,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    super(code, message, meta)
    this.name = 'WorkflowError'
  }
}

export class TaskError extends AppError {
  constructor(
    code: Extract<
      ErrorCode,
      | 'TASK_CONCURRENCY_EXCEEDED'
      | 'TASK_NOT_FOUND'
      | 'TASK_PROVIDER_ERROR'
      | 'TASK_TIMEOUT'
      | 'TASK_ALREADY_TERMINAL'
    >,
    message: string,
    meta: Record<string, unknown> = {},
  ) {
    super(code, message, meta)
    this.name = 'TaskError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(ErrorCode.NOT_FOUND, `${resource} not found: ${id}`, { resource, id })
    this.name = 'NotFoundError'
  }
}

/* ─── Guard ───────────────────────────────────────────── */

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}
