/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 react 的 useMemo/useState，
 *          依赖 @tanstack/react-query 的 useMutation/useQuery/useQueryClient，
 *          依赖 sonner 的 toast，依赖 @/hooks/use-workflows 的 useWorkflows /
 *          useImportLocalWorkflow / useDeleteWorkflow，依赖 @/i18n/navigation 的 Link，
 *          依赖 @/lib/query/keys，依赖 @/services/storage/local-storage 与 serializer，
 *          依赖 @/components/ui/progress，依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 WorksTab 我的作品面板，含工作流/生成作品/已发布/收藏四主页签、多选删除与本地草稿导入
 * [POS]: profile 的作品管理 Tab，被账户页消费，负责收口个人作品检索、生成结果管理与本地草稿导入
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 账户内私有文件经 /api/files 鉴权返回，直接渲染最稳定。 */

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckSquare,
  GlobeLock,
  Globe,
  ImageIcon,
  Import,
  Loader2,
  Lock,
  PlayCircle,
  Square,
  Trash2,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import {
  useDeleteWorkflow,
  useImportLocalWorkflow,
  useWorkflows,
} from '@/hooks/use-workflows'
import { queryKeys } from '@/lib/query/keys'
import { clearLocal, loadFromLocal } from '@/services/storage/local-storage'
import { serializeWorkflow } from '@/services/storage/serializer'
import { PublishOutputDialog } from './publish-output-dialog'

type WorksView = 'workflow' | 'generated' | 'published' | 'favorites'
type GeneratedView = 'image' | 'video'
const GENERATED_WORKS_LIMIT = 50

interface WorkflowListItem {
  id: string
  name: string
  is_public: number
  updated_at?: string
  thumbnail?: string
  author_name?: string
}

interface GeneratedOutputPayload {
  url?: string
  fileName?: string
  contentType?: string
  r2_key?: string
}

interface GeneratedTaskItem {
  id: string
  taskType: 'image_gen' | 'video_gen' | 'audio_gen'
  provider: string
  modelId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  completedAt: string | null
  input?: Record<string, unknown>
  output: GeneratedOutputPayload | null
}

interface PublishedOutputListItem {
  id: string
  title: string
  description?: string
  prompt?: string
  source_url?: string
  thumbnail?: string
  media_url?: string
  media_type?: 'image' | 'video'
  like_count?: number
  clone_count?: number
  view_count?: number
  published_at?: string
  created_at?: string
}

function renderPublishedOutputPreview(item: PublishedOutputListItem) {
  const isVideo = item.media_type === 'video'

  if (item.thumbnail) {
    return (
      <img
        src={item.thumbnail}
        alt={item.title}
        className="h-full w-full object-cover"
      />
    )
  }

  if (isVideo && item.media_url) {
    return (
      <video
        src={item.media_url}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="auto"
      />
    )
  }

  if (item.media_url) {
    return <img src={item.media_url} alt={item.title} className="h-full w-full object-cover" />
  }

  return null
}

type SelectionKind =
  | 'workflow'
  | 'favorite'
  | 'generated'
  | 'published-workflow'
  | 'published-output'

function makeSelectionKey(kind: SelectionKind, id: string) {
  return `${kind}:${id}`
}

function useFavorites(enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.workflows.all, 'favorites'] as const,
    queryFn: async () => {
      const res = await fetch('/api/workflows/favorites')
      if (!res.ok) throw new Error('Failed to fetch favorites')
      const json = await res.json()
      return (json.data as { items: WorkflowListItem[] }).items ?? []
    },
    enabled,
  })
}

function useGeneratedWorks(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tasks.list({ status: 'completed', limit: GENERATED_WORKS_LIMIT }),
    queryFn: async () => {
      const res = await fetch(`/api/tasks?status=completed&limit=${GENERATED_WORKS_LIMIT}`)
      if (!res.ok) throw new Error('Failed to fetch generated works')
      const json = await res.json()
      const data = json.data as { tasks: GeneratedTaskItem[] }
      return data.tasks ?? []
    },
    enabled,
  })
}

