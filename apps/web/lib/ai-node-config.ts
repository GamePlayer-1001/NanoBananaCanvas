/**
 * [INPUT]: 依赖 @/types 的 WorkflowNodeData，依赖工作流节点 config 的 executionMode/platformProvider/platformModel/userKeyConfigId
 * [OUTPUT]: 对外提供 AI 节点能力映射、平台配置解析、执行请求解析工具
 * [POS]: lib 的 AI 节点配置语义层，被节点组件与执行器共享，用来隔离平台 provider 与用户能力类型
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { WorkflowNodeData } from '@/types'

export type NodeExecutionMode = 'platform' | 'user_key'
export type NodeCapability = 'text' | 'image' | 'video' | 'audio'
export type SupportedAINodeType = 'llm' | 'image-gen' | 'video-gen' | 'audio-gen'

interface PlatformDefaults {
  provider: string
  model: string
}

interface NodeExecutionTarget {
  executionMode: NodeExecutionMode
  capability: NodeCapability
  provider?: string
  modelId?: string
  configId?: string
  platformProvider: string
  platformModel: string
}

const NODE_CAPABILITY_MAP: Record<SupportedAINodeType, NodeCapability> = {
  llm: 'text',
  'image-gen': 'image',
  'video-gen': 'video',
  'audio-gen': 'audio',
}

const NODE_PLATFORM_DEFAULTS: Record<SupportedAINodeType, PlatformDefaults> = {
  llm: { provider: 'openrouter', model: 'openai/gpt-4o-mini' },
  'image-gen': { provider: 'openrouter', model: 'openai/dall-e-3' },
  'video-gen': { provider: 'kling', model: 'kling-v2-0' },
  'audio-gen': { provider: 'openai', model: 'tts-1' },
}

function isCapability(value: unknown): value is NodeCapability {
  return value === 'text' || value === 'image' || value === 'video' || value === 'audio'
}

function readConfigString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

export function getNodeCapability(nodeType: SupportedAINodeType): NodeCapability {
  return NODE_CAPABILITY_MAP[nodeType]
}

export function getNodeExecutionMode(config: Record<string, unknown>): NodeExecutionMode {
  return config.executionMode === 'user_key' ? 'user_key' : 'platform'
}

export function resolvePlatformProvider(
  nodeType: SupportedAINodeType,
  config: Record<string, unknown>,
): string {
  const platformProvider = readConfigString(config, 'platformProvider')
  if (platformProvider) return platformProvider

  const legacyProvider = readConfigString(config, 'provider')
  if (legacyProvider && !isCapability(legacyProvider)) {
    return legacyProvider
  }

  return NODE_PLATFORM_DEFAULTS[nodeType].provider
}

export function resolvePlatformModel(
  nodeType: SupportedAINodeType,
  config: Record<string, unknown>,
): string {
  return (
    readConfigString(config, 'platformModel') ??
    readConfigString(config, 'model') ??
    NODE_PLATFORM_DEFAULTS[nodeType].model
  )
}

export function resolveUserConfigId(config: Record<string, unknown>): string | undefined {
  return readConfigString(config, 'userKeyConfigId')
}

export function resolveAvailableUserConfigId(
  config: Record<string, unknown>,
  availableConfigIds: readonly string[],
): string | undefined {
  const configured = resolveUserConfigId(config)
  if (configured && availableConfigIds.includes(configured)) {
    return configured
  }

  return availableConfigIds[0]
}

export function resolveNodeExecutionTarget(
  nodeType: SupportedAINodeType,
  config: Record<string, unknown>,
): NodeExecutionTarget {
  const executionMode = getNodeExecutionMode(config)
  const capability = getNodeCapability(nodeType)
  const platformProvider = resolvePlatformProvider(nodeType, config)
  const platformModel = resolvePlatformModel(nodeType, config)
  const configId = resolveUserConfigId(config)

  if (executionMode === 'platform') {
    return {
      executionMode,
      capability,
      provider: platformProvider,
      modelId: platformModel,
      platformProvider,
      platformModel,
    }
  }

  return {
    executionMode,
    capability,
    configId,
    platformProvider,
    platformModel,
  }
}

export function getNodeConfigMigrationPatch(
  nodeType: SupportedAINodeType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  const platformProvider = resolvePlatformProvider(nodeType, config)
  const platformModel = resolvePlatformModel(nodeType, config)

  if (config.platformProvider !== platformProvider) {
    patch.platformProvider = platformProvider
  }

  if (config.platformModel !== platformModel) {
    patch.platformModel = platformModel
  }

  return patch
}

export function getWorkflowNodeConfig(node: WorkflowNodeData): Record<string, unknown> {
  return node.config
}
