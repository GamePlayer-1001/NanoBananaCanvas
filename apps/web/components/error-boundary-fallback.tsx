/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/lib/errors 的 isAppError，依赖 @/components/ui/button
 * [OUTPUT]: 对外提供本地化的错误边界 fallback UI
 * [POS]: components 的错误文案渲染层，被 error-boundary.tsx 复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { isAppError } from '@/lib/errors'

export function ErrorBoundaryFallback({
  error,
  onReset,
}: {
  error: Error
  onReset: () => void
}) {
  const t = useTranslations('common')

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-8">
      <div className="text-center">
        <h3 className="text-destructive text-lg font-semibold">{t('errorBoundaryTitle')}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {isAppError(error) ? error.message : t('unexpectedError')}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset}>
        {t('retry')}
      </Button>
    </div>
  )
}
