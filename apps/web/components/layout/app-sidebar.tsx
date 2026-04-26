/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link / usePathname，
 *          依赖 lucide-react 图标，
 *          依赖 @/components/ui/avatar，
 *          依赖 @/components/shared/brand-mark，
 *          依赖 @/components/auth/sign-out-action，
 *          依赖 @/hooks/use-folders，依赖 @/hooks/use-user，依赖 sonner 的 toast，
 *          依赖 @/lib/auth/redirect 的 getDefaultSignOutRedirect
 * [OUTPUT]: 对外提供 AppSidebar 核心侧边栏组件 (导航/文件夹管理/账户入口/计费入口)
 * [POS]: layout 的核心导航组件，被 (app)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Folder,
  LayoutGrid,
  Video,
  Plus,
  MessageCircle,
  LogOut,
  Coins,
  Sparkles,
  ChevronRight,
} from 'lucide-react'

import { Link, usePathname } from '@/i18n/navigation'
import { SignOutAction } from '@/components/auth/sign-out-action'
import { BrandMark } from '@/components/shared/brand-mark'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui'
import {
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from '@/hooks/use-folders'
import { useCreditBalance } from '@/hooks/use-billing'
import { useCurrentUser } from '@/hooks/use-user'
import { getDefaultSignOutRedirect } from '@/lib/auth/redirect'

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
        <span className="border-brand-200 bg-brand-50 text-brand-600 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase">
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
        <Folder size={16} className="text-muted-foreground shrink-0" />
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
          className="border-brand-400 flex-1 border-b bg-transparent text-sm outline-none"
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
        <ContextMenuPrimitive.Content className="border-border bg-popover z-50 min-w-[120px] rounded-md border p-1 shadow-md">
          <ContextMenuPrimitive.Item
            className="text-destructive hover:bg-destructive/10 flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none"
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
  const locale = useLocale()
  const pathname = usePathname()
  const { data: user } = useCurrentUser()
  const { data: balance } = useCreditBalance(Boolean(user?.isAuthenticated))
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get('folder')
  const { data: folders } = useFolders()
  const createFolder = useCreateFolder()
  const signOutRedirect = getDefaultSignOutRedirect(locale)

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
      <aside className="border-border bg-background flex h-screen w-[300px] flex-col border-r">
        {/* ── Header ────────────────────────────────────── */}
        <div className="px-4 pt-5 pb-2">
          <Link href="/explore" className="block">
            <h1>
              <BrandMark withLogo className="text-foreground text-sm" />
            </h1>
          </Link>
          <p className="text-muted-foreground mt-0.5 text-[8px]">{t('personal')}</p>
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
              <span className="text-muted-foreground text-xs font-medium">
                {t('workspace')}
              </span>
              <button
                onClick={handleCreateFolder}
                className="text-muted-foreground hover:text-foreground transition-colors"
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
              <p className="text-muted-foreground/60 mt-2 px-3 text-xs">
                {t('noFolders')}
              </p>
            )}
          </div>
        </nav>

        {/* ── Bottom Links ──────────────────────────────── */}
        <div className="border-border space-y-0.5 border-t px-2 py-3">
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
        <div className="border-border space-y-2 border-t px-3 py-3">
          {/* 用户信息 */}
          <div className="space-y-2 px-1">
            <Link
              href="/account"
              className="border-border hover:bg-muted/60 flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors"
            >
              <Avatar size="sm" className="shrink-0">
                {user?.avatarUrl && (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? 'Guest'} />
                )}
                <AvatarFallback>{user?.name?.charAt(0) ?? 'G'}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-foreground truncate text-sm font-medium">
                    {user?.name ?? 'Guest'}
                  </p>
                  <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    {user?.plan ? t('planBadge', { plan: user.plan }) : t('freePlan')}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 truncate text-[11px]">
                  {user?.isAuthenticated ? user.email || t('signedIn') : t('guestMode')}
                </p>
              </div>

              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </Link>

            {user?.isAuthenticated ? (
              <>
                <div className="space-y-1.5">
                  <Link
                    href="/billing"
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[11px] transition-colors ${
                      pathname === '/billing'
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Coins size={12} />
                      {t('creditsEntry')}
                    </span>
                    <span className="text-foreground font-medium">
                      {balance?.availableCredits?.toLocaleString() ?? '...'}
                    </span>
                  </Link>

                  <Link
                    href="/pricing"
                    className="border-border text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-between rounded-lg border px-3 py-2.5 text-[11px] transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} />
                      {t('upgradeEntry')}
                    </span>
                    <span className="text-brand-600 font-medium">
                      {t('upgradeCta')}
                    </span>
                  </Link>
                </div>

                <SignOutAction
                  redirectUrl={signOutRedirect}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-1 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut size={12} />
                  {t('signOut')}
                </SignOutAction>
              </>
            ) : (
              <Link
                href="/sign-in?redirect_url=/workspace"
                className="text-brand-600 hover:text-brand-700 inline-flex px-1 text-[11px] font-medium transition"
              >
                {t('signIn')}
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
