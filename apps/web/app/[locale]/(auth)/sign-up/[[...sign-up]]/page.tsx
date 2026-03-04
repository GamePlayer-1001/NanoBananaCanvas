/**
 * [INPUT]: 依赖 @clerk/nextjs 的 SignUp 组件
 * [OUTPUT]: 对外提供注册页面
 * [POS]: (auth) 路由组的注册页，Clerk catch-all 路由
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp />
}
