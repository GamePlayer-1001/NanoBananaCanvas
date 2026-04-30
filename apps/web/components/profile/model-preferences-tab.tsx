/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @tanstack/react-query 的 query/mutation，
 *          依赖 sonner 的 toast，依赖 @/hooks/use-model-configs / use-user，
 *          依赖 @/i18n/navigation 的 Link，依赖 @/lib/model-config-catalog
 * [OUTPUT]: 对外提供 ModelPreferencesTab API 接入配置面板
 * [POS]: profile 的模型偏好面板，被账户页消费，负责管理四类能力卡片的多条 API 接入配置，支持修改/测试/删除
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useModelConfigs, type ModelConfigItem } from '@/hooks/use-model-configs'
import { useCurrentUser } from '@/hooks/use-user'
import { Link } from '@/i18n/navigation'
import {
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  type ImageAspectRatio,
  type ImageSizePreset,
  type ImageModelCapabilities,
} from '@/lib/image-model-capabilities'
import {
  MODEL_PROVIDER_OPTIONS,
  getProviderOption,
  type CapabilityId,
} from '@/lib/model-config-catalog'
import { queryKeys } from '@/lib/query/keys'

interface DraftState {
  tempId: string
  configId?: string
  capability: CapabilityId
  name: string
  providerId: string
  providerKind:
    | 'openai-compatible'
    | 'openrouter'
    | 'google-image'
    | 'gemini'
    | 'kling'
    | 'openai-audio'
  apiKey: string
  secretKey: string
  baseUrl: string
  modelId: string
  imageCapabilities?: ImageModelCapabilities
}

const CARD_ORDER: CapabilityId[] = ['text', 'image', 'video', 'audio']

