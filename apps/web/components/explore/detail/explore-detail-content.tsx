/**
 * [INPUT]: 依赖 @/hooks/use-explore 的 useExploreDetail，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 ./workflow-preview, ./author-info, ./action-buttons, ./report-dialog
 * [OUTPUT]: 对外提供 ExploreDetailContent 客户端交互容器
 * [POS]: explore/detail 的主容器，被 explore/[id]/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 公开详情里的用户作品媒体地址来自运行时资源，图片/视频混合展示时直接使用原生标签最稳。 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowLeft,
  Bookmark,
  Check,
  Clapperboard,
  Copy,
  Eye,
  Flag,
  Heart,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

import { Link } from '@/i18n/navigation'
import { useExploreDetail } from '@/hooks/use-explore'
import { WorkflowPreview } from './workflow-preview'
import { AuthorInfo } from './author-info'
import { ActionButtons } from './action-buttons'
import { ReportDialog } from './report-dialog'

/* ─── Types ──────────────────────────────────────────── */

interface WorkflowDetail {
  entity_type?: 'workflow' | 'output'
  id: string
  name: string
  description?: string
  data?: string
  prompt?: string
  source_url?: string
  source_mode?: 'task' | 'import'
  source_type?: 'native' | 'civitai' | 'manual' | 'other'
  source_author_name?: string
  source_author_avatar?: string
  workflow_json_url?: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail?: string
  author_name?: string | null
  author_avatar?: string
  author_membership_status?: string | null
  author_total_likes?: number
  author_total_favorites?: number
  author_total_views?: number
  published_at?: string
  view_count: number
  like_count: number
  clone_count: number
  liked: boolean
  favorited: boolean
}

interface ExploreDetailContentProps {
  workflowId: string
}

/* ─── Helpers ────────────────────────────────────────── */

