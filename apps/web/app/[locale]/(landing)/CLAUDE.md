# (landing)/
> L2 | 父级: apps/web/app/CLAUDE.md

成员清单
layout.tsx: Landing 深色布局壳层，负责 `landing-dark` 风格边界，并保持公开页不注入认证运行时
page.tsx: Landing 首页，默认静态输出 Hero、Features、人格分层 Pricing、Testimonials、FAQ 与页脚，并把模型动态图延后到客户端加载以换取更稳的首屏性能；所有公开 CTA 已收口为首页锚点或登录/Stripe Portal 分流
privacy/page.tsx: 隐私政策页面
terms/page.tsx: 服务条款页面

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
