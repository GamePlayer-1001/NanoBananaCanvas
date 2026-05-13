/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/hooks/use-explore 的 useToggleFavorite / useCloneWorkflow，
 *          依赖 @/i18n/navigation 的 useRouter，
 *          依赖 @/components/ui/button，依赖 lucide-react 图标，
 *          依赖 ./report-dialog
 * [OUTPUT]: 对外提供 ActionButtons 操作按钮组（立即生成 / 加入收藏 / 下载）
 * [POS]: explore/detail 的操作栏，被 explore-detail-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Download, Flag, Star } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { useToggleFavorite, useCloneWorkflow } from '@/hooks/use-explore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReportDialog } from './report-dialog'

/* ─── Types ──────────────────────────────────────────── */

interface ActionButtonsProps {
  workflowId: string
  entityType?: 'workflow' | 'output'
  favorited: boolean
  downloadUrl?: string
  downloadFileName?: string
}

/* ─── Component ──────────────────────────────────────── */

export function ActionButtons({
  workflowId,
  entityType = 'workflow',
  favorited,
  downloadUrl,
  downloadFileName,
}: ActionButtonsProps) {
  const t = useTranslations('exploreDetail')
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [favoritedState, setFavoritedState] = useState(favorited)
  const [starBurst, setStarBurst] = useState(false)

  const { mutate: toggleFavorite } = useToggleFavorite()
  const { mutate: clone, isPending: cloning } = useCloneWorkflow()

  useEffect(() => {
    setFavoritedState(favorited)
  }, [favorited])

  const handleFavorite = () => {
    const nextFavorited = !favoritedState
    setFavoritedState(nextFavorited)
    setStarBurst(nextFavorited)
    toggleFavorite(
      { id: workflowId, entityType },
      {
        onSuccess: (data) => {
          setFavoritedState(Boolean((data as { favorited?: boolean }).favorited))
        },
        onError: () => toast.error(t('actionFailed')),
        onSettled: () => {
          window.setTimeout(() => setStarBurst(false), 320)
        },
      },
    )
  }

  const handleClone = () => {
    clone(
      { id: workflowId, entityType },
      {
        onSuccess: (data) => {
          toast.success(t('cloneSuccess'))
          router.push(`/canvas/${data.id}`)
        },
        onError: () => toast.error(t('cloneFailed')),
      },
    )
  }

  const handleDownload = () => {
    if (!downloadUrl) {
      toast.error(t('downloadUnavailable'))
      return
    }

    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.target = '_blank'
    anchor.rel = 'noreferrer'
    if (downloadFileName) {
      anchor.download = downloadFileName
    }
    anchor.click()
  }

  return (
    <>
      <div className="space-y-3">
        <Button
          className="h-12 w-full rounded-2xl bg-brand-600 text-base font-semibold text-white shadow-[0_16px_32px_-20px_rgba(79,70,229,0.85)] transition-colors hover:bg-brand-500"
          onClick={handleClone}
          disabled={cloning}
        >
          <Copy size={18} />
          {cloning ? t('generatePending') : t('generateNow')}
        </Button>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            className={cn(
              'h-12 rounded-2xl border-stone-200 bg-[#f4f6ff] text-base font-semibold text-stone-900 shadow-none hover:bg-[#e9edff]',
              starBurst && 'scale-[1.02]',
            )}
            onClick={handleFavorite}
          >
            <Star
              size={18}
              className={cn(
                favoritedState ? 'fill-current text-current' : '',
                starBurst && 'animate-[pulse_0.32s_ease-out]',
              )}
            />
            {favoritedState ? t('favorited') : t('favoriteNow')}
          </Button>

          <Button
            variant="outline"
            className="h-12 rounded-2xl border-stone-200 bg-[#f4f6ff] text-base font-semibold text-stone-900 shadow-none hover:bg-[#e9edff]"
            onClick={handleDownload}
            disabled={!downloadUrl}
          >
            <Download size={18} />
            {t('download')}
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-1 text-sm text-stone-500 transition-colors hover:text-stone-900"
          onClick={() => setReportOpen(true)}
        >
          <Flag size={15} />
          {t('report')}
        </button>
      </div>

      <ReportDialog
        workflowId={workflowId}
        entityType={entityType}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  )
}
