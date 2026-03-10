/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 AIProvider 接口 + ChatMessage/ChatParams/ChatResult 等核心类型
 * [POS]: services/ai 的类型基石，被所有 Provider 实现和执行引擎消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Message ────────────────────────────────────────── */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/* ─── Request ────────────────────────────────────────── */

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

/* ─── Response ───────────────────────────────────────── */

export interface ChatResponse {
  id: string
  choices: {
    message: ChatMessage
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/* ─── Streaming ──────────────────────────────────────── */

export interface StreamChunk {
  choices: {
    delta: { content?: string }
    finish_reason?: string | null
  }[]
}

/* ─── Chat Result ──────────────────────────────────────── */

export interface ChatResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/* ─── Chat Params (internal convenience) ─────────────── */

export interface ChatParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  apiKey: string
  signal?: AbortSignal
}

export interface ChatStreamParams extends ChatParams {
  onChunk: (text: string) => void
}

/* ─── AI Provider Interface ──────────────────────────── */

/** 所有 AI Provider 的统一契约 */
export interface AIProvider {
  /** Provider 唯一标识 (openrouter / deepseek / gemini) */
  readonly id: string
  /** 显示名称 */
  readonly name: string

  /** 单次对话 */
  chat(params: ChatParams): Promise<ChatResult>
  /** 流式对话 */
  chatStream(params: ChatStreamParams): Promise<string>
  /** 验证 API Key 有效性 */
  validateKey(apiKey: string): Promise<boolean>
}

/* ─── Model Definition (前端静态) ────────────────────── */

export interface ModelOption {
  /** 模型 ID (发送给 Provider 的标识) */
  value: string
  /** 显示名称 */
  label: string
}

export interface ModelGroup {
  /** Provider 标识 */
  provider: string
  /** Provider 显示名 */
  providerName: string
  /** 该 Provider 下可用的模型列表 */
  models: ModelOption[]
}
