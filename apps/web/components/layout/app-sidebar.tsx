/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link / usePathname，
 *          依赖 lucide-react 图标，依赖 @clerk/nextjs 的 UserButton，
 *          依赖 @/components/profile/profile-modal，依赖 @/components/shared/search-command，
 *          依赖 @/hooks/use-folders 的 useFolders / useCreateFolder
 * [OUTPUT]: 对外提供 AppSidebar 核心侧边栏组件 (含 ProfileModal + SearchCommand + 文件夹管理)
 * [POS]: layout 的核心导航组件，被 (app)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { UserButton } from '@clerk/nextjs'
import {
  Folder,
  LayoutGrid,
  Video,
  Plus,
  ChevronRight,
  UserPlus,
  MessageCircle,
  Search,
  Sparkles,
} from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { ProfileModal } from '@/components/profile/profile-modal'
import { SearchCommand, useSearchShortcut } from '@/components/shared/search-command'
import { useFolders, useCreateFolder } from '@/hooks/use-folders'

/* ─── Types ──────────────────────────────────────────── */

interface NavItem {
  href: string
  icon: React.ElementType
  labelKey: string
  badge?: string
}

/* ─── Nav Config ─────────────────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  { href: '/explore', icon: LayoutGrid, labelKey: 'explore' },
  { href: '/video-analysis', icon: Video, labelKey: 'videoAnalysis', badge: 'alpha' },
]

const WORKSPACE_ITEMS: NavItem[] = [
  { href: '/workspace', icon: LayoutGrid, labelKey: 'all' },
]

/* ─── SidebarNavItem ─────────────────────────────────── */

function SidebarNavItem({
  href,
  icon: Icon,
  label,
  badge,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  badge?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? 'bg-brand-50 text-brand-600 font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded border border-brand-200 bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-600">
          {badge}
        </span>
      )}
    </Link>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function AppSidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useSearchShortcut(openSearch)
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get('folder')
  const { data: folders } = useFolders()
  const createFolder = useCreateFolder()

  return (
    <>
    <aside className="flex h-screen w-[200px] flex-col border-r border-border bg-background">
      {/* ── Header ────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-2">
        <Link href="/explore" className="block">
          <h1 className="font-serif text-sm italic tracking-wide text-foreground">
            Nano Banana Canvas
          </h1>
        </Link>
        <p className="mt-0.5 text-[8px] text-muted-foreground">{t('personal')}</p>
      </div>

      {/* ── Search ─────────────────────────────────────── */}
      <div className="px-3 pt-1 pb-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search size={13} />
          <span className="flex-1 text-left">{t('search')}</span>
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd>
        </button>
      </div>

      {/* ── Main Nav ──────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 pt-2">
        {/* 导航项 */}
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={t(item.labelKey)}
              badge={item.badge ? t(item.badge) : undefined}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>

        {/* 工作区 */}
        <div className="mt-6">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs font-medium text-muted-foreground">
              {t('workspace')}
            </span>
            <button
              onClick={() => createFolder.mutate({ name: t('newFolder') })}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="mt-1 space-y-0.5">
            {WORKSPACE_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={t(item.labelKey)}
                active={pathname === item.href && !activeFolderId}
              />
            ))}

            {/* 文件夹列表 */}
            {(folders as { id: string; name: string }[] | undefined)?.map((folder) => (
              <SidebarNavItem
                key={folder.id}
                href={`/workspace?folder=${folder.id}`}
                icon={Folder}
                label={folder.name}
                active={pathname === '/workspace' && activeFolderId === folder.id}
              />
            ))}
          </div>

          {/* 空文件夹提示 */}
          {(!folders || (folders as unknown[]).length === 0) && (
            <p className="mt-2 px-3 text-xs text-muted-foreground/60">
              {t('noFolders')}
            </p>
          )}
        </div>
      </nav>

      {/* ── Bottom Links ──────────────────────────────── */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {/* 联系我们 */}
        <Link
          href="/contact"
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === '/contact'
              ? 'bg-brand-50 text-brand-600 font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <MessageCircle size={14} />
          <span>{t('contactUs')}</span>
        </Link>

        {/* 邀请 */}
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <UserPlus size={14} />
          <span>{t('invite')}</span>
        </button>
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3 space-y-2">
        {/* 升级套餐入口 */}
        <Link
          href="/pricing"
          className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-100"
        >
          <Sparkles size={14} />
          <span className="flex-1">{t('upgrade')}</span>
          <ChevronRight size={14} />
        </Link>

        {/* 用户信息 */}
        <div className="flex items-center gap-2 px-1">
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t('freePlan')}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle size={12} />
            100
          </span>
          <button
            onClick={() => setProfileOpen(true)}
            className="ml-auto"
          >
            <UserButton
              appearance={{
                elements: {
                  avatarBox: { width: '28px', height: '28px' },
                },
              }}
            />
          </button>
        </div>
      </div>
    </aside>

    <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
