/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，依赖 @/i18n/navigation 的 Link / usePathname，
 *          依赖 lucide-react 图标，
 *          依赖 @/components/ui/avatar，依赖 @/components/profile/profile-modal，
 *          依赖 @/components/shared/search-command，
 *          依赖 @/hooks/use-folders，依赖 @/hooks/use-user，依赖 sonner 的 toast
 * [OUTPUT]: 对外提供 AppSidebar 核心侧边栏组件 (按需挂载 ProfileModal/SearchCommand + 文件夹管理)
 * [POS]: layout 的核心导航组件，被 (app)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Folder,
  LayoutGrid,
  Video,
  Plus,
  MessageCircle,
  Search,
} from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ProfileModal } from '@/components/profile/profile-modal'
import { SearchCommand, useSearchShortcut } from '@/components/shared/search-command'
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui'
import { useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder } from '@/hooks/use-folders'
import { useCurrentUser } from '@/hooks/use-user'

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

/* ─── FolderItem ─────────────────────────────────────── */

function FolderItem({
  folder,
  active,
  deleteLabel,
}: {
  folder: { id: string; name: string }
  active: boolean
  deleteLabel: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  /* 提交重命名 */
  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== folder.name) {
      updateFolder.mutate({ id: folder.id, name: trimmed })
    } else {
      setEditName(folder.name)
    }
    setIsEditing(false)
  }

  /* 编辑态 */
  if (isEditing) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
        <Folder size={16} className="shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') {
              setEditName(folder.name)
              setIsEditing(false)
            }
          }}
          className="flex-1 bg-transparent text-sm outline-none border-b border-brand-400"
          autoFocus
        />
      </div>
    )
  }

  /* 正常态: 右键菜单 + 双击重命名 */
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>
        <Link
          href={`/workspace?folder=${folder.id}`}
          onDoubleClick={(e) => {
            e.preventDefault()
            setIsEditing(true)
          }}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
            active
              ? 'bg-brand-50 text-brand-600 font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Folder size={16} />
          <span className="flex-1 truncate">{folder.name}</span>
        </Link>
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
          className="z-50 min-w-[120px] rounded-md border border-border bg-popover p-1 shadow-md"
        >
          <ContextMenuPrimitive.Item
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10"
            onSelect={() => deleteFolder.mutate(folder.id)}
          >
            {deleteLabel}
          </ContextMenuPrimitive.Item>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function AppSidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const { data: user } = useCurrentUser()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  useSearchShortcut(openSearch)
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get('folder')
  const { data: folders } = useFolders()
  const createFolder = useCreateFolder()

  const handleCreateFolder = () => {
    createFolder.mutate(
      { name: t('newFolder') },
      {
        onError: (err) => toast.error(err.message),
      },
    )
  }

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
              onClick={handleCreateFolder}
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
              <FolderItem
                key={folder.id}
                folder={folder}
                active={pathname === '/workspace' && activeFolderId === folder.id}
                deleteLabel={t('deleteFolder')}
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
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="border-t border-border px-3 py-3 space-y-2">
        {/* 用户信息 */}
        <div className="flex items-center gap-2 px-1">
          <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t('freePlan')}
          </span>
          <button
            onClick={() => setProfileOpen(true)}
            className="ml-auto"
          >
            <Avatar size="sm">
              {user?.imageUrl && (
                <AvatarImage src={user.imageUrl} alt={user.name ?? 'Guest'} />
              )}
              <AvatarFallback>
                {user?.name?.charAt(0) ?? 'G'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>
    </aside>

    {profileOpen && <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />}
    {searchOpen && <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  )
}
