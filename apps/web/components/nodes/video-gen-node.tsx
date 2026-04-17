/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 VideoGenNode 视频生成节点组件
 * [POS]: components/nodes 的视频生成节点，被 registry 注册并在画布中渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, KeyRound, Loader2, Video } from 'lucide-react'
import { useModelConfigs } from '@/hooks/use-model-configs'
import { getProviderLabel } from '@/lib/model-config-catalog'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { BaseNode } from './base-node'

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_PROVIDER = 'kling'
const DEFAULT_MODEL = 'kling-v2-0'
const DEFAULT_DURATION = '5'
const DEFAULT_ASPECT = '16:9'
const DEFAULT_MODE = 'std'

/* ─── Provider + Model Catalog ───────────────────────── */

const VIDEO_PROVIDERS = [
  { value: 'kling', label: '可灵 (Kling)', disabled: false },
  { value: 'jimeng', label: '即梦 (Jimeng) — Coming Soon', disabled: true },
]

const VIDEO_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  kling: [
    { value: 'kling-v2-0', label: 'Kling V2.0' },
    { value: 'kling-v1-6', label: 'Kling V1.6' },
  ],
  jimeng: [{ value: 'seedance-2.0', label: 'Seedance 2.0' }],
}

const DURATION_OPTIONS = [
  { value: '5', label: '5s' },
  { value: '10', label: '10s' },
]

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
]

const MODE_OPTIONS = [
  { value: 'std', label: 'Standard' },
  { value: 'pro', label: 'Professional' },
]

/* ─── Shared Styles ──────────────────────────────────── */

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

/* ─── Component ──────────────────────────────────────── */

export function VideoGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')

  /* ── Config values ─────────────────────────────────── */
  const provider = (data.config.provider as string) ?? DEFAULT_PROVIDER
  const model = (data.config.model as string) ?? DEFAULT_MODEL
  const duration = (data.config.duration as string) ?? DEFAULT_DURATION
  const aspectRatio = (data.config.aspectRatio as string) ?? DEFAULT_ASPECT
  const mode = (data.config.mode as string) ?? DEFAULT_MODE
  const executionMode = (data.config.executionMode as string) ?? 'platform'
  const resultUrl = (data.config.resultUrl as string) ?? ''
  const progress = (data.config.progress as number) ?? 0
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()
  const savedVideoConfigs = getConfigsByCapability('video')
  const selectedUserConfigId =
    ((data.config.userKeyConfigId as string | undefined) ?? savedVideoConfigs[0]?.configId) || ''
  const savedVideoConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('video')
  const userKeyProviderLabel = getProviderLabel('video', savedVideoConfig?.providerId)
  const userKeyModelLabel =
    savedVideoConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')

  /* ── Update helpers ────────────────────────────────── */
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...data.config, ...patch } })
    },
    [props.id, data.config, updateNodeData],
  )

  useEffect(() => {
    if (executionMode === 'user_key' && provider !== 'video') {
      updateConfig({ provider: 'video', userKeyConfigId: savedVideoConfig?.configId ?? '' })
    }
    if (executionMode === 'platform' && provider === 'video') {
      updateConfig({ provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL })
    }
  }, [executionMode, provider, savedVideoConfig?.configId, updateConfig])

  const onProviderChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const newProvider = e.target.value
      if (executionMode === 'user_key') {
        updateConfig({ provider: newProvider })
        return
      }
      const models = VIDEO_MODELS[newProvider] ?? []
      updateConfig({ provider: newProvider, model: models[0]?.value ?? '' })
    },
    [executionMode, updateConfig],
  )

  const onModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ model: e.target.value }),
    [updateConfig],
  )

  const onDurationChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ duration: e.target.value }),
    [updateConfig],
  )

  const onAspectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ aspectRatio: e.target.value }),
    [updateConfig],
  )

  const onModeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ mode: e.target.value }),
    [updateConfig],
  )

  const currentModels = executionMode === 'user_key' ? [] : (VIDEO_MODELS[provider] ?? [])
  const providerOptions =
    executionMode === 'user_key'
      ? [{ value: 'video', label: userKeyProviderLabel }]
      : VIDEO_PROVIDERS

  return (
    <BaseNode {...props} data={data} icon={<Video size={14} />}>
      <div className="space-y-3">
        <ConfigField label={t('executionMode')}>
          <div className="nodrag flex gap-1">
            <ModeButton
              active={executionMode === 'platform'}
              onClick={() =>
                updateConfig({
                  executionMode: 'platform',
                  provider: DEFAULT_PROVIDER,
                  model: DEFAULT_MODEL,
                })
              }
              icon={<Coins size={12} />}
              label={t('platformMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() => updateConfig({ executionMode: 'user_key', provider: 'video' })}
              icon={<KeyRound size={12} />}
              label={t('userKeyMode')}
            />
          </div>
        </ConfigField>

        {/* ── Provider selector ────────────────────── */}
        <ConfigField label={t('provider')}>
          <select value={provider} onChange={onProviderChange} className={SELECT_CLASS}>
            {providerOptions.map((p) => (
              <option
                key={p.value}
                value={p.value}
                disabled={'disabled' in p ? p.disabled : false}
              >
                {p.label}
              </option>
            ))}
          </select>
        </ConfigField>

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
              currentModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))
            )}
          </select>
        </ConfigField>

        {executionMode === 'user_key' ? (
          <ConfigField label={t('accountConfigLabel')}>
            <select
              value={selectedUserConfigId}
              onChange={(e) => updateConfig({ userKeyConfigId: e.target.value, provider: 'video' })}
              className={SELECT_CLASS}
            >
              {savedVideoConfigs.length === 0 ? (
                <option value="">{t('noApiConfigs')}</option>
              ) : (
                savedVideoConfigs.map((item) => (
                  <option key={item.configId} value={item.configId}>
                    {item.label || item.configId}
                  </option>
                ))
              )}
            </select>
          </ConfigField>
        ) : null}

        {/* ── Duration ────────────────────────────── */}
        <ConfigField label={t('videoDuration')}>
          <select value={duration} onChange={onDurationChange} className={SELECT_CLASS}>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Aspect Ratio ────────────────────────── */}
        <ConfigField label={t('videoAspect')}>
          <select value={aspectRatio} onChange={onAspectChange} className={SELECT_CLASS}>
            {ASPECT_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </ConfigField>

        {/* ── Quality Mode (Kling only) ───────────── */}
        {provider === 'kling' && (
          <ConfigField label={t('videoMode')}>
            <select value={mode} onChange={onModeChange} className={SELECT_CLASS}>
              {MODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </ConfigField>
        )}

        {/* ── Result area ─────────────────────────── */}
        {(status === 'running' || resultUrl) && (
          <div className="border-border rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' && (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
                  {progress > 0 && (
                    <span className="text-muted-foreground text-[10px]">{progress}%</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-center p-2">
              {resultUrl ? (
                <video src={resultUrl} controls className="max-h-40 max-w-full rounded" />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {t('generating')}
                </span>
              )}
            </div>

            {/* ── Progress bar ──────────────────────── */}
            {status === 'running' && progress > 0 && (
              <div className="px-2 pb-2">
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
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
