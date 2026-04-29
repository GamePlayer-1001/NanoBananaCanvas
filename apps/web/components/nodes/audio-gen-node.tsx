/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/hooks/use-ai-models，依赖 @/lib/platform-models，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 AudioGenNode 音频生成节点组件
 * [POS]: components/nodes 的 TTS 节点，被 registry 注册并在画布中渲染，统一消费 /api/ai/models 作为平台模型目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, KeyRound, Loader2, Music } from 'lucide-react'
import { useAIModels } from '@/hooks/use-ai-models'
import { useModelConfigs } from '@/hooks/use-model-configs'
import { useUserKeyOnboarding } from '@/hooks/use-user-key-onboarding'
import {
  getNodeConfigMigrationPatch,
  resolveAvailableUserConfigId,
  resolvePlatformModel,
  resolvePlatformProvider,
  resolveUserConfigId,
} from '@/lib/ai-node-config'
import { getProviderLabel } from '@/lib/model-config-catalog'
import {
  groupPlatformModelsByProvider,
  resolvePlatformModelSelection,
} from '@/lib/platform-models'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'
import { Switch } from '@/components/ui/switch'

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_VOICE = 'alloy'
const DEFAULT_SPEED = 1.0

/* ─── Options ────────────────────────────────────────── */

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
]

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function AudioGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const config = data.config
  const { data: platformAudioModels = [] } = useAIModels('audio')

  /* ── Config values ─────────────────────────────────── */
  const provider = resolvePlatformProvider('audio-gen', config)
  const model = resolvePlatformModel('audio-gen', config)
  const modelGroups = useMemo(
    () => groupPlatformModelsByProvider(platformAudioModels),
    [platformAudioModels],
  )
  const resolvedPlatformSelection = useMemo(
    () => resolvePlatformModelSelection(modelGroups, provider, model),
    [modelGroups, model, provider],
  )
  const selectedPlatformProvider = resolvedPlatformSelection?.provider ?? provider
  const selectedPlatformModel = resolvedPlatformSelection?.modelId ?? model
  const currentGroup = useMemo(
    () =>
      modelGroups.find((group) => group.provider === selectedPlatformProvider) ??
      modelGroups[0],
    [modelGroups, selectedPlatformProvider],
  )
  const executionMode = (config.executionMode as string) ?? 'platform'
  const voice = (config.voice as string) ?? DEFAULT_VOICE
  const speed = (config.speed as number) ?? DEFAULT_SPEED
  const resultUrl = (config.resultUrl as string) ?? ''
  const showPreview = config.showPreview === true
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()
  const savedAudioConfigs = getConfigsByCapability('audio')
  const selectedUserConfigId =
    resolveAvailableUserConfigId(
      config,
      savedAudioConfigs.map((item) => item.configId),
    ) ?? ''
  const savedAudioConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('audio')
  const { dialog, handleUserKeyIntent } = useUserKeyOnboarding()
  const userKeyProviderLabel = getProviderLabel('audio', savedAudioConfig?.providerId)
  const userKeyModelLabel =
    savedAudioConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')

  /* ── Update helpers ────────────────────────────────── */
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...config, ...patch } })
    },
    [props.id, config, updateNodeData],
  )

  useEffect(() => {
    const patch = getNodeConfigMigrationPatch('audio-gen', config)
    if (selectedPlatformProvider !== provider) {
      patch.platformProvider = selectedPlatformProvider
    }
    if (selectedPlatformModel !== model) {
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
    model,
    provider,
    selectedPlatformModel,
    selectedPlatformProvider,
    selectedUserConfigId,
    updateConfig,
  ])

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ platformModel: e.target.value }),
    [updateConfig],
  )

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value
      const nextGroup = modelGroups.find((group) => group.provider === newProvider)
      updateConfig({
        platformProvider: newProvider,
        platformModel: nextGroup?.models[0]?.modelId ?? '',
      })
    },
    [modelGroups, updateConfig],
  )

  const onVoiceChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ voice: e.target.value }),
    [updateConfig],
  )

  const onSpeedChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      updateConfig({ speed: parseFloat(e.target.value) }),
    [updateConfig],
  )

  /* ── Speed display ─────────────────────────────────── */
  const speedLabel = useMemo(() => `${speed.toFixed(1)}x`, [speed])
  const providerOptions = modelGroups.map((group) => ({
    value: group.provider,
    label: group.providerLabel,
  }))

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Music size={14} />}
      minHeight={220}
      bodyClassName="min-h-0"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
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
              onClick={() => {
                if (executionMode === 'user_key') return
                handleUserKeyIntent('audio', () =>
                  updateConfig({
                    executionMode: 'user_key',
                    userKeyConfigId: selectedUserConfigId,
                  }),
                )
              }}
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
        </ConfigField>

        <ConfigField label={t('provider')}>
          {executionMode === 'user_key' ? (
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {userKeyProviderLabel}
            </div>
          ) : (
            <select
              value={selectedPlatformProvider}
              onChange={onProviderChange}
              className={SELECT_CLASS}
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </ConfigField>

        {executionMode === 'user_key' ? (
          <ConfigField label={t('accountConfigLabel')}>
            <select
              value={selectedUserConfigId}
              onChange={(e) => updateConfig({ userKeyConfigId: e.target.value })}
              className={SELECT_CLASS}
            >
              {savedAudioConfigs.length === 0 ? (
                <option value="">{t('noApiConfigs')}</option>
              ) : (
                savedAudioConfigs.map((item) => (
                  <option key={item.configId} value={item.configId}>
                    {item.label || item.configId}
                  </option>
                ))
              )}
            </select>
          </ConfigField>
        ) : null}

        {/* ── Model selector ──────────────────────── */}
        <ConfigField label={t('model')}>
          <select
            value={executionMode === 'user_key' ? userKeyModelLabel : selectedPlatformModel}
            onChange={onModelChange}
            className={SELECT_CLASS}
            disabled={executionMode === 'user_key'}
          >
            {executionMode === 'user_key' ? (
              <option value={userKeyModelLabel}>{userKeyModelLabel}</option>
            ) : (
              (currentGroup?.models ?? []).map((m) => (
                <option key={m.id} value={m.modelId}>
                  {m.modelName}
                </option>
              ))
            )}
          </select>
        </ConfigField>

        {/* ── Voice selector ─────────────────────── */}
        <ConfigField label={t('audioVoice')}>
          <select value={voice} onChange={onVoiceChange} className={SELECT_CLASS}>
            {VOICE_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Speed slider ───────────────────────── */}
        <ConfigField label={t('audioSpeed', { value: speedLabel })}>
          <input
            type="range"
            min={0.25}
            max={4.0}
            step={0.25}
            value={speed}
            onChange={onSpeedChange}
            className="nodrag nowheel w-full accent-[var(--brand-500)]"
          />
        </ConfigField>

        <ConfigField label={t('preview')}>
          <div className="flex items-center justify-between gap-3 rounded-md border px-2 py-1.5">
            <span className="text-muted-foreground text-xs">
              {t('previewDescription')}
            </span>
            <Switch
              checked={showPreview}
              onCheckedChange={(checked) => updateConfig({ showPreview: checked })}
              size="sm"
            />
          </div>
        </ConfigField>

        {/* ── Result preview ──────────────────────── */}
        {showPreview && (status === 'running' || resultUrl) && (
          <div className="border-border flex min-h-0 flex-1 flex-col rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' && (
                <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
              )}
            </div>
            <div className="flex min-h-[88px] flex-1 items-center justify-center p-2">
              {resultUrl ? (
                <audio src={resultUrl} controls className="nodrag nowheel w-full" />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {t('generating')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {dialog}
    </BaseNode>
  )
}

/* ─── Internal Components ────────────────────────────── */

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
