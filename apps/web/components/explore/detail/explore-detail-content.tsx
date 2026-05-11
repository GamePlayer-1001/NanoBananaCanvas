/**
 * [INPUT]: 依赖 @/hooks/use-explore 的 useExploreDetail，
 *          依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link，
 *          依赖 ./workflow-preview, ./author-info, ./action-buttons
 * [OUTPUT]: 对外提供 ExploreDetailContent 客户端交互容器
 * [POS]: explore/detail 的主容器，被 explore/[id]/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

/* eslint-disable @next/next/no-img-element -- 公开详情里的用户作品媒体地址来自运行时资源，图片/视频混合展示时直接使用原生标签最稳。 */

import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { useExploreDetail } from '@/hooks/use-explore'
import { WorkflowPreview } from './workflow-preview'
import { AuthorInfo } from './author-info'
import { ActionButtons } from './action-buttons'

/* ─── Types ──────────────────────────────────────────── */

interface WorkflowDetail {
  entity_type?: 'workflow' | 'output'
  id: string
  name: string
  description?: string
  data?: string
  prompt?: string
  source_url?: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail?: string
  author_name?: string | null
  author_avatar?: string
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

/* ─── Component ──────────────────────────────────────── */

export function ExploreDetailContent({ workflowId }: ExploreDetailContentProps) {
  const t = useTranslations('exploreDetail')
  const { data, isLoading } = useExploreDetail(workflowId)

  /* 加载态 */
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  /* 数据缺失 */
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
  const authorName = workflow.author_name?.trim() || 'Unknown Creator'
  const isOutput = workflow.entity_type === 'output'

  return (
    <div className="mx-auto w-full max-w-[1380px] px-6 py-8 lg:px-8 lg:py-10">
      {/* 返回链接 */}
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('backToExplore')}
      </Link>

      {/* 标题区 */}
      <div className="mb-10 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          {workflow.name}
        </h1>
        {workflow.description && (
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {workflow.description}
          </p>
        )}
      </div>

      {/* 主内容区: 预览 + 侧栏 */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 左: 只读画布预览 */}
        <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-border/70 bg-muted shadow-[0_18px_48px_-32px_rgba(15,23,42,0.4)]">
          {isOutput ? (
            workflow.media_type === 'video' ? (
              <video
                src={workflow.media_url}
                className="h-full w-full bg-black object-contain"
                controls
                playsInline
              />
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

        {/* 右: 作者 + 统计 + 操作 */}
        <div className="space-y-5">
          <AuthorInfo
            name={authorName}
            avatar={workflow.author_avatar}
            publishedAt={workflow.published_at}
          />

          <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            {isOutput && workflow.description ? (
              <div className="mb-5 rounded-2xl border border-border/60 bg-background/80 p-4">
                <p className="text-sm leading-6 text-muted-foreground">{workflow.description}</p>
              </div>
            ) : null}

            <div className="mb-5 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">{workflow.view_count ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('views', { count: workflow.view_count ?? 0 })}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{workflow.like_count ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('likes', { count: workflow.like_count ?? 0 })}</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{workflow.clone_count ?? 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('clones', { count: workflow.clone_count ?? 0 })}</p>
              </div>
            </div>

            <ActionButtons
              workflowId={workflowId}
              entityType={workflow.entity_type}
              liked={workflow.liked ?? false}
              favorited={workflow.favorited ?? false}
              likeCount={workflow.like_count ?? 0}
              cloneCount={workflow.clone_count ?? 0}
            />

            {isOutput ? (
              <div className="mt-5 space-y-4">
                {workflow.prompt ? (
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('prompt')}
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                      {workflow.prompt}
                    </p>
                  </div>
                ) : null}

                {workflow.source_url ? (
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {t('sourceLink')}
                    </p>
                    <a
                      href={workflow.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm text-brand-600 hover:underline"
                    >
                      {workflow.source_url}
                    </a>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
