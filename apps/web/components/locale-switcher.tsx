/**
 * [INPUT]: 依赖 next-intl 的 useLocale，依赖 @/i18n/navigation 的 useRouter / usePathname
 * [OUTPUT]: 对外提供 LocaleSwitcher 语言切换按钮组件
 * [POS]: components 的全局语言切换器，放置在画布工具栏或顶部导航
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/* ─── Locale Labels ─────────────────────────────────────── */

const LOCALE_LABEL: Record<string, string> = {
  en: '中文',
  zh: 'English',
}

/* ─── Component ─────────────────────────────────────────── */

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = locale === 'en' ? 'zh' : 'en'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => router.replace(pathname, { locale: switchTo })}
          >
            <Globe size={14} />
            <span className="hidden sm:inline">{LOCALE_LABEL[locale]}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          {LOCALE_LABEL[locale]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
