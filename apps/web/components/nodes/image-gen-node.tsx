/**
 * [INPUT]: 依赖 @xyflow/react 的 NodeProps，依赖 ./base-node，依赖 @/stores/use-flow-store，
 *          依赖 next-intl 的 useTranslations，依赖平台模型目录与图片能力真相源
 *          依赖 @/lib/billing/workflow-pricing 的平台积分规则
 * [OUTPUT]: 对外提供 ImageGenNode 图片生成节点组件
 * [POS]: components/nodes 的图片生成节点，被 registry 注册并在画布中渲染，负责平台模型选择、尺寸/比例配置、平台积分展示与前端能力护栏
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 生成结果可能是 data URL 或第三方临时链接，不适合走 Next Image。 */

import { useCallback, useEffect, useMemo, type ChangeEvent } from 'react'
import type { NodeProps } from '@xyflow/react'
import { useTranslations } from 'next-intl'
import { Coins, ImageIcon, KeyRound, Loader2 } from 'lucide-react'

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
import {
  DEFAULT_IMAGE_SIZE_PRESET,
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  getStaticImageModelCapabilities,
  mergeImageModelCapabilities,
  prettifyModelName,
  type ImageAspectRatio,
  type ImageModelCapabilities,
  type ImageSizeOptionValue,
  validateImageSelection,
} from '@/lib/image-model-capabilities'
import { describeWorkflowImagePrice } from '@/lib/billing/workflow-pricing'
import { getProviderLabel } from '@/lib/model-config-catalog'
import {
  groupPlatformModelsByProvider,
} from '@/lib/platform-models'
import { useFlowStore } from '@/stores/use-flow-store'
import type { WorkflowNodeData } from '@/types'

import { Switch } from '@/components/ui/switch'

import { BaseNode } from './base-node'

const DEFAULT_SIZE: ImageSizeOptionValue = 'auto'
const DEFAULT_ASPECT_RATIO: ImageAspectRatio = '1:1'

const SELECT_CLASS =
  'nodrag nowheel border-input bg-background w-full rounded-md border px-2 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-500)] focus:outline-none'

function migrateLegacySize(size: string): {
  size: ImageSizeOptionValue
  aspectRatio: ImageAspectRatio
} {
  switch (size) {
    case '1024x1792':
      return { size: DEFAULT_IMAGE_SIZE_PRESET, aspectRatio: '9:16' }
    case '1792x1024':
      return { size: DEFAULT_IMAGE_SIZE_PRESET, aspectRatio: '16:9' }
    case 'auto':
      return { size: DEFAULT_SIZE, aspectRatio: DEFAULT_ASPECT_RATIO }
    case '1024x1024':
    default:
      return { size: DEFAULT_IMAGE_SIZE_PRESET, aspectRatio: DEFAULT_ASPECT_RATIO }
  }
}

function findFirstValidSelection(capabilities?: ImageModelCapabilities) {
  for (const aspect of IMAGE_ASPECT_RATIO_OPTIONS) {
    for (const size of IMAGE_SIZE_OPTIONS) {
      if (!validateImageSelection(size.value, aspect.value, capabilities)) {
        return { size: size.value, aspectRatio: aspect.value }
      }
    }
  }

  return null
}

