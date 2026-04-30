/**
 * [INPUT]: 无运行时外部依赖，仅依赖 Agent 计划链路的设计约束
 * [OUTPUT]: 对外提供 Agent 常量、批量改动阈值、默认过程文案与配置压缩白名单
 * [POS]: lib/agent 的常量真相源，被摘要器、校验器、会话 hook 与 API planner 共享
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const AGENT_ALLOWED_OPERATIONS = [
  'add_node',
  'update_node_data',
  'remove_node',
  'connect',
  'disconnect',
  'focus_nodes',
  'request_prompt_confirmation',
  'run_workflow',
] as const

export const AGENT_MAX_AUTO_OPERATIONS = 4
export const AGENT_MAX_SUMMARY_NODES = 12
export const AGENT_MAX_SUMMARY_TEXT_LENGTH = 160
export const AGENT_MAX_CONFIG_KEYS = 8

export const AGENT_CONFIG_SUMMARY_KEYS = [
  'text',
  'prompt',
  'negativePrompt',
  'platformProvider',
  'platformModel',
  'size',
  'aspectRatio',
  'mode',
  'voice',
  'duration',
  'operator',
  'compareValue',
  'separator',
  'showPreview',
  'imageUrl',
  'userKeyConfigId',
  'executionMode',
  'bgColor',
  'iterations',
  'label',
] as const

export const AGENT_PROCESS_MESSAGES = {
  understanding: '我先理解一下你的目标。',
  summarizing: '我正在整理左侧画板的当前结构。',
  planning: '我正在生成一个可检查的结构化提案。',
  validating: '我会先做一次本地安全校验，再展示给你。',
} as const

export const AGENT_ERROR_FALLBACK =
  '这次提案没有成功生成，我已经停在右侧，没有修改左侧画板。'