function buildDownloadFileName(workflow: WorkflowDetail) {
  if (workflow.media_url) {
    return `${workflow.name}.${workflow.media_type === 'video' ? 'mp4' : 'jpg'}`
  }

  if (workflow.workflow_json_url) {
    return `${workflow.name}.json`
  }

  return undefined
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreDetailContent({ workflowId }: ExploreDetailContentProps) {
  const t = useTranslations('exploreDetail')
  const { data, isLoading } = useExploreDetail(workflowId)
  const showSourceCard = false
  const [reportOpen, setReportOpen] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{t('notFound')}</p>
        <Link href="/explore" className="text-sm text-brand-600 hover:underline">
          {t('backToExplore')}
        </Link>
      </div>
    )
  }

  const workflow = data as WorkflowDetail
  const authorName = workflow.author_name?.trim() || workflow.source_author_name?.trim() || 'Unknown Creator'
  const isOutput = workflow.entity_type === 'output'
  const sourceAuthorName = workflow.source_author_name?.trim()
  const customThumbnail =
    workflow.thumbnail && workflow.thumbnail !== workflow.media_url ? workflow.thumbnail : undefined
  const previewUrl = workflow.media_type === 'video' ? customThumbnail || workflow.media_url : workflow.media_url
  const contentTypeLabel = isOutput
    ? workflow.media_type === 'video'
      ? t('typeVideo')
      : t('typeImage')
    : t('typeWorkflow')
  const sourceBadge = workflow.source_type
    ? workflow.source_type.toUpperCase()
    : workflow.source_mode
      ? workflow.source_mode.toUpperCase()
      : t('publicAsset')
  const downloadUrl = workflow.media_url || workflow.workflow_json_url

  const handleCopyPrompt = async () => {
    if (!workflow.prompt) return

    try {
      await navigator.clipboard.writeText(workflow.prompt)
      setPromptCopied(true)
      toast.success(t('copied'))
      window.setTimeout(() => setPromptCopied(false), 2000)
    } catch {
      toast.error(t('actionFailed'))
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1560px] px-6 py-6 lg:px-8 lg:py-8">
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('backToExplore')}
      </Link>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1.08fr)_380px]">
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-stone-950 lg:text-[3rem]">
              {workflow.name}
            </h1>

            <div className="mt-4 flex flex-col gap-3 text-sm text-stone-500 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-medium text-stone-700">
                  <Clapperboard size={12} />
                  {contentTypeLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-medium text-stone-700">
                  <Sparkles size={12} />
                  {sourceBadge}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                <span className="inline-flex items-center gap-1.5 text-stone-500">
                  <Eye size={14} />
                  {workflow.view_count ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5 text-stone-500">
                  <Heart size={14} />
                  {workflow.like_count ?? 0}
                </span>
                <span className="inline-flex items-center gap-1.5 text-stone-500">
                  <Bookmark size={14} />
                  {workflow.clone_count ?? 0}
                </span>
              </div>
            </div>

            {workflow.description ? (
              <p className="mt-4 max-w-4xl text-base leading-7 text-stone-600">
                {workflow.description}
              </p>
            ) : null}
          </div>

          <div className="aspect-[16/10] overflow-hidden rounded-[32px] border border-stone-200/80 bg-muted shadow-[0_18px_48px_-32px_rgba(15,23,42,0.4)]">
            {isOutput ? (
              workflow.media_type === 'video' ? (
                workflow.media_url ? (
                  <video
                    poster={previewUrl}
                    src={workflow.media_url}
                    className="h-full w-full bg-black object-contain"
                    controls
                    playsInline
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {t('notFound')}
                  </div>
                )
              ) : workflow.media_url ? (
                <img
                  src={workflow.media_url}
                  alt={workflow.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {t('notFound')}
                </div>
              )
            ) : (
              <WorkflowPreview data={workflow.data} />
            )}
          </div>
        </div>

        <div className="space-y-5 xl:pt-[6px]">
          <AuthorInfo
            name={authorName}
            avatar={workflow.author_avatar}
            membershipStatus={workflow.author_membership_status}
            totalLikes={workflow.author_total_likes}
            totalFavorites={workflow.author_total_favorites}
            totalViews={workflow.author_total_views}
          />

          <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
            <ActionButtons
              workflowId={workflowId}
              entityType={workflow.entity_type}
              favorited={workflow.favorited ?? false}
              downloadUrl={downloadUrl}
              downloadFileName={buildDownloadFileName(workflow)}
            />
          </div>

          {isOutput && workflow.prompt ? (
            <div className="space-y-3">
              <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                    {t('prompt')}
                  </p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-900"
                    onClick={handleCopyPrompt}
                    aria-label={promptCopied ? t('copied') : t('copyResult')}
                    title={promptCopied ? t('copied') : t('copyResult')}
                  >
                    {promptCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-stone-900">
                  {workflow.prompt}
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 px-1 text-sm text-stone-500 underline-offset-4 transition-colors hover:text-stone-900 hover:underline"
                onClick={() => setReportOpen(true)}
              >
                <Flag size={15} />
                {t('report')}
              </button>
            </div>
          ) : null}

          {showSourceCard &&
          isOutput &&
          (workflow.source_url || sourceAuthorName || workflow.source_mode || workflow.source_type) ? (
            <div className="rounded-[28px] border border-stone-200/80 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                {t('sourceTitle')}
              </p>

              {sourceAuthorName ? (
                <div className="mb-3 flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-stone-50/80 p-3">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-stone-100">
                    {workflow.source_author_avatar ? (
                      <img
                        src={workflow.source_author_avatar}
                        alt={sourceAuthorName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-100 text-xs font-medium text-brand-600">
                        {sourceAuthorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-900">{sourceAuthorName}</p>
                    <p className="text-xs text-stone-500">
                      {[workflow.source_type, workflow.source_mode].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ) : null}

              {workflow.source_url ? (
                <a
                  href={workflow.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-brand-600 hover:underline"
                >
                  {workflow.source_url}
                </a>
              ) : (
                <p className="text-sm text-stone-500">
                  {[workflow.source_type, workflow.source_mode].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <ReportDialog
        workflowId={workflowId}
        entityType={workflow.entity_type}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  )
}
