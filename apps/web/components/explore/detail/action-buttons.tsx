/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/hooks/use-explore 的 useToggleLike / useToggleFavorite / useCloneWorkflow，
 *          依赖 @/i18n/navigation 的 useRouter，
 *          依赖 @/components/ui/button，依赖 lucide-react 图标，
 *          依赖 ./report-dialog
 * [OUTPUT]: 对外提供 ActionButtons 互动按钮组
 * [POS]: explore/detail 的操作栏，被 explore-detail-content.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Flag, Heart, Star } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { useToggleLike, useToggleFavorite, useCloneWorkflow } from '@/hooks/use-explore'
import { Button } from '@/components/ui/button'
import { ReportDialog } from './report-dialog'

/* ─── Types ──────────────────────────────────────────── */

interface ActionButtonsProps {
  workflowId: string
  liked: boolean
  favorited: boolean
}

/* ─── Component ──────────────────────────────────────── */

export function ActionButtons({ workflowId, liked, favorited }: ActionButtonsProps) {
  const t = useTranslations('exploreDetail')
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)

  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleFavorite } = useToggleFavorite()
  const { mutate: clone, isPending: cloning } = useCloneWorkflow()

  const handleLike = () => {
    toggleLike(workflowId, {
      onError: () => toast.error(t('actionFailed')),
    })
  }

  const handleFavorite = () => {
    toggleFavorite(workflowId, {
      onError: () => toast.error(t('actionFailed')),
    })
  }

  const handleClone = () => {
    clone(workflowId, {
      onSuccess: (data) => {
        toast.success(t('cloneSuccess'))
        router.push(`/workspace/${data.id}`)
      },
      onError: () => toast.error(t('cloneFailed')),
    })
  }

  return (
    <>
      <div className="space-y-2">
        {/* 点赞 */}
        <Button
          variant={liked ? 'default' : 'outline'}
          className="w-full justify-start gap-2"
          onClick={handleLike}
        >
          <Heart size={16} className={liked ? 'fill-current' : ''} />
          {liked ? t('liked') : t('like')}
        </Button>

        {/* 收藏 */}
        <Button
          variant={favorited ? 'default' : 'outline'}
          className="w-full justify-start gap-2"
          onClick={handleFavorite}
        >
          <Star size={16} className={favorited ? 'fill-current' : ''} />
          {favorited ? t('favorited') : t('favorite')}
        </Button>

        {/* 克隆并打开 */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleClone}
          disabled={cloning}
        >
          <Copy size={16} />
          {t('cloneAndOpen')}
        </Button>

        {/* 举报 */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => setReportOpen(true)}
        >
          <Flag size={16} />
          {t('report')}
        </Button>
      </div>

      <ReportDialog
        workflowId={workflowId}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  )
}
