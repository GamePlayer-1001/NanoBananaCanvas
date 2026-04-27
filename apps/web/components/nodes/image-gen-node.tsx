/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations
 * [OUTPUT]: 对外提供 ImageGenNode 图片生成节点组件
 * [POS]: components/nodes 的图片生成节点，被 registry 注册并在画布中渲染，负责只读展示模型并收集尺寸/比例参数
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 生成结果可能是 data URL 或第三方临时链接，不适合走 Next Image。 */

import { useCallback, useEffect, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, ImageIcon, KeyRound, Loader2 } from 'lucide-react'

import { useModelConfigs } from '@/hooks/use-model-configs'
import { useUserKeyOnboarding } from '@/hooks/use-user-key-onboarding'
import {
  getNodeConfigMigrationPatch,
  resolveAvailableUserConfigId,
  resolvePlatformModel,
  resolveUserConfigId,
} from '@/lib/ai-node-config'
import { getProviderLabel } from '@/lib/model-config-catalog'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { BaseNode } from './base-node'
import { Switch } from '@/components/ui/switch'

const DEFAULT_SIZE = '1k'
const DEFAULT_ASPECT_RATIO = '1:1'

const SIZE_OPTIONS = [
  { value: '720p', label: '720P' },
  { value: '1k', label: '1K' },
  { value: '2k', label: '2K' },
  { value: '4k', label: '4K' },
  { value: '8k', label: '8K' },
]

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '2:3', label: '2:3' },
  { value: '3:2', label: '3:2' },
  { value: '9:16', label: '9:16' },
  { value: '16:9', label: '16:9' },
] as const

const PLATFORM_IMAGE_MODELS = [
  { value: 'openai/dall-e-3', label: 'DALL-E 3', provider: 'openrouter' },
  { value: 'imagen-3.0-generate-002', label: 'Imagen 3', provider: 'gemini' },
] as const

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

function migrateLegacySize(size: string): { size: string; aspectRatio: string } {
  switch (size) {
    case '1024x1792':
      return { size: DEFAULT_SIZE, aspectRatio: '9:16' }
    case '1792x1024':
      return { size: DEFAULT_SIZE, aspectRatio: '16:9' }
    case '1024x1024':
    default:
      return { size: DEFAULT_SIZE, aspectRatio: DEFAULT_ASPECT_RATIO }
  }
}

export function ImageGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const config = data.config

  const model = resolvePlatformModel('image-gen', config)
  const selectedPlatformModel =
    PLATFORM_IMAGE_MODELS.find((item) => item.value === model) ??
    PLATFORM_IMAGE_MODELS[0]
  const sizeValue = typeof config.size === 'string' ? config.size : DEFAULT_SIZE
  const migratedLegacySize = useMemo(() => migrateLegacySize(sizeValue), [sizeValue])
  const size = SIZE_OPTIONS.some((item) => item.value === sizeValue)
    ? sizeValue
    : migratedLegacySize.size
  const aspectRatioValue =
    typeof config.aspectRatio === 'string' ? config.aspectRatio : migratedLegacySize.aspectRatio
  const aspectRatio = ASPECT_RATIO_OPTIONS.some((item) => item.value === aspectRatioValue)
    ? aspectRatioValue
    : DEFAULT_ASPECT_RATIO
  const executionMode = (config.executionMode as string) ?? 'platform'
  const resultUrl = (config.resultUrl as string) ?? ''
  const showPreview = config.showPreview === true
  const status = data.status ?? 'idle'
  const {
    getConfigByCapability,
    getConfigById,
    getConfigsByCapability,
    isLoading: isModelConfigLoading,
  } = useModelConfigs()
  const savedImageConfigs = getConfigsByCapability('image')
  const selectedUserConfigId =
    resolveAvailableUserConfigId(
      config,
      savedImageConfigs.map((item) => item.configId),
    ) ?? ''
  const savedImageConfig =
    getConfigById(selectedUserConfigId) ?? getConfigByCapability('image')
  const { dialog, handleUserKeyIntent } = useUserKeyOnboarding()
  const userKeyProviderLabel = getProviderLabel('image', savedImageConfig?.providerId)
  const userKeyModelLabel =
    savedImageConfig?.modelId?.trim() ||
    (isModelConfigLoading ? 'Loading API config...' : 'Use account API config')
  const displayModelLabel =
    executionMode === 'user_key' ? userKeyModelLabel : selectedPlatformModel.label

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...config, ...patch } })
    },
    [props.id, config, updateNodeData],
  )

  useEffect(() => {
    const patch = getNodeConfigMigrationPatch('image-gen', config)
    if (sizeValue !== size || config.aspectRatio !== aspectRatio) {
      patch.size = size
      patch.aspectRatio = aspectRatio
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
  }, [aspectRatio, config, executionMode, selectedUserConfigId, size, sizeValue, updateConfig])

  const onSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ size: e.target.value }),
    [updateConfig],
  )

  const onAspectRatioChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ aspectRatio: e.target.value }),
    [updateConfig],
  )

  return (
    <BaseNode
      {...props}
      data={data}
      icon={<ImageIcon size={14} />}
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
                  platformProvider: selectedPlatformModel.provider,
                  platformModel: selectedPlatformModel.value,
                })
              }
              icon={<Coins size={12} />}
              label={t('platformMode')}
            />
            <ModeButton
              active={executionMode === 'user_key'}
              onClick={() => {
                if (executionMode === 'user_key') return
                handleUserKeyIntent('image', () =>
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

        {executionMode === 'user_key' ? (
          <>
            <ConfigField label={t('provider')}>
              <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
                {userKeyProviderLabel}
              </div>
            </ConfigField>

            <ConfigField label={t('accountConfigLabel')}>
              <select
                value={selectedUserConfigId}
                onChange={(e) => updateConfig({ userKeyConfigId: e.target.value })}
                className={SELECT_CLASS}
              >
                {savedImageConfigs.length === 0 ? (
                  <option value="">{t('noApiConfigs')}</option>
                ) : (
                  savedImageConfigs.map((item) => (
                    <option key={item.configId} value={item.configId}>
                      {item.label || item.configId}
                    </option>
                  ))
                )}
              </select>
            </ConfigField>
          </>
        ) : (
          <ConfigField label={t('provider')}>
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {t('platformMode')}
            </div>
          </ConfigField>
        )}

        <ConfigField label={t('model')}>
          <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
            {displayModelLabel}
          </div>
        </ConfigField>

        <ConfigField label={t('imageSize')}>
          <select value={size} onChange={onSizeChange} className={SELECT_CLASS}>
            {SIZE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </ConfigField>

        <ConfigField label={t('imageAspect')}>
          <select
            value={aspectRatio}
            onChange={onAspectRatioChange}
            className={SELECT_CLASS}
          >
            {ASPECT_RATIO_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
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

        {showPreview && (status === 'running' || resultUrl) ? (
          <div className="border-border flex min-h-0 flex-1 flex-col rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {status === 'running' ? (
                <Loader2 size={10} className="animate-spin text-[var(--brand-500)]" />
              ) : null}
            </div>

            <div className="flex min-h-[120px] flex-1 items-center justify-center p-2">
              {resultUrl ? (
                <img
                  src={resultUrl}
                  alt="Generated"
                  className="h-full max-h-full max-w-full rounded object-contain"
                />
              ) : (
                <span className="text-muted-foreground text-xs italic">
                  {t('generating')}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {dialog}
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
