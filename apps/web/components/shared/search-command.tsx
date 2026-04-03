/**
 * [INPUT]: 依赖 react 的 useState/useEffect/useCallback，依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 useRouter，依赖 @/hooks/use-explore 的 useExploreSearch，
 *          依赖 @/components/ui/dialog, @/components/ui/input, @/components/ui/skeleton,
 *          依赖 lucide-react 图标
 * [OUTPUT]: 对外提供 SearchCommand 全局搜索弹窗 + useSearchShortcut hook
 * [POS]: shared 的全局搜索组件，被 app-sidebar.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Loader2 } from 'lucide-react'

import { useRouter } from '@/i18n/navigation'
import { useExploreSearch } from '@/hooks/use-explore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

/* ─── Hook: Cmd+K 快捷键 ─────────────────────────────── */

export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}

/* ─── Component ──────────────────────────────────────── */

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const t = useTranslations('search')
  const router = useRouter()
  const [query, setQuery] = useState('')

  const { data, isLoading } = useExploreSearch(query)
  const results = (data as { items?: Array<{ id: string; name: string; author_name?: string }> })?.items

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange(value)
      if (!value) setQuery('')
    },
    [onOpenChange],
  )

  const handleSelect = useCallback(
    (id: string) => {
      onOpenChange(false)
      router.push(`/explore/${id}`)
    },
    [onOpenChange, router],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 sm:max-w-[500px]">
        <DialogTitle className="sr-only">{t('title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('description')}</DialogDescription>

        {/* 搜索输入 */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Search size={16} className="text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            className="border-0 p-0 shadow-none focus-visible:ring-0"
            autoFocus
          />
          {isLoading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        </div>

        {/* 搜索结果 */}
        <div className="max-h-[300px] overflow-y-auto">
          {query.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('hint')}
            </p>
          ) : results && results.length > 0 ? (
            <div className="space-y-1 py-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => handleSelect(item.id)}
                >
                  <span className="truncate font-medium text-foreground">{item.name}</span>
                  {item.author_name && (
                    <span className="ml-auto text-xs text-muted-foreground">{item.author_name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : query.length > 0 && !isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('noResults')}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
