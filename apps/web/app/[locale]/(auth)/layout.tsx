/**
 * [INPUT]: 依赖 react 的 ReactNode
 * [OUTPUT]: 对外提供认证路由组布局，统一暗色背景与最小容器
 * [POS]: [locale]/(auth) 路由组的结构壳层，被 sign-in/sign-up 页面复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090d] text-white">
      {children}
    </div>
  )
}
