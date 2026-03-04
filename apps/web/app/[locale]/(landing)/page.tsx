/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 Landing Page 首页
 * [POS]: (landing) 路由组的首页，SSG 渲染
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <h1 className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-center text-5xl font-bold text-transparent md:text-7xl">
        Nano Banana Canvas
      </h1>
      <p className="mt-6 max-w-2xl text-center text-lg text-white/60">
        Visual AI Workflow Platform — Build, share, and run AI workflows with
        drag &amp; drop
      </p>
      <div className="mt-10 flex gap-4">
        <a
          href="/en/sign-up"
          className="rounded-lg bg-[#6366F1] px-6 py-3 font-medium text-white transition-colors hover:bg-[#4F46E5]"
        >
          Get Started Free
        </a>
      </div>
    </main>
  )
}
