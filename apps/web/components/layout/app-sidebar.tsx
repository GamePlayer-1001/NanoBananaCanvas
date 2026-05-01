/**
 * [INPUT]: 依赖 next-intl 的 useTranslations，
 *          依赖 @/i18n/navigation 的 Link / usePathname，
 *          依赖 lucide-react 图标，
 *          依赖 @/components/ui/avatar，
 *          依赖 @/components/shared/brand-mark，
 *          依赖 @/components/auth/sign-out-action，
 *          依赖 @/hooks/use-folders，依赖 @/hooks/use-user，依赖 sonner 的 toast，
 *          依赖 @/lib/auth/redirect 的 getDefaultSignOutRedirect
 * [OUTPUT]: 对外提供 AppSidebar 核心侧边栏组件 (导航/文件夹创建/重命名/删除弹窗 + 账户入口/仪表盘入口/订阅入口)
 * [POS]: layout 的核心导航组件，被 (app)/layout.tsx 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

'use client'

import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
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
  Pencil,
  Trash2,
} from 'lucide-react'

import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { SignOutAction } from '@/components/auth/sign-out-action'
import { BrandMark } from '@/components/shared/brand-mark'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from '@/hooks/use-folders'
import { useCreditBalance, useDailySigninStatus } from '@/hooks/use-billing'
import { useCurrentUser } from '@/hooks/use-user'
import { getDefaultSignOutRedirect } from '@/lib/auth/redirect'
import { queryKeys } from '@/lib/query/keys'

/* ─── Types ──────────────────────────────────────────── */

interface NavItem {
  href: string
  icon: React.ElementType
  labelKey: string
  badge?: string
}

interface SidebarFolder {
  id: string
  name: string
  project_count?: number
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
  renameLabel,
  deleteLabel,
  onRename,
  onDelete,
}: {
  folder: SidebarFolder
  active: boolean
  renameLabel: string
  deleteLabel: string
  onRename: (folder: SidebarFolder) => void
  onDelete: (folder: SidebarFolder) => void
}) {
  /* 正常态: 右键菜单 */
  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger asChild>
        <Link
          href={`/workspace?folder=${folder.id}`}
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
            className="hover:bg-muted flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none"
            onSelect={() => onRename(folder)}
          >
            <Pencil size={14} className="mr-2" />
            {renameLabel}
          </ContextMenuPrimitive.Item>
          <ContextMenuPrimitive.Item
            className="text-destructive hover:bg-destructive/10 flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none"
            onSelect={() => onDelete(folder)}
          >
            <Trash2 size={14} className="mr-2" />
            {deleteLabel}
          </ContextMenuPrimitive.Item>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  )
}

