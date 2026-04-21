/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 react 的 useEffect/useState，
 *          依赖 sonner 的 toast，
 *          依赖 @/hooks/use-workflows 的 useWorkflows / useImportLocalWorkflow，
 *          依赖 @/hooks/use-user 的 useCurrentUser，
 *          依赖 @tanstack/react-query 的 useQuery，依赖 @/lib/query/keys，
 *          依赖 @/i18n/navigation 的 Link，
 *          依赖 @/services/storage/local-storage 的 loadFromLocal / clearLocal，
 *          依赖 @/services/storage/serializer 的 serializeWorkflow，
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorksTab 我的作品 Tab (含收藏列表)
 * [POS]: profile 的作品列表 Tab，被 profile-modal.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Globe, Heart, Import, Lock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { useImportLocalWorkflow, useWorkflows } from '@/hooks/use-workflows'
import { useCurrentUser } from '@/hooks/use-user'
import { queryKeys } from '@/lib/query/keys'
import { clearLocal, loadFromLocal } from '@/services/storage/local-storage'
import { serializeWorkflow } from '@/services/storage/serializer'

/* ─── Sub-Tabs ───────────────────────────────────────────── */

type SubTab = 'all' | 'shared' | 'favorites'

/* ─── Favorites Fetcher ──────────────────────────────────── */

function useFavorites() {
  return useQuery({
    queryKey: [...queryKeys.workflows.all, 'favorites'] as const,
    queryFn: async () => {
      const res = await fetch('/api/workflows/favorites')
      if (!res.ok) throw new Error('Failed to fetch favorites')
      const json = await res.json()
      return json.data as { items: Array<Record<string, unknown>> }
    },
  })
}

/* ─── Workflow Item ──────────────────────────────────────── */

function WorkflowItem({ w, isFav }: { w: Record<string, unknown>; isFav?: boolean }) {
  return (
    <Link
      href={isFav ? `/explore/${w.id}` : `/workspace/${w.id}`}
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
    >
      {isFav ? (
        <Heart size={14} className="text-rose-500" />
      ) : w.is_public === 1 ? (
        <Globe size={14} className="text-emerald-500" />
      ) : (
        <Lock size={14} className="text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {w.name as string}
        </p>
        <p className="text-xs text-muted-foreground">
          {isFav && w.author_name
            ? (w.author_name as string)
            : (w.updated_at as string)}
        </p>
      </div>
    </Link>
  )
}

/* ─── Component ──────────────────────────────────────────── */

export function WorksTab() {
  const t = useTranslations('profileWorks')
  const [subTab, setSubTab] = useState<SubTab>('all')
  const [localDraft, setLocalDraft] = useState<ReturnType<typeof loadFromLocal> | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return loadFromLocal()
  })
  const { data, isLoading } = useWorkflows()
  const { data: user } = useCurrentUser()
  const { data: favData, isLoading: favLoading } = useFavorites()
  const importLocalWorkflow = useImportLocalWorkflow()

  const response = data as { items?: Array<Record<string, unknown>> } | undefined
  const workflows = response?.items ?? []

  const filtered = subTab === 'shared'
    ? workflows.filter((w) => w.is_public === 1)
    : subTab === 'favorites'
      ? (favData?.items ?? [])
      : workflows

  const loading = subTab === 'favorites' ? favLoading : isLoading

  const handleImportLocal = async () => {
    if (!localDraft) return

    try {
      const serialized = serializeWorkflow(
        localDraft.nodes,
        localDraft.edges,
        localDraft.viewport,
        localDraft.name,
      )

      await importLocalWorkflow.mutateAsync({
        name: localDraft.name || 'Imported Workflow',
        description: t('importDescription'),
        data: JSON.stringify(serialized),
      })

      clearLocal()
      setLocalDraft(null)
      toast.success(t('importSuccess', { name: localDraft.name || t('importedDraftFallback') }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('importFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{t('title')}</h3>

      {localDraft && localDraft.nodes.length > 0 && (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('localDraftTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {user?.isAuthenticated
                  ? t('localDraftBodySignedIn', {
                      name: localDraft.name || t('importedDraftFallback'),
                      count: localDraft.nodes.length,
                    })
                  : t('localDraftBodyGuest', {
                      name: localDraft.name || t('importedDraftFallback'),
                    })}
              </p>
            </div>

            {user?.isAuthenticated ? (
              <button
                type="button"
                onClick={handleImportLocal}
                disabled={importLocalWorkflow.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importLocalWorkflow.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Import size={14} />
                )}
                {t('importAction')}
              </button>
            ) : (
              <Link
                href="/sign-in?redirect_url=/account"
                className="inline-flex items-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                {t('signInToImport')}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 子 Tab */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['all', 'shared', 'favorites'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              subTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <WorkflowItem
              key={w.id as string}
              w={w}
              isFav={subTab === 'favorites'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