function usePublishedOutputs(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.explore.outputs(),
    queryFn: async () => {
      const res = await fetch('/api/explore/outputs')
      if (!res.ok) throw new Error('Failed to fetch published outputs')
      const json = await res.json()
      return (json.data as { items: PublishedOutputListItem[] }).items ?? []
    },
    enabled,
  })
}

function isAlreadyDeletedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return /not found/i.test(error.message)
}

async function toggleFavorite(workflowId: string) {
  const res = await fetch(`/api/workflows/${workflowId}/favorite`, {
    method: 'POST',
  })
  const payload = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(payload.error?.message ?? 'Failed to update favorite')
  }
}

async function deleteGeneratedWorks(ids: string[]) {
  const res = await fetch('/api/tasks', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  const payload = (await res.json()) as { error?: { message?: string } }
  if (!res.ok) {
    throw new Error(payload.error?.message ?? 'Failed to delete generated works')
  }
}

function WorkflowItem({
  item,
  selected,
  onToggle,
  href,
  meta,
  actions,
}: {
  item: WorkflowListItem
  selected: boolean
  onToggle: (id: string) => void
  href: string
  meta: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="rounded-md border border-border p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        aria-label={selected ? 'unselect' : 'select'}
      >
        {selected ? <CheckSquare size={16} className="text-brand-600" /> : <Square size={16} />}
      </button>

      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : item.is_public === 1 ? (
            <Globe size={16} className="text-emerald-500" />
          ) : (
            <Lock size={16} className="text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{meta}</p>
        </div>
      </Link>

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

function GeneratedWorkItem({
  item,
  selected,
  onToggle,
  selectionKey,
  title,
  onPublish,
}: {
  item: GeneratedTaskItem
  selected: boolean
  onToggle: (id: string) => void
  selectionKey: string
  title: string
  onPublish: (item: GeneratedTaskItem) => void
}) {
  const mediaUrl = item.output?.url
  const isVideo = item.taskType === 'video_gen'

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="relative aspect-video bg-muted">
        {mediaUrl ? (
          isVideo ? (
            <video src={mediaUrl} className="h-full w-full object-cover" controls playsInline />
          ) : (
            <img src={mediaUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {isVideo ? <Video size={22} /> : <ImageIcon size={22} />}
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggle(selectionKey)}
          className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/55 p-2 text-white transition hover:bg-black/70"
          aria-label={selected ? 'unselect generated work' : 'select generated work'}
        >
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isVideo ? <PlayCircle size={13} /> : <ImageIcon size={13} />}
          <span>{title}</span>
        </div>
        <p className="truncate text-sm font-medium text-foreground">
          {item.output?.fileName || item.modelId}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {item.provider} · {item.modelId}
        </p>
        <button
          type="button"
          onClick={() => onPublish(item)}
          className="mt-3 inline-flex items-center rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          公开到广场
        </button>
      </div>
    </article>
  )
}

export function WorksTab({
  isAuthenticated,
}: {
  isAuthenticated: boolean
}) {
  const t = useTranslations('profileWorks')
  const queryClient = useQueryClient()
  const [view, setView] = useState<WorksView>('workflow')
  const [generatedView, setGeneratedView] = useState<GeneratedView>('image')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [publishingItem, setPublishingItem] = useState<GeneratedTaskItem | null>(null)
  const [localDraft, setLocalDraft] = useState<ReturnType<typeof loadFromLocal> | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    return loadFromLocal()
  })

  const { data: workflowData, isLoading: workflowsLoading } = useWorkflows(undefined, {
    enabled: isAuthenticated,
  })
  const { data: favoriteItems = [], isLoading: favoritesLoading } = useFavorites(isAuthenticated)
  const { data: generatedItems = [], isLoading: generatedLoading } = useGeneratedWorks(isAuthenticated)
  const { data: publishedOutputItems = [], isLoading: publishedOutputsLoading } = usePublishedOutputs(
    isAuthenticated,
  )
  const importLocalWorkflow = useImportLocalWorkflow()
  const deleteWorkflow = useDeleteWorkflow()

  const workflowItems = useMemo(
    () => ((workflowData as { items?: WorkflowListItem[] } | undefined)?.items ?? []),
    [workflowData],
  )
  const publishedItems = workflowItems.filter((item) => item.is_public === 1)
  const isPublishedView = view === 'published'
  const filteredGeneratedItems = generatedItems.filter((item) =>
    generatedView === 'image' ? item.taskType === 'image_gen' : item.taskType === 'video_gen',
  )

  const visibleIds = useMemo(() => {
    switch (view) {
      case 'workflow':
        return workflowItems.map((item) => makeSelectionKey('workflow', item.id))
      case 'published':
        return [
          ...publishedItems.map((item) => makeSelectionKey('published-workflow', item.id)),
          ...publishedOutputItems.map((item) => makeSelectionKey('published-output', item.id)),
        ]
      case 'favorites':
        return favoriteItems.map((item) => makeSelectionKey('favorite', item.id))
      case 'generated':
        return filteredGeneratedItems.map((item) => makeSelectionKey('generated', item.id))
      default:
        return []
    }
  }, [favoriteItems, filteredGeneratedItems, publishedItems, publishedOutputItems, view, workflowItems])

  const loading =
    isAuthenticated &&
    (view === 'favorites'
      ? favoritesLoading
      : view === 'generated'
        ? generatedLoading
        : view === 'published'
          ? workflowsLoading || publishedOutputsLoading
        : workflowsLoading)

  const visibleCount = visibleIds.length
  const selectedCount = selectedIds.filter((id) => visibleIds.includes(id)).length
  const invalidateWorks = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.explore.outputs() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.explore.all }),
    ])
  }

  const bulkFavoriteDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => toggleFavorite(id)))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.workflows.all, 'favorites'] as const,
      })
      setSelectedIds([])
      toast.success(t('bulkFavoritesDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('bulkDeleteFailed'))
    },
  })

  const bulkGeneratedDelete = useMutation({
    mutationFn: deleteGeneratedWorks,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })
      setSelectedIds([])
      toast.success(t('bulkGeneratedDeleted'))
    },
    onError: (error: Error) => {
      toast.error(error.message || t('bulkDeleteFailed'))
    },
  })

  const handleUnpublishSingle = async (workflowId: string) => {
    try {
      await fetch(`/api/workflows/${workflowId}/publish`, { method: 'DELETE' }).then(async (res) => {
        if (!res.ok) {
          const payload = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
          throw new Error(payload.error?.message ?? 'Failed to unpublish workflow')
        }
      })
      await invalidateWorks()
      toast.success(t('unpublishedSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('unpublishedFailed'))
    }
  }

  const handleUnpublishOutputSingle = async (outputId: string) => {
    try {
      const res = await fetch(`/api/explore/outputs/${outputId}`, { method: 'DELETE' })
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(payload.error?.message ?? 'Failed to unpublish output')
      }
      await invalidateWorks()
      toast.success(t('unpublishedSuccess'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('unpublishedFailed'))
    }
  }

  const handleToggleSelection = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const handleSelectAllVisible = () => {
    setSelectedIds(Array.from(new Set([...selectedIds, ...visibleIds])))
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleDeleteSelected = async () => {
    const ids = selectedIds.filter((id) => visibleIds.includes(id))
    if (!ids.length) {
      return
    }

    try {
      if (view === 'generated') {
        await bulkGeneratedDelete.mutateAsync(ids.map((id) => id.replace(/^generated:/, '')))
        return
      }

      if (view === 'favorites') {
        await bulkFavoriteDelete.mutateAsync(ids.map((id) => id.replace(/^favorite:/, '')))
        return
      }

      if (view === 'published') {
        const workflowIds = ids
          .filter((id) => id.startsWith('published-workflow:'))
          .map((id) => id.replace(/^published-workflow:/, ''))
        const outputIds = ids
          .filter((id) => id.startsWith('published-output:'))
          .map((id) => id.replace(/^published-output:/, ''))

        const workflowResponses = await Promise.all(
          workflowIds.map((id) => fetch(`/api/workflows/${id}/publish`, { method: 'DELETE' })),
        )
        const outputResponses = await Promise.all(
          outputIds.map((id) => fetch(`/api/explore/outputs/${id}`, { method: 'DELETE' })),
        )

        const failedResponse = [...workflowResponses, ...outputResponses].find((res) => !res.ok)
        if (failedResponse) {
          const payload = (await failedResponse.json().catch(() => ({}))) as {
            error?: { message?: string }
          }
          throw new Error(payload.error?.message ?? 'Failed to unpublish selected works')
        }

        await invalidateWorks()
        setSelectedIds([])
        toast.success(t('bulkPublishedDeleted'))
        return
      }

      const deleteResults = await Promise.allSettled(
        ids.map((id) => deleteWorkflow.mutateAsync(id.replace(/^workflow:/, ''))),
      )
      const firstFailure = deleteResults.find(
        (result) =>
          result.status === 'rejected' && !isAlreadyDeletedError(result.reason),
      )

      if (firstFailure && firstFailure.status === 'rejected') {
        throw firstFailure.reason
      }

      await invalidateWorks()
      setSelectedIds([])
      toast.success(t('bulkWorkflowsDeleted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('bulkDeleteFailed'))
    }
  }

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

  const selectedDeleteLabel =
    view === 'generated'
      ? t('bulkDeleteGenerated')
      : view === 'favorites'
        ? t('bulkDeleteFavorites')
        : view === 'published'
          ? t('bulkDeletePublished')
          : t('bulkDeleteWorks')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{t('title')}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{t('description')}</p>
      </div>

      {localDraft && localDraft.nodes.length > 0 ? (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{t('localDraftTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated
                  ? t('localDraftBodySignedIn', {
                      name: localDraft.name || t('importedDraftFallback'),
                      count: localDraft.nodes.length,
                    })
                  : t('localDraftBodyGuest', {
                      name: localDraft.name || t('importedDraftFallback'),
                    })}
              </p>
            </div>

            {isAuthenticated ? (
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
      ) : null}

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(['workflow', 'generated', 'published', 'favorites'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setView(tab)
                setSelectedIds([])
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                view === tab
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {view === 'generated' ? (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-background p-2">
            {(['image', 'video'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setGeneratedView(tab)
                  setSelectedIds([])
                }}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  generatedView === tab
                    ? 'bg-brand-600 text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {t(`generated_${tab}`)}
              </button>
            ))}
          </div>
        ) : null}

        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-sm text-foreground">
              {t('selectedSummary', { count: selectedCount })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                {t('selectAllVisible')}
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {t('clearSelection')}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteSelected()
                }}
                disabled={
                  deleteWorkflow.isPending ||
                  bulkFavoriteDelete.isPending ||
                  bulkGeneratedDelete.isPending
                }
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={14} />
                {selectedDeleteLabel}
              </button>
            </div>
          </div>
        ) : visibleCount > 0 ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSelectAllVisible}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
            >
              {t('startMultiSelect')}
            </button>
          </div>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-semibold text-amber-950">{t('guestTitle')}</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">{t('guestBody')}</p>
          <Link
            href="/sign-in?redirect_url=/account"
            className="mt-4 inline-flex rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            {t('signInToViewWorks')}
          </Link>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'generated' ? (
        filteredGeneratedItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t('emptyGenerated')}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGeneratedItems.map((item) => (
              <GeneratedWorkItem
                key={item.id}
                item={item}
                selected={selectedIds.includes(makeSelectionKey('generated', item.id))}
                selectionKey={makeSelectionKey('generated', item.id)}
                onToggle={handleToggleSelection}
                title={t(item.taskType === 'image_gen' ? 'generated_image' : 'generated_video')}
                onPublish={setPublishingItem}
              />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {isPublishedView
            ? publishedItems.length === 0 && publishedOutputItems.length === 0
            : (view === 'workflow' ? workflowItems : favoriteItems).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {isPublishedView
                ? t('emptyPublished')
                : view === 'workflow'
                ? t('emptyWorkflow')
                : t('emptyFavorites')}
            </p>
          ) : isPublishedView ? (
            <>
              {publishedItems.map((item) => (
              <WorkflowItem
                key={item.id}
                item={item}
                selected={selectedIds.includes(makeSelectionKey('published-workflow', item.id))}
                onToggle={(id) => handleToggleSelection(makeSelectionKey('published-workflow', id))}
                href={`/workspace/${item.id}`}
                meta={t('publishedMeta')}
                actions={(
                  <button
                    type="button"
                    onClick={() => {
                      void handleUnpublishSingle(item.id)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
                  >
                    <GlobeLock size={13} />
                    {t('unpublishAction')}
                  </button>
                )}
              />
              ))}

              {publishedOutputItems.map((item) => (
                <PublishedOutputItem
                  key={item.id}
                  item={item}
                  selected={selectedIds.includes(makeSelectionKey('published-output', item.id))}
                  selectionKey={makeSelectionKey('published-output', item.id)}
                  onToggle={handleToggleSelection}
                  onUnpublish={(id) => {
                    void handleUnpublishOutputSingle(id)
                  }}
                  labels={{
                    video: t('generated_video'),
                    image: t('generated_image'),
                    prompt: t('publishOutputPrompt'),
                    source: t('publishOutputSourceUrl'),
                    views: t('publishedViewsLabel'),
                    likes: t('publishedLikesLabel'),
                    unpublish: t('unpublishAction'),
                  }}
                />
              ))}
            </>
          ) : (
            (view === 'workflow' ? workflowItems : favoriteItems).map((item) => (
              <WorkflowItem
                key={item.id}
                item={item}
                selected={selectedIds.includes(
                  makeSelectionKey(view === 'workflow' ? 'workflow' : 'favorite', item.id),
                )}
                onToggle={(id) =>
                  handleToggleSelection(makeSelectionKey(view === 'workflow' ? 'workflow' : 'favorite', id))
                }
                href={view === 'favorites' ? `/explore/${item.id}` : `/workspace/${item.id}`}
                meta={
                  view === 'favorites'
                    ? item.author_name || t('metaUnknownAuthor')
                    : item.updated_at || t('metaUnknownDate')
                }
              />
            ))
          )}
        </div>
      )}

      {publishingItem ? (
        <PublishOutputDialog
          taskId={publishingItem.id}
          defaultTitle={publishingItem.output?.fileName || publishingItem.modelId}
          defaultPrompt={String(publishingItem.input?.prompt ?? '')}
          defaultThumbnail={publishingItem.output?.url}
          open={!!publishingItem}
          onOpenChange={(open) => {
            if (!open) setPublishingItem(null)
          }}
        />
      ) : null}
    </div>
  )
}

function PublishedOutputItem({
  item,
  selected,
  selectionKey,
  onToggle,
  onUnpublish,
  labels,
}: {
  item: PublishedOutputListItem
  selected: boolean
  selectionKey: string
  onToggle: (id: string) => void
  onUnpublish: (id: string) => void
  labels: {
    video: string
    image: string
    prompt: string
    source: string
    views: string
    likes: string
    unpublish: string
  }
}) {
  const isVideo = item.media_type === 'video'

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 md:flex-row">
      <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted md:w-44">
        <Link href={`/explore/${item.id}`} className="block aspect-[4/3]">
          {renderPublishedOutputPreview(item) ?? (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {isVideo ? <Video size={22} /> : <ImageIcon size={22} />}
            </div>
          )}

          {isVideo ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm">
                <PlayCircle size={18} className="ml-0.5" />
              </div>
            </div>
          ) : null}
        </Link>

        <button
          type="button"
          onClick={() => onToggle(selectionKey)}
          className="absolute left-3 top-3 rounded-full border border-white/40 bg-black/55 p-2 text-white transition hover:bg-black/70"
          aria-label={selected ? 'unselect published output' : 'select published output'}
        >
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isVideo ? <PlayCircle size={13} /> : <ImageIcon size={13} />}
              <span>{isVideo ? labels.video : labels.image}</span>
            </div>
            <Link href={`/explore/${item.id}`} className="block">
              <p className="truncate text-sm font-medium text-foreground hover:text-brand-600">
                {item.title}
              </p>
            </Link>
            {item.description ? (
              <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onUnpublish(item.id)}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
          >
            <GlobeLock size={13} />
            {labels.unpublish}
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {item.view_count ?? 0} {labels.views}
          </span>
          <span>
            {item.like_count ?? 0} {labels.likes}
          </span>
        </div>

        {item.prompt ? (
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {labels.prompt} · {item.prompt}
          </p>
        ) : null}

        {item.source_url ? (
          <p className="truncate text-xs text-muted-foreground">
            {labels.source} · {item.source_url}
          </p>
        ) : null}
      </div>
    </article>
  )
}
