/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignUp 组件，
 *          依赖 @/lib/clerk-appearance 的 authAppearance，
 *          依赖 @/components/auth/auth-header 和 auth-footer
 * [OUTPUT]: 对外提供注册页面 (分屏布局右侧)
 * [POS]: (auth) 路由组的注册页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { SignUp } from '@clerk/nextjs'

import { authAppearance } from '@/lib/clerk-appearance'
import { AuthHeader } from '@/components/auth/auth-header'
import { AuthFooter } from '@/components/auth/auth-footer'

/* ─── Page ───────────────────────────────────────────── */

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center px-4">
      <AuthHeader />
      <SignUp appearance={authAppearance} />
      <AuthFooter mode="sign-up" />
    </div>
  )
}
