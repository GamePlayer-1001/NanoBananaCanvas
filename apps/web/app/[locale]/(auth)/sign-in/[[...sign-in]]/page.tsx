/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignIn 组件
 * [OUTPUT]: 对外提供登录页面
 * [POS]: (auth) 路由组的登录页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn />
}
