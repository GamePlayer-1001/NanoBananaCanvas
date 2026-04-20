/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 AudioGenNode 音频生成节点组件
 * [POS]: components/nodes 的 TTS 节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, KeyRound, Loader2, Music } from 'lucide-react'
import { useModelConfigs } from '@/hooks/use-model-configs'
import {
  getNodeConfigMigrationPatch,
  resolveAvailableUserConfigId,
  resolvePlatformModel,
  resolvePlatformProvider,
  resolveUserConfigId,
} from '@/lib/ai-node-config'
import { getProviderLabel } from '@/lib/model-config-catalog'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

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

const MODEL_OPTIONS = [
  { value: 'tts-1', label: 'TTS-1' },
  { value: 'tts-1-hd', label: 'TTS-1 HD' },
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

  /* ── Config values ─────────────────────────────────── */
  const provider = resolvePlatformProvider('audio-gen', config)
  const model = resolvePlatformModel('audio-gen', config)
  const executionMode = (config.executionMode as string) ?? 'platform'
  const voice = (config.voice as string) ?? DEFAULT_VOICE
  const speed = (config.speed as number) ?? DEFAULT_SPEED
  const resultUrl = (config.resultUrl as string) ?? ''
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
  }, [config, executionMode, selectedUserConfigId, updateConfig])

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ platformModel: e.target.value }),
    [updateConfig],
  )

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ platformProvider: e.target.value }),
    [updateConfig],
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
  const providerOptions = [{ value: 'openai', label: 'OpenAI' }]

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
                  platformProvider: provider,
                  platformModel: model,
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

        <ConfigField label={t('provider')}>
          {executionMode === 'user_key' ? (
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {userKeyProviderLabel}
            </div>
          ) : (
            <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
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
            value={executionMode === 'user_key' ? userKeyModelLabel : model}
            onChange={onModelChange}
            className={SELECT_CLASS}
            disabled={executionMode === 'user_key'}
          >
            {executionMode === 'user_key' ? (
              <option value={userKeyModelLabel}>{userKeyModelLabel}</option>
            ) : (
              MODEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
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

        {/* ── Result preview ──────────────────────── */}
        {(status === 'running' || resultUrl) && (
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
