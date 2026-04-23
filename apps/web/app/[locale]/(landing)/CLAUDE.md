# (landing)/
> L2 | 父级: apps/web/app/CLAUDE.md

成员清单
layout.tsx: Landing 深色布局壳层，负责 landing-dark 风格边界
page.tsx: Landing 首页，承载 Hero、模型动态脑图、Features、Pricing 四档、Testimonials、FAQ、CTA 与页脚
pricing/page.tsx: 动态定价页，服务端读取 Stripe 套餐价格并按 `CF-IPCountry` 自动解析展示币种，失败时保留 Free 入口
privacy/page.tsx: 隐私政策页面
terms/page.tsx: 服务条款页面

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