function FolderNameDialog({
  open,
  title,
  description,
  initialName,
  confirmLabel,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  initialName: string
  confirmLabel: string
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
}) {
  const tc = useTranslations('common')
  const [name, setName] = useState(initialName)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(initialName)
    }
    onOpenChange(nextOpen)
  }

  const handleConfirm = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{title}</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || pending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteFolderDialog({
  folder,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  folder: SidebarFolder | null
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useTranslations('sidebar')
  const tc = useTranslations('common')
  const projectCount = folder?.project_count ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('deleteFolderTitle')}</DialogTitle>
          <DialogDescription>
            {projectCount > 0
              ? t('deleteFolderWithProjectsDescription', {
                  name: folder?.name ?? '',
                  count: projectCount,
                })
              : t('deleteFolderDescription', { name: folder?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {tc('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Component ──────────────────────────────────────── */

export function AppSidebar() {
  const t = useTranslations('sidebar')
  const queryClient = useQueryClient()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { data: user } = useCurrentUser()
  const { data: balance } = useCreditBalance(Boolean(user?.isAuthenticated))
  const { data: signinStatus } = useDailySigninStatus(Boolean(user?.isAuthenticated))
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get('folder')
  const { data: folders } = useFolders()
  const createFolder = useCreateFolder()
  const updateFolder = useUpdateFolder()
  const deleteFolder = useDeleteFolder()
  const signOutRedirect = getDefaultSignOutRedirect(locale)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<SidebarFolder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SidebarFolder | null>(null)
  const activeAccountTab = searchParams.get('tab')
  const isDashboardEntryActive = pathname === '/account' && activeAccountTab === 'dashboard'
  const isSubscriptionEntryActive = pathname === '/account' && activeAccountTab === 'subscription'
  const claimSignin = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/credits/signin', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
      }
      return body.data as { creditsAwarded: number }
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.balance() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.billing.signinStatus() }),
      ])
      toast.success(t('signinSuccess', { count: result.creditsAwarded }))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
  const signinState = signinStatus?.status ?? 'available'
  const signinButtonDisabled =
    !user?.isAuthenticated ||
    signinState === 'claimed' ||
    signinState === 'unavailable' ||
    claimSignin.isPending
  const signinButtonLabel =
    signinState === 'claimed'
      ? t('signedInToday')
      : signinState === 'unavailable'
        ? t('signinUnavailable')
        : t('signinAction')
  const signinButtonVariant =
    signinState === 'available' ? 'default' : 'outline'
  const signinButtonClassName =
    signinState === 'claimed'
      ? 'border-amber-300 bg-white text-amber-700'
      : signinState === 'unavailable'
        ? 'border-amber-200 bg-amber-100 text-amber-500'
        : 'bg-amber-600 text-white hover:bg-amber-700'

  const handleCreateFolder = () => {
    setCreateDialogOpen(true)
  }

  const handleCreateFolderConfirm = (name: string) => {
    createFolder.mutate(
      { name },
      {
        onSuccess: () => {
          toast.success(t('folderCreated'))
          setCreateDialogOpen(false)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const handleRenameFolderConfirm = (name: string) => {
    if (!renameTarget) return

    updateFolder.mutate(
      { id: renameTarget.id, name },
      {
        onSuccess: () => {
          toast.success(t('folderRenamed'))
          setRenameTarget(null)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const handleDeleteFolderConfirm = () => {
    if (!deleteTarget) return

    deleteFolder.mutate(deleteTarget.id, {
      onSuccess: () => {
        if (activeFolderId === deleteTarget.id) {
          router.replace('/workspace')
        }
        toast.success(t('folderDeleted'))
        setDeleteTarget(null)
      },
      onError: (err) => toast.error(err.message),
    })
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
              {(folders as SidebarFolder[] | undefined)?.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  active={pathname === '/workspace' && activeFolderId === folder.id}
                  renameLabel={t('renameFolder')}
                  deleteLabel={t('deleteFolder')}
                  onRename={setRenameTarget}
                  onDelete={setDeleteTarget}
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
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-amber-800">{t('creditsTitle')}</p>
                <div className="mt-1 flex items-center gap-2 text-amber-700">
                  <Coins size={16} />
                  <span className="text-lg font-semibold">
                    {balance?.availableCredits ?? 0}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant={signinButtonVariant}
                disabled={signinButtonDisabled}
                onClick={() => claimSignin.mutate()}
                className={signinButtonClassName}
              >
                {signinButtonLabel}
              </Button>
            </div>
          </div>

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
                    href="/account?tab=dashboard"
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[11px] transition-colors ${
                      isDashboardEntryActive
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
                    href="/account?tab=subscription"
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-[11px] transition-colors ${
                      isSubscriptionEntryActive
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={12} />
                      {t('upgradeEntry')}
                    </span>
                    <span className="font-medium text-brand-600">
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

      <FolderNameDialog
        open={createDialogOpen}
        title={t('createFolderTitle')}
        description={t('createFolderDescription')}
        initialName={t('newFolder')}
        confirmLabel={t('createFolderConfirm')}
        pending={createFolder.isPending}
        onOpenChange={setCreateDialogOpen}
        onConfirm={handleCreateFolderConfirm}
      />

      <FolderNameDialog
        key={renameTarget?.id ?? 'rename-folder'}
        open={!!renameTarget}
        title={t('renameFolderTitle')}
        description={t('renameFolderDescription')}
        initialName={renameTarget?.name ?? ''}
        confirmLabel={t('renameFolderConfirm')}
        pending={updateFolder.isPending}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
        onConfirm={handleRenameFolderConfirm}
      />

      <DeleteFolderDialog
        folder={deleteTarget}
        open={!!deleteTarget}
        pending={deleteFolder.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDeleteFolderConfirm}
      />
    </>
  )
}
