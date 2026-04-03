/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @tanstack/react-query 的 query/mutation，
 *          依赖 sonner 的 toast，依赖 @/lib/query/keys
 * [OUTPUT]: 对外提供 ModelPreferencesTab 模型偏好设置面板
 * [POS]: profile 的模型偏好 Tab，被 profile-modal.tsx 消费，负责管理账号级模型配置槽位
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Key, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { queryKeys } from '@/lib/query/keys'

interface ApiKeyItem {
  id: string
  provider: string
  label: string | null
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string | null
  slotId?: string
  capability?: string
  providerKind?: string
  modelId?: string
  baseUrl?: string
}

interface ApiKeysResponse {
  ok: true
  data: {
    keys: ApiKeyItem[]
  }
}

const MODEL_CONFIG_CARDS = [
  {
    id: 'llm-openai',
    titleKey: 'slotLlmOpenAI',
    descriptionKey: 'slotLlmOpenAIDesc',
    placeholder: 'sk-or-v1-...',
    showBaseUrl: true,
  },
  {
    id: 'image-openai',
    titleKey: 'slotImageOpenAI',
    descriptionKey: 'slotImageOpenAIDesc',
    placeholder: 'sk-or-v1-...',
    showBaseUrl: true,
  },
  {
    id: 'image-google',
    titleKey: 'slotImageGoogle',
    descriptionKey: 'slotImageGoogleDesc',
    placeholder: 'AIza...',
    showBaseUrl: false,
  },
] as const

type SlotId = (typeof MODEL_CONFIG_CARDS)[number]['id']

interface DraftState {
  apiKey: string
  baseUrl: string
  modelId: string
}

async function fetchApiKeys(): Promise<ApiKeyItem[]> {
  const res = await fetch('/api/settings/api-keys', { cache: 'no-store' })
  const payload = (await res.json()) as ApiKeysResponse | { error?: { message?: string } }
  if (!res.ok || !('data' in payload)) {
    const errorMessage = 'error' in payload ? payload.error?.message : undefined
    throw new Error(errorMessage ?? 'Failed to load API keys')
  }
  return payload.data.keys
}

