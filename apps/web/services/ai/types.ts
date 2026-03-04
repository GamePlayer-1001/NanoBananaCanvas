/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 ChatMessage/ChatRequest/ChatResponse/StreamChunk 类型
 * [POS]: services/ai 的类型基石，被 openrouter.ts 和 LLMNode 消费
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

/* ─── Chat Params (internal convenience) ─────────────── */

export interface ChatParams {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  apiKey: string
}

export interface ChatStreamParams extends ChatParams {
  onChunk: (text: string) => void
}