async function saveApiConfig(payload: DraftState) {
  const res = await fetch(`/api/settings/api-keys?provider=${payload.capability}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to save API config')
  }
}

async function testApiConfig(configId: string) {
  const res = await fetch(`/api/settings/api-keys/${configId}`, { method: 'POST' })
  const body = (await res.json()) as {
    data?: { valid?: boolean }
    error?: { message?: string }
  }
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to test API config')
  }
  if (!body.data?.valid) {
    throw new Error('API config validation failed')
  }
}

async function deleteApiConfig(configId: string) {
  const res = await fetch(`/api/settings/api-keys/${configId}`, { method: 'DELETE' })
  const body = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to delete API config')
  }
}

function createDraft(capability: CapabilityId, saved?: ModelConfigItem): DraftState {
  const provider = getProviderOption(capability, saved?.providerId)
  return {
    tempId: saved?.configId ?? crypto.randomUUID(),
    configId: saved?.configId,
    capability,
    name: saved?.label ?? '',
    providerId: saved?.providerId ?? provider?.providerId ?? MODEL_PROVIDER_OPTIONS[capability][0].providerId,
    providerKind:
      (saved?.providerKind as DraftState['providerKind'] | undefined) ??
      provider?.providerKind ??
      MODEL_PROVIDER_OPTIONS[capability][0].providerKind,
    apiKey: '',
    secretKey: '',
    baseUrl: saved?.baseUrl ?? '',
    modelId: saved?.modelId ?? '',
    imageCapabilities: saved?.imageCapabilities,
  }
}

function toggleStringSelection<T extends string>(
  current: readonly T[] | undefined,
  value: T,
): T[] {
  if (!current?.length) {
    return [value]
  }

  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
}

export function ModelPreferencesTab() {
  const t = useTranslations('profile')
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const {
    isLoading,
    isError,
    error,
    getConfigsByCapability,
    getConfigById,
  } = useModelConfigs()
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})
  const [newDraftIds, setNewDraftIds] = useState<Record<CapabilityId, string[]>>({
    text: [],
    image: [],
    video: [],
    audio: [],
  })

  const invalidateConfigs = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: DraftState) => saveApiConfig(payload),
    onSuccess: async (_data, draft) => {
      setDrafts((current) => {
        const next = { ...current }
        delete next[draft.tempId]
        return next
      })
      if (!draft.configId) {
        setNewDraftIds((current) => ({
          ...current,
          [draft.capability]: current[draft.capability].filter((id) => id !== draft.tempId),
        }))
      }
      await invalidateConfigs()
      toast.success(t('apiConfigSaved'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigSaveFailed'))
    },
  })

  const testMutation = useMutation({
    mutationFn: (configId: string) => testApiConfig(configId),
    onSuccess: async () => {
      await invalidateConfigs()
      toast.success(t('apiConfigTestPassed'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigTestFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (configId: string) => deleteApiConfig(configId),
    onSuccess: async (_data, configId) => {
      setDrafts((current) => {
        const next = { ...current }
        delete next[configId]
        return next
      })
      await invalidateConfigs()
      toast.success(t('apiConfigDeleted'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigDeleteFailed'))
    },
  })

  const updateDraft = (tempId: string, patch: Partial<DraftState>) => {
    setDrafts((current) => {
      const existing = current[tempId]
      if (!existing) return current
      return { ...current, [tempId]: { ...existing, ...patch } }
    })
  }

  const addDraft = (capability: CapabilityId) => {
    const nextDraft = createDraft(capability)
    setDrafts((current) => ({ ...current, [nextDraft.tempId]: nextDraft }))
    setNewDraftIds((current) => ({
      ...current,
      [capability]: [...current[capability], nextDraft.tempId],
    }))
  }

  const removeLocalDraft = (capability: CapabilityId, tempId: string) => {
    setDrafts((current) => {
      const next = { ...current }
      delete next[tempId]
      return next
    })
    setNewDraftIds((current) => ({
      ...current,
      [capability]: current[capability].filter((id) => id !== tempId),
    }))
  }

  const startEditing = (capability: CapabilityId, saved?: ModelConfigItem) => {
    if (!saved?.configId) {
      return
    }

    setDrafts((current) => ({
      ...current,
      [saved.configId]: createDraft(capability, saved),
    }))
  }

  const cards = useMemo(
    () =>
      CARD_ORDER.map((capability) => {
        const savedItems = getConfigsByCapability(capability)
        const itemIds = [
          ...savedItems.map((item) => item.configId),
          ...newDraftIds[capability],
        ]

        const items = itemIds.map((itemId) => {
          const saved = getConfigById(itemId)
          const draft = drafts[itemId] ?? createDraft(capability, saved)
          return { itemId, saved, draft }
        })

        return { capability, savedItems, items }
      }),
    [drafts, getConfigById, getConfigsByCapability, newDraftIds],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{t('modelPreferences')}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{t('apiConfigDesc')}</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-brand-500" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('apiConfigSecurityTitle')}</p>
            <p>{t('apiConfigSecurityBody')}</p>
          </div>
        </div>
      </div>

      {currentUser && !currentUser.isAuthenticated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-950">
                {t('accountLoginRequiredTitle')}
              </p>
              <p className="text-sm leading-6 text-amber-800">
                {t('accountLoginRequiredBody')}
              </p>
            </div>

            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              {t('accountLoginRequiredAction')}
            </Link>
          </div>
        </div>
      ) : null}

      {currentUser && !currentUser.isAuthenticated ? null : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          {t('apiConfigLoading')}
        </div>
      ) : (
        <div className="space-y-4">
          {isError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {error instanceof Error ? error.message : 'Failed to load API configs'}
            </div>
          ) : null}

          {cards.map(({ capability, savedItems, items }) => (
            <section
              key={capability}
              className="space-y-4 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <KeyRound size={14} />
                    {t(`capability_${capability}`)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(`capability_${capability}_desc`)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      savedItems.length > 0
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {savedItems.length > 0 ? <CheckCircle2 size={12} /> : null}
                    {savedItems.length > 0
                      ? t('apiConfigsCount', { count: savedItems.length })
                      : t('notConfigured')}
                  </span>

                  <button
                    type="button"
                    onClick={() => addDraft(capability)}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  >
                    <Plus size={14} />
                    {t('addApiConfig')}
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  {t('noApiConfigs')}
                </div>
              ) : null}

              {items.map(({ itemId, saved, draft }) => {
                const selectedProvider = getProviderOption(capability, draft.providerId)
                const providerOptions = MODEL_PROVIDER_OPTIONS[capability]
                const isEditing = Boolean(drafts[itemId])
                const isSaving = saveMutation.isPending && saveMutation.variables?.tempId === itemId
                const isTesting =
                  testMutation.isPending && testMutation.variables === saved?.configId
                const isDeleting =
                  deleteMutation.isPending && deleteMutation.variables === saved?.configId
                const configId = saved?.configId ?? null
                const isConfigured = Boolean(saved?.configId)
                const imageCapabilities = draft.imageCapabilities

                return (
                  <div
                    key={itemId}
                    className="space-y-4 rounded-xl border border-border/80 bg-muted/10 p-3"
                  >
                    {isConfigured && !isEditing ? (
                      <div className="flex items-stretch justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {saved?.label || t('newConfig')}
                          </p>
                          <div className="space-y-0.5 text-xs leading-5 text-muted-foreground">
                            {saved?.maskedKey ? (
                              <p className="truncate">{t('loadedMaskedKey', { key: saved.maskedKey })}</p>
                            ) : null}
                            <p className="truncate">
                              {t('currentProvider', {
                                provider: selectedProvider?.label ?? saved?.providerId ?? '-',
                              })}
                            </p>
                            <p className="truncate">
                              {t('currentModelId', { modelId: saved?.modelId ?? '-' })}
                            </p>
                            <p className="truncate">
                              {t('currentBaseUrl', { baseUrl: saved?.baseUrl ?? '-' })}
                            </p>
                            {capability === 'image' && saved?.imageCapabilities?.maxLongEdge ? (
                              <p className="truncate">
                                {t('imageMaxLongEdgeSummary', {
                                  value: saved.imageCapabilities.maxLongEdge,
                                })}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end self-stretch">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 size={12} />
                            {t('configured')}
                          </span>

                          <div className="mt-auto flex flex-col items-end gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => startEditing(capability, saved)}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition hover:bg-muted"
                            >
                              {t('editApiConfig')}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!configId) return
                                testMutation.mutate(configId)
                              }}
                              disabled={isTesting}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isTesting ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <RefreshCw size={12} />
                              )}
                              {t('testApiConfig')}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (!configId) return
                                deleteMutation.mutate(configId)
                              }}
                              disabled={isDeleting}
                              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 text-xs font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeleting ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Trash2 size={12} />
                              )}
                              {t('deleteApiConfig')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {!isConfigured || isEditing ? (
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {draft.name || saved?.label || t('newConfig')}
                            </p>
                          </div>

                          <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {isConfigured ? t('editingConfig') : t('newConfig')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {t('configNameLabel')}
                          </label>
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(e) => updateDraft(itemId, { name: e.target.value })}
                            placeholder={t('configNamePlaceholder')}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {t('providerTypeLabel')}
                          </label>
                          <select
                            value={draft.providerId}
                            onChange={(e) => {
                              const nextProvider = getProviderOption(capability, e.target.value)
                              if (!nextProvider) return
                              updateDraft(itemId, {
                                providerId: nextProvider.providerId,
                                providerKind: nextProvider.providerKind,
                                baseUrl: nextProvider.requiresBaseUrl ? draft.baseUrl : '',
                                secretKey: nextProvider.requiresSecretKey ? draft.secretKey : '',
                              })
                            }}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-brand-500 focus:outline-none"
                          >
                            {providerOptions.map((option) => (
                              <option key={option.providerId} value={option.providerId}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {selectedProvider?.apiKeyLabel ?? t('apiKeyLabel')}
                          </label>
                          <input
                            type="password"
                            value={draft.apiKey}
                            onChange={(e) => updateDraft(itemId, { apiKey: e.target.value })}
                            placeholder={saved?.maskedKey || t('apiKeyPlaceholder')}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                          />
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {saved?.maskedKey ? (
                              <p>{t('editMaskedKeyHint', { key: saved.maskedKey })}</p>
                            ) : null}
                            <p>
                              {saved?.maskedKey ? t('keepExistingKeyHint') : t('saveHint')}
                            </p>
                          </div>
                        </div>

                        {selectedProvider?.requiresSecretKey ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              {selectedProvider.secretKeyLabel ?? t('secretKeyLabel')}
                            </label>
                            <input
                              type="password"
                              value={draft.secretKey}
                              onChange={(e) => updateDraft(itemId, { secretKey: e.target.value })}
                              placeholder={
                                saved?.hasSecretKey
                                  ? t('secretKeyMaskedPlaceholder')
                                  : t('secretKeyPlaceholder')
                              }
                              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                            />
                            {saved?.hasSecretKey ? (
                              <p className="text-xs text-muted-foreground">
                                {t('keepExistingSecretKeyHint')}
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        {selectedProvider?.requiresBaseUrl ? (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              {t('baseUrlLabel')}
                            </label>
                            <input
                              type="url"
                              value={draft.baseUrl}
                              onChange={(e) => updateDraft(itemId, { baseUrl: e.target.value })}
                              placeholder="https://api.example.com/v1"
                              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                        ) : null}

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            {t('modelIdLabel')}
                          </label>
                          <input
                            type="text"
                            value={draft.modelId}
                            onChange={(e) => updateDraft(itemId, { modelId: e.target.value })}
                            placeholder={t(`capability_${capability}_model_placeholder`)}
                            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                          />
                        </div>

                        {capability === 'image' ? (
                          <div className="space-y-4 rounded-lg border border-border/70 bg-muted/20 p-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {t('imageAdvancedRulesTitle')}
                              </p>
                              <p className="text-xs leading-5 text-muted-foreground">
                                {t('imageAdvancedRulesBody')}
                              </p>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  {t('imageMinPixelsLabel')}
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={imageCapabilities?.minPixels ?? ''}
                                  onChange={(e) =>
                                    updateDraft(itemId, {
                                      imageCapabilities: {
                                        ...imageCapabilities,
                                        minPixels: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      },
                                    })
                                  }
                                  placeholder="900000"
                                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  {t('imageMaxLongEdgeLabel')}
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={imageCapabilities?.maxLongEdge ?? ''}
                                  onChange={(e) =>
                                    updateDraft(itemId, {
                                      imageCapabilities: {
                                        ...imageCapabilities,
                                        maxLongEdge: e.target.value
                                          ? Number(e.target.value)
                                          : undefined,
                                      },
                                    })
                                  }
                                  placeholder="3840"
                                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                {t('imageAllowedSizesLabel')}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {IMAGE_SIZE_OPTIONS.map((option) => {
                                  const active = imageCapabilities?.allowedSizes?.includes(
                                    option.value as ImageSizePreset,
                                  )
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() =>
                                        updateDraft(itemId, {
                                          imageCapabilities: {
                                            ...imageCapabilities,
                                            allowedSizes: toggleStringSelection(
                                              imageCapabilities?.allowedSizes,
                                              option.value as ImageSizePreset,
                                            ),
                                          },
                                        })
                                      }
                                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                        active
                                          ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                                          : 'border-border text-muted-foreground hover:bg-muted'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                {t('imageAllowedAspectRatiosLabel')}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {IMAGE_ASPECT_RATIO_OPTIONS.map((option) => {
                                  const active =
                                    imageCapabilities?.allowedAspectRatios?.includes(
                                      option.value as ImageAspectRatio,
                                    )
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() =>
                                        updateDraft(itemId, {
                                          imageCapabilities: {
                                            ...imageCapabilities,
                                            allowedAspectRatios: toggleStringSelection(
                                              imageCapabilities?.allowedAspectRatios,
                                              option.value as ImageAspectRatio,
                                            ),
                                          },
                                        })
                                      }
                                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                                        active
                                          ? 'border-brand-500 bg-brand-500/10 text-brand-600'
                                          : 'border-border text-muted-foreground hover:bg-muted'
                                      }`}
                                    >
                                      {option.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              saveMutation.mutate({
                                ...draft,
                                capability,
                                providerKind:
                                  selectedProvider?.providerKind ?? draft.providerKind,
                              })
                            }
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                            {t('saveApiConfig')}
                          </button>

                          <button
                            type="button"
                            onClick={() => removeLocalDraft(capability, itemId)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                          >
                            <Trash2 size={14} />
                            {isConfigured ? t('cancelEdit') : t('cancelDraft')}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