export function ImageGenNode(props: NodeProps) {
  const data = props.data as WorkflowNodeData
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const t = useTranslations('nodes')
  const config = data.config

  const { data: platformImageModels = [], isLoading: isPlatformModelsLoading } =
    useAIModels('image')
  const platformModelId = resolvePlatformModel('image-gen', config)
  const platformProviderId = resolvePlatformProvider('image-gen', config)
  const platformModelGroups = useMemo(
    () => groupPlatformModelsByProvider(platformImageModels),
    [platformImageModels],
  )
  const flatPlatformModels = useMemo(
    () => platformModelGroups.flatMap((group) => group.models),
    [platformModelGroups],
  )
  const selectedPlatformModel = useMemo(() => {
    const exactMatch = flatPlatformModels.find(
      (item) =>
        item.provider === platformProviderId && item.modelId === platformModelId,
    )

    if (exactMatch) {
      return exactMatch
    }

    const firstModelWithSameId = flatPlatformModels.find(
      (item) => item.modelId === platformModelId,
    )

    return firstModelWithSameId ?? flatPlatformModels[0]
  }, [flatPlatformModels, platformModelId, platformProviderId])

  const sizeValue = typeof config.size === 'string' ? config.size : DEFAULT_SIZE
  const migratedLegacySize = useMemo(() => migrateLegacySize(sizeValue), [sizeValue])
  const size = IMAGE_SIZE_OPTIONS.some((item) => item.value === sizeValue)
    ? (sizeValue as ImageSizeOptionValue)
    : migratedLegacySize.size
  const aspectRatioValue =
    typeof config.aspectRatio === 'string'
      ? config.aspectRatio
      : migratedLegacySize.aspectRatio
  const aspectRatio = IMAGE_ASPECT_RATIO_OPTIONS.some(
    (item) => item.value === aspectRatioValue,
  )
    ? (aspectRatioValue as ImageAspectRatio)
    : DEFAULT_ASPECT_RATIO
  const executionMode = (config.executionMode as string) ?? 'platform'
  const resultUrl = (config.resultUrl as string) ?? ''
  const progress = (config.progress as number) ?? 0
  const showPreview = config.showPreview === true
  const status = data.status ?? 'idle'
  const isTaskActive =
    status === 'queued' || status === 'running' || status === 'finalizing'
  const statusLabel =
    status === 'queued'
      ? t('queued')
      : status === 'finalizing'
        ? t('finalizing')
        : t('generating')

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
    executionMode === 'user_key'
      ? userKeyModelLabel
      : selectedPlatformModel?.modelName ?? prettifyModelName(platformModelId)
  const platformPricing = useMemo(
    () =>
      executionMode === 'platform'
        ? describeWorkflowImagePrice({
            modelId: selectedPlatformModel?.modelId ?? platformModelId,
            modelName: selectedPlatformModel?.modelName,
            size,
          })
        : null,
    [executionMode, platformModelId, selectedPlatformModel, size],
  )
  const currentImageCapabilities =
    executionMode === 'user_key'
      ? savedImageConfig?.imageCapabilities
      : selectedPlatformModel
        ? mergeImageModelCapabilities(
            getStaticImageModelCapabilities(
              selectedPlatformModel.provider,
              selectedPlatformModel.modelId,
            ),
          )
        : undefined
  const currentSelectionViolation = validateImageSelection(
    size,
    aspectRatio,
    currentImageCapabilities,
  )

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeData(props.id, { config: { ...config, ...patch } })
    },
    [config, props.id, updateNodeData],
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

    if (
      selectedPlatformModel &&
      executionMode === 'platform' &&
      (config.platformProvider !== selectedPlatformModel.provider ||
        config.platformModel !== selectedPlatformModel.modelId)
    ) {
      patch.platformProvider = selectedPlatformModel.provider
      patch.platformModel = selectedPlatformModel.modelId
    }

    if (Object.keys(patch).length > 0) {
      updateConfig(patch)
    }
  }, [
    aspectRatio,
    config,
    executionMode,
    selectedPlatformModel,
    selectedUserConfigId,
    size,
    sizeValue,
    updateConfig,
  ])

  useEffect(() => {
    if (!currentSelectionViolation) {
      return
    }

    const nextSelection = findFirstValidSelection(currentImageCapabilities)
    if (!nextSelection) {
      return
    }

    if (nextSelection.size !== size || nextSelection.aspectRatio !== aspectRatio) {
      updateConfig(nextSelection)
    }
  }, [aspectRatio, currentImageCapabilities, currentSelectionViolation, size, updateConfig])

  const onSizeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => updateConfig({ size: e.target.value }),
    [updateConfig],
  )

  const onAspectRatioChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) =>
      updateConfig({ aspectRatio: e.target.value }),
    [updateConfig],
  )

  const onPlatformModelChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const nextModel = flatPlatformModels.find(
        (item) => item.modelId === e.target.value,
      )
      if (!nextModel) {
        return
      }

      updateConfig({
        platformProvider: nextModel.provider,
        platformModel: nextModel.modelId,
      })
    },
    [flatPlatformModels, updateConfig],
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
                  platformProvider:
                    selectedPlatformModel?.provider ?? platformProviderId,
                  platformModel: selectedPlatformModel?.modelId ?? platformModelId,
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
        ) : null}

        <ConfigField label={t('model')}>
          {executionMode === 'platform' ? (
            <div className="space-y-2">
              <select
                value={
                  selectedPlatformModel
                    ? selectedPlatformModel.modelId
                    : platformModelId
                }
                onChange={onPlatformModelChange}
                className={SELECT_CLASS}
                disabled={isPlatformModelsLoading || flatPlatformModels.length === 0}
              >
                {flatPlatformModels.length === 0 ? (
                  <option value={platformModelId}>{displayModelLabel}</option>
                ) : (
                  flatPlatformModels.map((item) => (
                    <option key={item.id} value={item.modelId}>
                      {item.modelName?.trim() || prettifyModelName(item.modelId)}
                    </option>
                  ))
                )}
              </select>

            </div>
          ) : (
            <div className="text-foreground bg-muted rounded-md border px-2 py-1 text-sm">
              {displayModelLabel}
            </div>
          )}
        </ConfigField>

        <ConfigField
          label={t('imageSize')}
          labelRight={
            executionMode === 'platform' && platformPricing ? (
              <CreditPill
                value={
                  platformPricing.credits == null
                    ? t('creditsAutoPending')
                    : String(platformPricing.credits)
                }
              />
            ) : null
          }
        >
          <div className="space-y-2">
            <select value={size} onChange={onSizeChange} className={SELECT_CLASS}>
              {IMAGE_SIZE_OPTIONS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                  disabled={Boolean(
                    validateImageSelection(
                      item.value,
                      aspectRatio,
                      currentImageCapabilities,
                    ),
                  )}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </ConfigField>

        <ConfigField label={t('imageAspect')}>
          <select
            value={aspectRatio}
            onChange={onAspectRatioChange}
            className={SELECT_CLASS}
          >
            {IMAGE_ASPECT_RATIO_OPTIONS.map((item) => (
              <option
                key={item.value}
                value={item.value}
                disabled={Boolean(
                  validateImageSelection(
                    size,
                    item.value,
                    currentImageCapabilities,
                  ),
                )}
              >
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

        {showPreview && (isTaskActive || resultUrl) ? (
          <div className="border-border flex min-h-0 flex-1 flex-col rounded-md border">
            <div className="border-border flex items-center justify-between border-b px-2 py-1">
              <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                {t('output')}
              </span>
              {isTaskActive ? (
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
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-muted-foreground text-xs italic">
                    {statusLabel}
                  </span>
                  {progress > 0 ? (
                    <span className="text-muted-foreground text-[10px]">
                      {progress}%
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {isTaskActive ? (
              <div className="px-2 pb-2">
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-[var(--brand-500)] transition-all"
                    style={{ width: `${Math.max(progress, status === 'queued' ? 8 : 12)}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {dialog}
    </BaseNode>
  )
}

function CreditPill({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      <Coins size={11} />
      <span>{value}</span>
    </span>
  )
}

function ConfigField({
  label,
  labelRight,
  children,
}: {
  label: string
  labelRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-muted-foreground mb-1 flex items-center justify-between gap-2 text-xs">
        <label>{label}</label>
        {labelRight}
      </div>
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
