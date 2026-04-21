/**
 * [INPUT]: 依赖 @/components/ui/dialog, @/components/ui/button, @/components/ui/label,
 *          依赖 @/hooks/use-workflows 的 usePublishWorkflow,
 *          依赖 @/hooks/use-categories 的 useCategories,
 *          依赖 @/components/shared/image-upload 的 ImageUpload,
 *          依赖 next-intl 的 useTranslations/useLocale, 依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 PublishDialog 发布弹窗组件
 * [POS]: workspace 的发布交互，被 project-card.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import { usePublishWorkflow } from '@/hooks/use-workflows'
import { useCategories, type Category } from '@/hooks/use-categories'
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
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/* ─── Component ──────────────────────────────────────── */

interface PublishDialogProps {
  workflowId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishDialog({ workflowId, open, onOpenChange }: PublishDialogProps) {
  const t = useTranslations('workspace')
  const tc = useTranslations('common')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [coverUrl, setCoverUrl] = useState<string | undefined>()
  const { data: categories, isLoading: categoriesLoading } = useCategories(useLocale())
  const { mutate, isPending } = usePublishWorkflow(workflowId)

  const handlePublish = () => {
    if (!selectedCategory) return

    mutate(
      { categoryId: selectedCategory, thumbnail: coverUrl },
      {
        onSuccess: () => {
          toast.success(t('publishSuccess'))
          onOpenChange(false)
          setSelectedCategory('')
        },
        onError: () => toast.error(t('publishFailed')),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('publishToExplore')}</DialogTitle>
          <DialogDescription>{t('publishDescription')}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* 封面上传 */}
          <div className="space-y-2">
            <Label>{t('coverImage')}</Label>
            <ImageUpload
              value={coverUrl}
              onChange={setCoverUrl}
              className="h-32"
            />
          </div>

          {/* 分类选择 */}
          <div className="space-y-2">
            <Label>{t('selectCategory')}</Label>
            {categoriesLoading ? (
              <div className="text-sm text-muted-foreground">{tc('loading')}</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(categories as Category[])?.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      selectedCategory === cat.id
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium'
                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handlePublish} disabled={isPending || !selectedCategory}>
            {t('publish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
