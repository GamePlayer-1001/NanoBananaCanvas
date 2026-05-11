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

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Copy, Flag, Heart, Star } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import { useToggleLike, useToggleFavorite, useCloneWorkflow } from '@/hooks/use-explore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReportDialog } from './report-dialog'

/* ─── Types ──────────────────────────────────────────── */

interface ActionButtonsProps {
  workflowId: string
  entityType?: 'workflow' | 'output'
  liked: boolean
  favorited: boolean
  likeCount: number
  cloneCount: number
}

/* ─── Component ──────────────────────────────────────── */

export function ActionButtons({
  workflowId,
  entityType = 'workflow',
  liked,
  favorited,
  likeCount,
  cloneCount,
}: ActionButtonsProps) {
  const t = useTranslations('exploreDetail')
  const router = useRouter()
  const [reportOpen, setReportOpen] = useState(false)
  const [likedState, setLikedState] = useState(liked)
  const [favoritedState, setFavoritedState] = useState(favorited)
  const [likeCountState, setLikeCountState] = useState(likeCount)
  const [heartBurst, setHeartBurst] = useState(false)
  const [starBurst, setStarBurst] = useState(false)

  const { mutate: toggleLike } = useToggleLike()
  const { mutate: toggleFavorite } = useToggleFavorite()
  const { mutate: clone, isPending: cloning } = useCloneWorkflow()

  useEffect(() => {
    setLikedState(liked)
  }, [liked])

  useEffect(() => {
    setFavoritedState(favorited)
  }, [favorited])

  useEffect(() => {
    setLikeCountState(likeCount)
  }, [likeCount])

  const handleLike = () => {
    const nextLiked = !likedState
    const nextCount = Math.max(likeCountState + (nextLiked ? 1 : -1), 0)
    setLikedState(nextLiked)
    setLikeCountState(nextCount)
    setHeartBurst(nextLiked)
    toggleLike({ id: workflowId, entityType }, {
      onSuccess: (data) => {
        const likedFromServer = Boolean((data as { liked?: boolean }).liked)
        setLikedState(likedFromServer)
      },
      onError: () => toast.error(t('actionFailed')),
      onSettled: () => {
        window.setTimeout(() => setHeartBurst(false), 320)
      },
    })
  }

  const handleFavorite = () => {
    const nextFavorited = !favoritedState
    setFavoritedState(nextFavorited)
    setStarBurst(nextFavorited)
    toggleFavorite({ id: workflowId, entityType }, {
      onSuccess: (data) => {
        setFavoritedState(Boolean((data as { favorited?: boolean }).favorited))
      },
      onError: () => toast.error(t('actionFailed')),
      onSettled: () => {
        window.setTimeout(() => setStarBurst(false), 320)
      },
    })
  }

  const handleClone = () => {
    clone({ id: workflowId, entityType }, {
      onSuccess: (data) => {
        toast.success(t('cloneSuccess'))
        router.push(`/canvas/${data.id}`)
      },
      onError: () => toast.error(t('cloneFailed')),
    })
  }

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t('likes', { count: likeCountState })}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{likeCountState}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t('clones', { count: cloneCount })}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{cloneCount}</p>
          </div>
        </div>

        {/* 点赞 */}
        <Button
          variant={likedState ? 'default' : 'outline'}
          className={cn(
            'w-full justify-start gap-2 transition-transform duration-200',
            heartBurst && 'scale-[1.02]',
          )}
          onClick={handleLike}
        >
          <Heart
            size={16}
            className={cn(
              likedState ? 'fill-current text-current' : '',
              heartBurst && 'animate-[pulse_0.32s_ease-out]',
            )}
          />
          {likedState ? t('liked') : t('like')}
        </Button>

        {/* 收藏 */}
        <Button
          variant={favoritedState ? 'default' : 'outline'}
          className={cn(
            'w-full justify-start gap-2 transition-transform duration-200',
            starBurst && 'scale-[1.02]',
          )}
          onClick={handleFavorite}
        >
          <Star
            size={16}
            className={cn(
              favoritedState ? 'fill-current text-current' : '',
              starBurst && 'animate-[pulse_0.32s_ease-out]',
            )}
          />
          {favoritedState ? t('favorited') : t('favorite')}
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
        entityType={entityType}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  )
}
