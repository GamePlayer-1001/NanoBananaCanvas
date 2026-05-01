/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 @/hooks/use-ai-models，依赖 @/lib/platform-models 与共享下拉，依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 VideoGenNode 视频生成节点组件
 * [POS]: components/nodes 的视频生成节点，被 registry 注册并在画布中渲染，统一消费 /api/ai/models 作为平台模型目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useCallback, useEffect, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, KeyRound, Loader2, Video } from 'lucide-react'
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
  toPlatformVisualOptions,
} from '@/lib/platform-models'
import type { WorkflowNodeData } from '@/types'
import { useFlowStore } from '@/stores/use-flow-store'
import { PlatformModelSelect } from '@/components/shared/platform-model-select'
import { BaseNode } from './base-node'
import { Switch } from '@/components/ui/switch'

/* ─── Defaults ───────────────────────────────────────── */

const DEFAULT_DURATION = '5'
const DEFAULT_ASPECT = '16:9'
const DEFAULT_MODE = 'std'

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
  const config = data.config
  const { data: platformVideoModels = [] } = useAIModels('video')

  /* ── Config values ─────────────────────────────────── */
  const provider = resolvePlatformProvider('video-gen', config)
  const model = resolvePlatformModel('video-gen', config)
  const selectedPlatformEntry = useMemo(
    () =>
      platformVideoModels.find(
        (item) => item.provider === provider && item.modelId === model,
      ) ??
      platformVideoModels.find((item) => item.modelId === model) ??
      platformVideoModels[0],
    [model, platformVideoModels, provider],
  )
  const selectedPlatformProvider = selectedPlatformEntry?.provider ?? provider
  const selectedPlatformModel = selectedPlatformEntry?.modelId ?? model
  const platformModelOptions = useMemo(
    () =>
      toPlatformVisualOptions(platformVideoModels).map((option) => ({
        ...option,
        description: option.providerLabel,
      })),
    [platformVideoModels],
  )
  const duration = (config.duration as string) ?? DEFAULT_DURATION
  const aspectRatio = (config.aspectRatio as string) ?? DEFAULT_ASPECT
  const mode = (config.mode as string) ?? DEFAULT_MODE
  const executionMode = (config.executionMode as string) ?? 'platform'
  const resultUrl = (config.resultUrl as string) ?? ''
  const progress = (config.progress as number) ?? 0
  const showPreview = config.showPreview === true
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()
  const savedVideoConfigs = getConfigsByCapability('video')
  const selectedUserConfigId =
    resolveAvailableUserConfigId(
      config,
      savedVideoConfigs.map((item) => item.configId),
    ) ?? ''
  const savedVideoConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('video')
  const { dialog, handleUserKeyIntent } = useUserKeyOnboarding()
  const userKeyProviderLabel = getProviderLabel('video', savedVideoConfig?.providerId)
  const userKeyModelLabel =
    savedVideoConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')

  /* ── Update helpers ────────────────────────────────── */
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...config, ...patch } })
    },
    [props.id, config, updateNodeData],
  )

  useEffect(() => {
    const patch = getNodeConfigMigrationPatch('video-gen', config)
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
    (value: string) => {
      const nextModel = platformVideoModels.find((item) => item.modelId === value)
      if (!nextModel) return

      updateConfig({
        platformProvider: nextModel.provider,
        platformModel: nextModel.modelId,
      })
    },
    [platformVideoModels, updateConfig],
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

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<Video size={14} />}
      minHeight={240}
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
                handleUserKeyIntent('video', () =>
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

        {/* ── Model selector ──────────────────────── */}
        <ConfigField label={t('model')}>
          {executionMode === 'user_key' ? (
            <div className="space-y-2">
              <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
                {userKeyProviderLabel}
              </div>
              <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
                {userKeyModelLabel}
              </div>
            </div>
          ) : (
            <PlatformModelSelect
              value={selectedPlatformModel}
              options={platformModelOptions}
              onValueChange={onModelChange}
              triggerClassName={SELECT_CLASS}
            />
          )}
        </ConfigField>

        {executionMode === 'user_key' ? (
          <ConfigField label={t('accountConfigLabel')}>
            <select
              value={selectedUserConfigId}
              onChange={(e) => updateConfig({ userKeyConfigId: e.target.value })}
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
        {selectedPlatformProvider === 'kling' && (
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

        {/* ── Result area ─────────────────────────── */}
        {showPreview && (status === 'running' || resultUrl) && (
          <div className="border-border flex min-h-0 flex-1 flex-col rounded-md border">
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
            <div className="flex min-h-[132px] flex-1 items-center justify-center p-2">
              {resultUrl ? (
                <video
                  src={resultUrl}
                  controls
                  className="h-full max-h-full max-w-full rounded object-contain"
                />
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
