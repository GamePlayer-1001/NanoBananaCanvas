/**
 * [INPUT]: 依赖 react 的 useRef，依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，
 *          依赖 @/i18n/navigation 的 useRouter，依赖 @/hooks/use-user 的 useCurrentUser，
 *          依赖 @/hooks/use-upload 的 useUpload，依赖 @/lib/validations/upload
 * [OUTPUT]: 对外提供 ExploreTabs 标签栏组件 (热门/最新/我点赞的/我的视频 + 探索搜索入口 + 本地作品分享上传入口)
 * [POS]: explore 的顶部标签导航，被 explore/page.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { Loader2, Search, Share2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-user'
import { useUpload } from '@/hooks/use-upload'
import { SHARE_UPLOAD_ACCEPT, UPLOAD_LIMITS, detectUploadKind } from '@/lib/validations/upload'

/* ─── Tab Config ─────────────────────────────────────── */

const TABS = ['hot', 'latest', 'myLiked', 'myVideos'] as const

export type ExploreTab = (typeof TABS)[number]

/* ─── Helpers ────────────────────────────────────────── */

function getVideoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')

    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration)
      URL.revokeObjectURL(url)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('VIDEO_METADATA_FAILED'))
    }

    video.src = url
  })
}

/* ─── Component ──────────────────────────────────────── */

export function ExploreTabs({
  active,
  onChange,
  onSearchOpen,
  searchLabel,
}: {
  active: ExploreTab
  onChange: (tab: ExploreTab) => void
  onSearchOpen: () => void
  searchLabel: string
}) {
  const t = useTranslations('explore')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: user } = useCurrentUser()
  const { uploading, progress, upload, reset } = useUpload()

  const handleShareClick = () => {
    if (user && !user.isAuthenticated) {
      toast.message(t('shareSignInRequired'))
      router.push('/sign-in?redirect_url=/explore')
      return
    }

    reset()
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const kind = detectUploadKind(file)
    if (!kind) {
      toast.error(t('shareUnsupportedType'))
      return
    }

    if (kind === 'image' && file.size > UPLOAD_LIMITS.imageMaxSizeBytes) {
      toast.error(t('shareImageTooLarge', { size: UPLOAD_LIMITS.imageMaxSizeBytes / 1024 / 1024 }))
      return
    }

    if (kind === 'video') {
      if (file.size > UPLOAD_LIMITS.videoMaxSizeBytes) {
        toast.error(t('shareVideoTooLarge', { size: UPLOAD_LIMITS.videoMaxSizeBytes / 1024 / 1024 }))
        return
      }

      try {
        const durationSeconds = await getVideoDuration(file)
        if (durationSeconds > UPLOAD_LIMITS.videoMaxDurationSeconds) {
          toast.error(t('shareDurationTooLong', { seconds: UPLOAD_LIMITS.videoMaxDurationSeconds }))
          return
        }
      } catch {
        toast.error(t('shareVideoReadFailed'))
        return
      }
    }

    if (kind === 'workflow' && file.size > UPLOAD_LIMITS.workflowMaxSizeBytes) {
      toast.error(
        t('shareWorkflowTooLarge', { size: UPLOAD_LIMITS.workflowMaxSizeBytes / 1024 / 1024 }),
      )
      return
    }

    const result = await upload(file)
    if (!result) {
      toast.error(t('shareUploadFailed'))
      return
    }

    toast.success(t('shareUploadSuccess', { name: file.name }))
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* 标签 */}
      <div className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              active === tab
                ? 'bg-brand-500 font-medium text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={SHARE_UPLOAD_ACCEPT}
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />

        <button
          onClick={onSearchOpen}
          className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors"
        >
          <Search size={14} />
          <span>{searchLabel}</span>
          <kbd className="border-border bg-muted rounded border px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>

        {/* 分享入口 */}
        <button
          onClick={handleShareClick}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
          {uploading ? t('shareUploading', { progress }) : t('shareWork')}
        </button>
      </div>
    </div>
  )
}
