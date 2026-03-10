/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 ContentPart/MultiModalMessage 多模态消息类型
 * [POS]: types 的多模态基石，被 LLM 执行器和 Provider 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Content Parts ─────────────────────────────────── */

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

/* ─── Multi-Modal Message ───────────────────────────── */

export interface MultiModalMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ContentPart[]
}
