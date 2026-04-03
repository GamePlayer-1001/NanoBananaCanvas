/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @tanstack/react-query 的 query/mutation，
 *          依赖 sonner 的 toast，依赖 @/lib/query/keys
 * [OUTPUT]: 对外提供 ModelPreferencesTab 模型偏好设置面板
 * [POS]: profile 的模型偏好 Tab，被 profile-modal.tsx 消费，负责管理服务端 user_api_keys 闭环
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Key, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

interface ApiKeyItem {
  id: string
  provider: string
  label: string | null
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string | null
}

interface ApiKeysResponse {
  ok: true
  data: {
    keys: ApiKeyItem[]
  }
}

/* ─── Provider Config ────────────────────────────────── */

const LLM_PROVIDER_CARDS = [
  {
    id: 'openrouter',
    titleKey: 'providerOpenRouter',
    descriptionKey: 'providerOpenRouterDesc',
    placeholder: 'sk-or-v1-...',
  },
  {
    id: 'deepseek',
    titleKey: 'providerDeepSeek',
    descriptionKey: 'providerDeepSeekDesc',
    placeholder: 'sk-...',
  },
  {
    id: 'gemini',
    titleKey: 'providerGemini',
    descriptionKey: 'providerGeminiDesc',
    placeholder: 'AIza...',
  },
] as const

/* ─── Request Helpers ────────────────────────────────── */

async function fetchApiKeys(): Promise<ApiKeyItem[]> {
  const res = await fetch('/api/settings/api-keys', { cache: 'no-store' })
  const payload = (await res.json()) as ApiKeysResponse | { error?: { message?: string } }
  if (!res.ok || !('data' in payload)) {
    throw new Error(payload.error?.message ?? 'Failed to load API keys')
  }
  return payload.data.keys
}

async function saveApiKey(provider: string, apiKey: string) {
  const res = await fetch(`/api/settings/api-keys?provider=${provider}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
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

/* ─── Component ──────────────────────────────────────── */

export function ModelPreferencesTab() {
  const t = useTranslations('profile')
  const queryClient = useQueryClient()
  const [drafts, setDrafts] = useState<Record<string, string>>({})

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
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      saveApiKey(provider, apiKey),
    onSuccess: async (_data, variables) => {
      setDrafts((current) => ({ ...current, [variables.provider]: '' }))
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
      setDrafts((current) => ({ ...current, [provider]: '' }))
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
        <p className="text-sm leading-6 text-muted-foreground">
          {t('modelPreferencesDesc')}
        </p>
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
          {LLM_PROVIDER_CARDS.map((provider) => {
            const saved = savedKeys.get(provider.id)
            const draft = drafts[provider.id] ?? ''
            const isSaving = saveMutation.isPending && saveMutation.variables?.provider === provider.id
            const isTesting = testMutation.isPending && testMutation.variables === provider.id
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === provider.id

            return (
              <section
                key={provider.id}
                className="space-y-4 rounded-xl border border-border bg-background p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Key size={14} />
                      {t(provider.titleKey)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t(provider.descriptionKey)}
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
                  <label className="text-sm font-medium text-foreground">
                    {t('apiKeyLabel')}
                  </label>
                  <input
                    type="password"
                    value={draft}
                    onChange={(e) =>
                      setDrafts((current) => ({ ...current, [provider.id]: e.target.value }))
                    }
                    placeholder={provider.placeholder}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {saved ? t('configuredHint') : t('saveHint')}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      saveMutation.mutate({ provider: provider.id, apiKey: draft.trim() })
                    }
                    disabled={!draft.trim() || isSaving || isTesting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {t('saveApiKey')}
                  </button>

                  <button
                    type="button"
                    onClick={() => testMutation.mutate(provider.id)}
                    disabled={!saved || isSaving || isTesting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    {t('testApiKey')}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(provider.id)}
                    disabled={!saved || isSaving || isTesting || isDeleting}
                    className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {t('deleteApiKey')}
                  </button>
                </div>

                {saved?.lastUsedAt ? (
                  <p className="text-xs text-muted-foreground">
                    {t('lastUsedAt', { date: saved.lastUsedAt })}
                  </p>
                ) : null}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
