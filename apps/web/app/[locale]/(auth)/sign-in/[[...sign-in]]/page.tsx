/**
 * [INPUT]: 依赖 @/components/auth/auth-clerk-card 的 AuthClerkCard，
 *          依赖 @/components/auth/auth-header 和 auth-footer
 * [OUTPUT]: 对外提供登录页面 (分屏布局右侧)
 * [POS]: (auth) 路由组的登录页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { AuthClerkCard } from '@/components/auth/auth-clerk-card'
import { AuthHeader } from '@/components/auth/auth-header'
import { AuthFooter } from '@/components/auth/auth-footer'

/* ─── Page ───────────────────────────────────────────── */

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center px-4">
      <AuthHeader />
      <AuthClerkCard mode="sign-in" />
      <AuthFooter mode="sign-in" />
    </div>
  )
}
