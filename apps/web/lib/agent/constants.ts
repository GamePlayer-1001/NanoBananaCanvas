/**
 * [INPUT]: 无运行时外部依赖，仅依赖 Agent 计划链路的设计约束
 * [OUTPUT]: 对外提供 Agent 常量、批量改动阈值、过程消息 key 与配置压缩白名单
 * [POS]: lib/agent 的常量真相源，被摘要器、校验器、会话 hook 与 API planner 共享
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const AGENT_ALLOWED_OPERATIONS = [
  'add_node',
  'update_node_data',
  'insert_between',
  'replace_node',
  'duplicate_node_branch',
  'batch_update_node_data',
  'relabel_node',
  'annotate_change',
  'remove_node',
  'connect',
  'disconnect',
  'focus_nodes',
  'request_prompt_confirmation',
  'run_workflow',
] as const

export const AGENT_MAX_AUTO_OPERATIONS = 4
export const AGENT_MAX_BRANCH_DUPLICATION_COUNT = 4
export const AGENT_MAX_BATCH_UPDATE_NODE_COUNT = 6
export const AGENT_MAX_SUMMARY_NODES = 12
export const AGENT_MAX_SUMMARY_TEXT_LENGTH = 160
export const AGENT_MAX_CONFIG_KEYS = 8
export const AGENT_MAX_TIMELINE_ENTRIES = 6
export const AGENT_MAX_CLUSTERS = 4
export const AGENT_MAX_SUBCHAINS = 4

export const AGENT_INCREMENTAL_INTENTS = [
  'add_step',
  'split_step',
  'replace_model',
  'change_output_count',
  'add_branch',
] as const

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

export const AGENT_PROCESS_MESSAGE_KEYS = {
  understanding: 'processUnderstanding',
  summarizing: 'processSummarizing',
  planning: 'processPlanning',
  validating: 'processValidating',
  diagnosing: 'processDiagnosing',
  explaining: 'processExplaining',
  applying: 'processApplying',
  promptConfirmed: 'processPromptConfirmed',
  regenerateDefault: 'processRegenerateDefault',
  regenerateStyle: 'processRegenerateStyle',
} as const

export const AGENT_ERROR_FALLBACK_KEY = 'errorFallback'
