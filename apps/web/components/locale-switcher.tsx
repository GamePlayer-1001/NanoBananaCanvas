/**
 * [INPUT]: 依赖 next-intl 的 useLocale，依赖 @/i18n/navigation 的 useRouter / usePathname，
 *          依赖 @/i18n/config 的 locale 元数据，依赖 @/components/ui/dropdown-menu
 * [OUTPUT]: 对外提供 LocaleSwitcher 语言切换按钮组件
 * [POS]: components 的全局语言切换器，放置在画布工具栏或顶部导航
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getLocaleDefinition, getLocaleMenuOptions, resolveLocale } from '@/i18n/config'

/* ─── Component ─────────────────────────────────────────── */

export function LocaleSwitcher() {
  const locale = resolveLocale(useLocale())
  const router = useRouter()
  const pathname = usePathname()
  const activeLocale = getLocaleDefinition(locale)
  const localeOptions = getLocaleMenuOptions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Globe size={14} />
          <span className="hidden sm:inline">{activeLocale.switcherLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {localeOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => router.replace(pathname, { locale: option.code })}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-sm">{option.nativeName}</span>
            {option.code === locale ? <Check size={14} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
