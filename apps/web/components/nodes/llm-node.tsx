/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/lib/platform-models 与静态平台目录，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 LLMNode 大语言模型节点组件
 * [POS]: components/nodes 的核心 AI 节点，被 registry 注册并在画布中渲染，统一消费 /api/ai/models 作为平台模型目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  Coins,
  KeyRound,
  Loader2,
} from 'lucide-react'

import { useModelConfigs } from '@/hooks/use-model-configs'
import {
  getNodeConfigMigrationPatch,
  resolveAvailableUserConfigId,
  resolvePlatformModel,
  resolvePlatformProvider,
  resolveUserConfigId,
} from '@/lib/ai-node-config'
import { getProviderLabel } from '@/lib/model-config-catalog'
import {
  AGENT_PLATFORM_MODEL_PRESETS,
  getAgentPlatformModelOptions,
} from '@/lib/platform-models'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { PlatformModelSelect } from '@/components/shared/platform-model-select'

import { BaseNode } from './base-node'

const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 1024

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

const INPUT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

export function LLMNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const config = data.config

  const platformProvider = resolvePlatformProvider('llm', config)
  const platformModel = resolvePlatformModel('llm', config)
  const temperature = (config.temperature as number) ?? DEFAULT_TEMPERATURE
  const maxTokens = (config.maxTokens as number) ?? DEFAULT_MAX_TOKENS
  const executionMode = (config.executionMode as string) ?? 'platform'
  const systemPrompt = (config.systemPrompt as string) ?? ''
  const output = (config.output as string) ?? ''
  const tokenCount = (config.tokenCount as number) ?? 0
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()

  const platformTextModels = useMemo(
    () =>
      AGENT_PLATFORM_MODEL_PRESETS.map((item, index) => ({
        id: `agent-text-${index + 1}`,
        provider: item.provider,
        modelId: item.modelId,
        modelName: item.modelName,
      })),
    [],
  )
  const platformModelOptions = useMemo(() => getAgentPlatformModelOptions(), [])
  const selectedPlatformEntry = useMemo(
    () =>
      platformTextModels.find(
        (item) => item.provider === platformProvider && item.modelId === platformModel,
      ) ??
      platformTextModels.find((item) => item.modelId === platformModel) ??
      platformTextModels[0],
    [platformModel, platformProvider, platformTextModels],
  )
  const selectedPlatformProvider =
    selectedPlatformEntry?.provider ?? platformProvider
  const selectedPlatformModel =
    selectedPlatformEntry?.modelId ?? platformModel

  const [showSystemPrompt, setShowSystemPrompt] = useState(!!systemPrompt)
  const outputRef = useRef<HTMLDivElement>(null)
  const savedTextConfigs = getConfigsByCapability('text')
  const selectedUserConfigId =
    resolveAvailableUserConfigId(
      config,
      savedTextConfigs.map((item) => item.configId),
    ) ?? ''
  const savedTextConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('text')
  const userKeyProviderLabel = getProviderLabel('text', savedTextConfig?.providerId)
  const userKeyModelLabel =
    savedTextConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...config, ...patch } })
    },
    [props.id, config, updateNodeData],
  )

  useEffect(() => {
    const patch = getNodeConfigMigrationPatch('llm', config)
    if (selectedPlatformProvider !== platformProvider) {
      patch.platformProvider = selectedPlatformProvider
    }
    if (selectedPlatformModel !== platformModel) {
      patch.platformModel = selectedPlatformModel
    }
    if (
      selectedUserConfigId &&
      executionMode === 'user_key' &&
      resolveUserConfigId(config) !== selectedUserConfigId
    ) {
      patch.userKeyConfigId = selectedUserConfigId
    }

    if (Object.keys(patch).length > 0) {
      updateConfig(patch)
    }
  }, [
    config,
    executionMode,
    platformModel,
    platformProvider,
    selectedPlatformModel,
    selectedPlatformProvider,
    selectedUserConfigId,
    updateConfig,
  ])

  const onModelChange = useCallback(
    (value: string) => {
      const nextModel = platformModelOptions.find(
        (item) => item.selectionValue === value,
      )
      updateConfig({
        platformProvider: nextModel?.provider ?? selectedPlatformProvider,
        platformModel: nextModel?.value ?? selectedPlatformModel,
      })
    },
    [platformModelOptions, selectedPlatformModel, selectedPlatformProvider, updateConfig],
  )

  const onTemperatureChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      updateConfig({ temperature: parseFloat(e.target.value) }),
    [updateConfig],
  )

  const onMaxTokensChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextValue = parseInt(e.target.value, 10)
      if (!Number.isNaN(nextValue)) {
        updateConfig({ maxTokens: Math.max(1, Math.min(128000, nextValue)) })
      }
    },
    [updateConfig],
  )

  const onSystemPromptChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) =>
      updateConfig({ systemPrompt: e.target.value }),
    [updateConfig],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<BrainCircuit size={14} />}
      minHeight={220}
      bodyClassName="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        {executionMode === 'user_key' ? (
          <ConfigField label={t('provider')}>
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {userKeyProviderLabel}
            </div>
          </ConfigField>
        ) : null}

        {executionMode === 'user_key' ? (
          <ConfigField label={t('accountConfigLabel')}>
            <select
              value={selectedUserConfigId}
              onChange={(e) => updateConfig({ userKeyConfigId: e.target.value })}
              className={SELECT_CLASS}
            >
              {savedTextConfigs.length === 0 ? (
                <option value="">{t('noApiConfigs')}</option>
              ) : (
                savedTextConfigs.map((item) => (
                  <option key={item.configId} value={item.configId}>
                    {item.label || item.configId}
                  </option>
                ))
              )}
            </select>
          </ConfigField>
        ) : null}

        <ConfigField label={t('model')}>
          {executionMode === 'user_key' ? (
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {userKeyModelLabel}
            </div>
          ) : (
            <PlatformModelSelect
              value={`${selectedPlatformProvider}:${selectedPlatformModel}`}
              options={platformModelOptions}
              onValueChange={onModelChange}
              triggerClassName={SELECT_CLASS}
            />
          )}
        </ConfigField>

        <ConfigField label={t('executionMode')}>
          <div className="nodrag flex gap-1">
            <ModeButton
              active={executionMode === 'platform'}
              onClick={() =>
                updateConfig({
                  executionMode: 'platform',
                  platformProvider: selectedPlatformProvider,
                  platformModel: selectedPlatformModel,
                })
              }
              icon={<Coins size={12} />}
              label={t('platformMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() =>
                updateConfig({
                  executionMode: 'user_key',
                  userKeyConfigId: selectedUserConfigId,
                })
              }
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
        </ConfigField>

        <ConfigField label={t('temperature', { value: temperature.toFixed(1) })}>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            onChange={onTemperatureChange}
            className="nodrag nowheel w-full accent-[var(--brand-500)]"
          />
          <div className="text-muted-foreground flex justify-between text-[10px]">
            <span>{t('precise')}</span>
            <span>{t('creative')}</span>
          </div>
        </ConfigField>

        <ConfigField label={t('maxTokens')}>
          <input
            type="number"
            min={1}
            max={128000}
            value={maxTokens}
            onChange={onMaxTokensChange}
            className={INPUT_CLASS}
          />
        </ConfigField>

        <div>
          <button
            type="button"
            onClick={() => setShowSystemPrompt((value) => !value)}
            className="nodrag text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
          >
            {showSystemPrompt ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {t('systemPrompt')}
          </button>

          {showSystemPrompt ? (
            <textarea
              value={systemPrompt}
              onChange={onSystemPromptChange}
              placeholder={t('systemPromptPlaceholder')}
              rows={3}
              className={`nodrag nowheel mt-1 resize-y ${INPUT_CLASS}`}
            />
          ) : null}
        </div>

        {status === 'running' || output ? (
          <div className="border-border flex min-h-0 flex-1 flex-col rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              <div className="flex items-center gap-1.5">
                {status === 'running' ? (
                  <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
                ) : null}
                {tokenCount > 0 ? (
                  <span className="text-muted-foreground text-[10px]">
                    {t('tokens', { count: tokenCount })}
                  </span>
                ) : null}
              </div>
            </div>

            <div
              ref={outputRef}
              className="min-h-[96px] flex-1 overflow-auto p-2 text-xs leading-relaxed whitespace-pre-wrap"
            >
              {output || (
                <span className="text-muted-foreground italic">{t('generating')}</span>
              )}
              {status === 'running' ? (
                <span className="bg-foreground ml-0.5 inline-block h-3 w-1 animate-pulse rounded-sm" />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </BaseNode>
  )
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-muted-foreground mb-1 block text-xs">{label}</label>
      {children}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors ${
        active
          ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/10 text-[var(--brand-500)]'
          : 'border-input text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
