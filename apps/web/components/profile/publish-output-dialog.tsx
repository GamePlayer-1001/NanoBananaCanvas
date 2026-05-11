/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 sonner 的 toast，依赖 @/hooks/use-explore 的 usePublishOutput，
 *          依赖 @/components/shared/image-upload，依赖 @/components/ui/dialog, @/components/ui/button
 * [OUTPUT]: 对外提供 PublishOutputDialog 生成作品公开弹窗
 * [POS]: profile 的生成作品公开入口，被 works-tab.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { usePublishOutput } from '@/hooks/use-explore'
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
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishOutputDialog({
  taskId,
  defaultTitle,
  defaultPrompt,
  defaultThumbnail,
  open,
  onOpenChange,
}: PublishOutputDialogProps) {
  const t = useTranslations('profileWorks')
  const tc = useTranslations('common')
  const [title, setTitle] = useState(defaultTitle)
  const [description, setDescription] = useState('')
  const [prompt, setPrompt] = useState(defaultPrompt ?? '')
  const [sourceUrl, setSourceUrl] = useState('')
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined)
  const { mutate, isPending } = usePublishOutput()

  const handleSubmit = () => {
    mutate(
      {
        taskId,
        title: title.trim() || defaultTitle,
        description: description.trim() || undefined,
        prompt: prompt.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        thumbnail: thumbnail || defaultThumbnail,
      },
      {
        onSuccess: () => {
          toast.success(t('publishOutputSuccess'))
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error.message || t('publishOutputFailed'))
        },
      },
    )
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
              value={thumbnail || defaultThumbnail}
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
          <Button onClick={handleSubmit} disabled={isPending || !title.trim()}>
            {t('publishOutputAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