async function saveApiKey(
  provider: string,
  apiKey: string,
  modelId: string,
  baseUrl?: string,
) {
  const res = await fetch(`/api/settings/api-keys?provider=${provider}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, modelId, baseUrl }),
  })

  const payload = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(payload.error?.message ?? 'Failed to save API key')
  }
}

async function testApiKey(provider: string) {
  const res = await fetch(`/api/settings/api-keys/${provider}`, { method: 'POST' })
  const payload = (await res.json()) as {
    data?: { valid?: boolean }
    error?: { message?: string }
  }
  if (!res.ok) {
    throw new Error(payload.error?.message ?? 'Failed to test API key')
  }
  if (!payload.data?.valid) {
    throw new Error('API key validation failed')
  }
}

async function deleteApiKey(provider: string) {
  const res = await fetch(`/api/settings/api-keys/${provider}`, { method: 'DELETE' })
  const payload = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(payload.error?.message ?? 'Failed to delete API key')
  }
}

export function ModelPreferencesTab() {
  const t = useTranslations('profile')
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})

  const apiKeysQuery = useQuery({
    queryKey: queryKeys.settings.apiKeys(),
    queryFn: fetchApiKeys,
  })

  const savedKeys = useMemo(
    () => new Map((apiKeysQuery.data ?? []).map((item) => [item.provider, item])),
    [apiKeysQuery.data],
  )

  const invalidateKeys = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings.apiKeys() })
  }

  const saveMutation = useMutation({
    mutationFn: ({
      provider,
      apiKey,
      modelId,
      baseUrl,
    }: {
      provider: string
      apiKey: string
      modelId: string
      baseUrl?: string
    }) => saveApiKey(provider, apiKey, modelId, baseUrl),
    onSuccess: async (_data, variables) => {
      setDrafts((current) => ({
        ...current,
        [variables.provider]: { apiKey: '', baseUrl: '', modelId: '' },
      }))
      await invalidateKeys()
      toast.success(t('apiKeySaved'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('apiKeySaveFailed'))
    },
  })

  const testMutation = useMutation({
    mutationFn: (provider: string) => testApiKey(provider),
    onSuccess: async () => {
      await invalidateKeys()
      toast.success(t('apiKeyTestPassed'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('apiKeyTestFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (provider: string) => deleteApiKey(provider),
    onSuccess: async (_data, provider) => {
      setDrafts((current) => ({
        ...current,
        [provider]: { apiKey: '', baseUrl: '', modelId: '' },
      }))
      await invalidateKeys()
      toast.success(t('apiKeyDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('apiKeyDeleteFailed'))
    },
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{t('modelPreferences')}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{t('modelPreferencesDesc')}</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 text-brand-500" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t('apiKeySecurityTitle')}</p>
            <p>{t('apiKeySecurityBody')}</p>
          </div>
        </div>
      </div>

      {apiKeysQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          {t('apiKeyLoading')}
        </div>
      ) : (
        <div className="space-y-4">
          {MODEL_CONFIG_CARDS.map((card) => {
            const saved = savedKeys.get(card.id)
            const draft = drafts[card.id] ?? { apiKey: '', baseUrl: '', modelId: '' }
            const isSaving = saveMutation.isPending && saveMutation.variables?.provider === card.id
            const isTesting = testMutation.isPending && testMutation.variables === card.id
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === card.id

            return (
              <section
                key={card.id}
                className="space-y-4 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Key size={14} />
                      {t(card.titleKey)}
                    </div>
                    <p className="text-sm text-muted-foreground">{t(card.descriptionKey)}</p>
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
                  <label className="text-sm font-medium text-foreground">{t('apiKeyLabel')}</label>
                  <input
                    type="password"
                    value={draft.apiKey}
                    onChange={(e) =>
                      setDrafts((current) => ({
                        ...current,
                        [card.id]: {
                          ...draft,
                          apiKey: e.target.value,
                        },
                      }))
                    }
                    placeholder={card.placeholder}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {saved ? t('configuredHint') : t('saveHint')}
                  </p>
                </div>

                {card.showBaseUrl ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">{t('baseUrlLabel')}</label>
                    <input
                      type="url"
                      value={draft.baseUrl}
                      onChange={(e) =>
                        setDrafts((current) => ({
                          ...current,
                          [card.id]: {
                            ...draft,
                            baseUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder={saved?.baseUrl ?? 'https://openrouter.ai/api/v1'}
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
                        [card.id]: {
                          ...draft,
                          modelId: e.target.value,
                        },
                      }))
                    }
                    placeholder={saved?.modelId ?? getDefaultModelPlaceholder(card.id)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      saveMutation.mutate({
                        provider: card.id,
                        apiKey: draft.apiKey.trim(),
                        modelId: draft.modelId.trim() || saved?.modelId || '',
                        baseUrl: card.showBaseUrl
                          ? draft.baseUrl.trim() || saved?.baseUrl || ''
                          : undefined,
                      })
                    }
                    disabled={
                      !draft.apiKey.trim() ||
                      !(draft.modelId.trim() || saved?.modelId) ||
                      (card.showBaseUrl && !(draft.baseUrl.trim() || saved?.baseUrl)) ||
                      isSaving ||
                      isTesting ||
                      isDeleting
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {t('saveApiKey')}
                  </button>

                  <button
                    type="button"
                    onClick={() => testMutation.mutate(card.id)}
                    disabled={!saved || isSaving || isTesting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {t('testApiKey')}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(card.id)}
                    disabled={!saved || isSaving || isTesting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {t('deleteApiKey')}
                  </button>
                </div>

                {saved?.lastUsedAt ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{t('currentModelId', { modelId: saved.modelId ?? '-' })}</p>
                    {saved.baseUrl ? <p>{t('currentBaseUrl', { baseUrl: saved.baseUrl })}</p> : null}
                    <p>{t('lastUsedAt', { date: saved.lastUsedAt })}</p>
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getDefaultModelPlaceholder(slotId: SlotId): string {
  switch (slotId) {
    case 'llm-openai':
      return 'openai/gpt-4o-mini'
    case 'image-openai':
      return 'openai/dall-e-3'
    case 'image-google':
      return 'imagen-3.0-generate-002'
    default:
      return ''
  }
}
