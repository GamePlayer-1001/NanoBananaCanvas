/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @tanstack/react-query 的 query/mutation，
 *          依赖 sonner 的 toast，依赖 @/hooks/use-model-configs，依赖 @/lib/model-config-catalog
 * [OUTPUT]: 对外提供 ModelPreferencesTab API 接入配置面板
 * [POS]: profile 的模型偏好面板，被账户页消费，负责管理四类能力卡片的 API 接入配置
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, KeyRound, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { useModelConfigs, type ModelConfigItem } from '@/hooks/use-model-configs'
import {
  MODEL_PROVIDER_OPTIONS,
  getProviderOption,
  type CapabilityId,
} from '@/lib/model-config-catalog'
import { queryKeys } from '@/lib/query/keys'

interface DraftState {
  providerId: string
  providerKind:
    | 'openai-compatible'
    | 'google-image'
    | 'gemini'
    | 'kling'
    | 'openai-audio'
  apiKey: string
  secretKey: string
  baseUrl: string
  modelId: string
}

const CARD_ORDER: CapabilityId[] = ['text', 'image', 'video', 'audio']

async function saveApiConfig(
  capability: CapabilityId,
  payload: DraftState,
) {
  const res = await fetch(`/api/settings/api-keys?provider=${capability}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const body = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to save API config')
  }
}

async function testApiConfig(capability: CapabilityId) {
  const res = await fetch(`/api/settings/api-keys/${capability}`, { method: 'POST' })
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

async function deleteApiConfig(capability: CapabilityId) {
  const res = await fetch(`/api/settings/api-keys/${capability}`, { method: 'DELETE' })
  const body = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(body.error?.message ?? 'Failed to delete API config')
  }
}

function createDefaultDraft(capability: CapabilityId, saved?: ModelConfigItem): DraftState {
  const provider = getProviderOption(capability, saved?.providerId)
  return {
    providerId: saved?.providerId ?? provider?.providerId ?? MODEL_PROVIDER_OPTIONS[capability][0].providerId,
    providerKind:
      (saved?.providerKind as DraftState['providerKind'] | undefined) ??
      provider?.providerKind ??
      MODEL_PROVIDER_OPTIONS[capability][0].providerKind,
    apiKey: '',
    secretKey: '',
    baseUrl: '',
    modelId: '',
  }
}

export function ModelPreferencesTab() {
  const t = useTranslations('profile')
  const queryClient = useQueryClient()
  const { isLoading, isError, error, getConfigByCapability } = useModelConfigs()
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})

  const invalidateConfigs = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() })
  }

  const saveMutation = useMutation({
    mutationFn: ({ capability, payload }: { capability: CapabilityId; payload: DraftState }) =>
      saveApiConfig(capability, payload),
    onSuccess: async (_data, variables) => {
      setDrafts((current) => {
        const next = { ...current }
        delete next[variables.capability]
        return next
      })
      await invalidateConfigs()
      toast.success(t('apiConfigSaved'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigSaveFailed'))
    },
  })

  const testMutation = useMutation({
    mutationFn: (capability: CapabilityId) => testApiConfig(capability),
    onSuccess: async () => {
      await invalidateConfigs()
      toast.success(t('apiConfigTestPassed'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigTestFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (capability: CapabilityId) => deleteApiConfig(capability),
    onSuccess: async (_data, capability) => {
      setDrafts((current) => {
        const next = { ...current }
        delete next[capability]
        return next
      })
      await invalidateConfigs()
      toast.success(t('apiConfigDeleted'))
    },
    onError: (nextError: Error) => {
      toast.error(nextError.message || t('apiConfigDeleteFailed'))
    },
  })

  const cards = useMemo(
    () =>
      CARD_ORDER.map((capability) => {
        const saved = getConfigByCapability(capability)
        const draft = drafts[capability] ?? createDefaultDraft(capability, saved)
        return { capability, saved, draft }
      }),
    [drafts, getConfigByCapability],
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

      {isLoading ? (
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

          {cards.map(({ capability, saved, draft }) => {
            const selectedProvider = getProviderOption(capability, draft.providerId)
            const providerOptions = MODEL_PROVIDER_OPTIONS[capability]
            const isSaving =
              saveMutation.isPending && saveMutation.variables?.capability === capability
            const isTesting =
              testMutation.isPending && testMutation.variables === capability
            const isDeleting =
              deleteMutation.isPending && deleteMutation.variables === capability

            return (
              <section
                key={capability}
                className="space-y-4 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <KeyRound size={14} />
                      {t(`capability_${capability}`)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(`capability_${capability}_desc`)}
                    </p>
                  </div>

                  {saved?.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={12} />
                      {t('configured')}
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {t('notConfigured')}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('providerTypeLabel')}</label>
                  <select
                    value={draft.providerId}
                    onChange={(e) => {
                      const nextProvider = getProviderOption(capability, e.target.value)
                      if (!nextProvider) return
                      setDrafts((current) => ({
                        ...current,
                        [capability]: {
                          ...draft,
                          providerId: nextProvider.providerId,
                          providerKind: nextProvider.providerKind,
                          baseUrl: nextProvider.requiresBaseUrl ? draft.baseUrl : '',
                          secretKey: nextProvider.requiresSecretKey ? draft.secretKey : '',
                        },
                      }))
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
                    onChange={(e) =>
                      setDrafts((current) => ({
                        ...current,
                        [capability]: { ...draft, apiKey: e.target.value },
                      }))
                    }
                    placeholder={t('apiKeyPlaceholder')}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {saved ? t('configuredHint') : t('saveHint')}
                  </p>
                </div>

                {selectedProvider?.requiresSecretKey ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {selectedProvider.secretKeyLabel ?? t('secretKeyLabel')}
                    </label>
                    <input
                      type="password"
                      value={draft.secretKey}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [capability]: { ...draft, secretKey: e.target.value },
                        }))
                      }
                      placeholder={t('secretKeyPlaceholder')}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                ) : null}

                {selectedProvider?.requiresBaseUrl ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('baseUrlLabel')}</label>
                    <input
                      type="url"
                      value={draft.baseUrl}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [capability]: { ...draft, baseUrl: e.target.value },
                        }))
                      }
                      placeholder={saved?.baseUrl ?? 'https://api.example.com/v1'}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t('modelIdLabel')}</label>
                  <input
                    type="text"
                    value={draft.modelId}
                    onChange={(e) =>
                      setDrafts((current) => ({
                        ...current,
                        [capability]: { ...draft, modelId: e.target.value },
                      }))
                    }
                    placeholder={saved?.modelId ?? t(`capability_${capability}_model_placeholder`)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {saved?.modelId ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{t('currentProvider', { provider: selectedProvider?.label ?? saved.providerId ?? '-' })}</p>
                    <p>{t('currentModelId', { modelId: saved.modelId })}</p>
                    {saved.baseUrl ? <p>{t('currentBaseUrl', { baseUrl: saved.baseUrl })}</p> : null}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      saveMutation.mutate({
                        capability,
                        payload: {
                          ...draft,
                          providerKind:
                            selectedProvider?.providerKind ?? draft.providerKind,
                        },
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
                    onClick={() => testMutation.mutate(capability)}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {t('testApiConfig')}
                  </button>

                  {saved?.isActive ? (
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(capability)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      {t('deleteApiConfig')}
                    </button>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
