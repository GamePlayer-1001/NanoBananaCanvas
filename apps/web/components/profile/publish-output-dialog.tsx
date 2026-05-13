/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 next-intl 的 useLocale，依赖 sonner 的 toast，依赖 @/hooks/use-explore 的 usePublishOutput，
 *          依赖 @/components/shared/image-upload，依赖 @/components/ui/dialog, @/components/ui/button
 * [OUTPUT]: 对外提供 PublishOutputDialog 生成作品公开弹窗（封面上传 + 视频缺省自动抓帧封面 + 真实分类选择）
 * [POS]: profile 的生成作品公开入口，被 works-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { usePublishOutput } from '@/hooks/use-explore'
import { useCategories } from '@/hooks/use-categories'
import { useUpload } from '@/hooks/use-upload'
import { ImageUpload } from '@/components/shared/image-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PublishOutputDialogProps {
  taskId: string
  defaultTitle: string
  defaultPrompt?: string
  defaultThumbnail?: string
  defaultMediaUrl?: string
  mediaType?: 'image' | 'video'
  open: boolean
  onOpenChange: (open: boolean) => void
}

async function captureVideoCoverFile(videoUrl: string, fileName: string) {
  return new Promise<File | null>((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = videoUrl

    const cleanup = () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    const fail = () => {
      cleanup()
      resolve(null)
    }

    const capture = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) {
          fail()
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext('2d')

        if (!context) {
          fail()
          return
        }

        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        canvas.toBlob(
          (blob) => {
            cleanup()
            if (!blob) {
              resolve(null)
              return
            }

            resolve(new File([blob], `${fileName}.jpg`, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.9,
        )
      } catch {
        fail()
      }
    }

    video.addEventListener(
      'loadeddata',
      () => {
        if (video.readyState >= 2) {
          capture()
        }
      },
      { once: true },
    )

    video.addEventListener(
      'error',
      () => {
        fail()
      },
      { once: true },
    )
  })
}

export function PublishOutputDialog({
  taskId,
  defaultTitle,
  defaultPrompt,
  defaultThumbnail,
  defaultMediaUrl,
  mediaType,
  open,
  onOpenChange,
}: PublishOutputDialogProps) {
  const t = useTranslations('profileWorks')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [sourceUrl, setSourceUrl] = useState('')
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined)
  const [categoryId, setCategoryId] = useState('')
  const { mutateAsync, isPending } = usePublishOutput()
  const { upload } = useUpload()
  const { data: categories = [] } = useCategories(locale)
  const previewValue = thumbnail || (mediaType === 'image' ? defaultThumbnail : undefined)

  const handleSubmit = async () => {
    try {
      let resolvedThumbnail = thumbnail

      if (!resolvedThumbnail && mediaType === 'video' && defaultMediaUrl) {
        const frameFile = await captureVideoCoverFile(defaultMediaUrl, `${taskId}-cover`)
        if (frameFile) {
          const uploadResult = await upload(frameFile)
          if (uploadResult?.url) {
            resolvedThumbnail = uploadResult.url
          }
        }
      }

      await mutateAsync({
        taskId,
        title: title.trim() || defaultTitle,
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        thumbnail: resolvedThumbnail,
        categoryId: categoryId || undefined,
      })

      toast.success(t('publishOutputSuccess'))
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('publishOutputFailed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('publishOutputTitle')}</DialogTitle>
          <DialogDescription>{t('publishOutputDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputCover')}</p>
            <ImageUpload
              value={previewValue}
              onChange={setThumbnail}
              className="h-36"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputName')}</p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputCategory')}</p>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">{t('publishOutputCategoryAuto')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputIntro')}</p>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputPrompt')}</p>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">{t('publishOutputSourceUrl')}</p>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isPending || !title.trim()}>
            {t('publishOutputAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
