# (landing)/
> L2 | 父级: apps/web/app/CLAUDE.md

成员清单
layout.tsx: Landing 深色布局壳层，负责 landing-dark 风格边界
page.tsx: Landing 首页，承载 Hero、模型动态脑图、Features、Pricing 四档、Testimonials、FAQ 与页脚，CTA 召回区已移除
features/page.tsx: `/features` 公开功能详情页，承接功能导航、SEO 与多模态工作流说明
models/page.tsx: `/models` 公开模型罗列页，承接 GPT Image 2 / OpenAI / Kling / Runway / Wan / Qwen 等模型查询
docs/page.tsx: `/docs` 公开文档导航页，承接资源菜单中的文档入口
community/page.tsx: `/community` 公开社区说明页，引导到 Explore / Workflows / Contact
about/page.tsx: `/about` 公开关于我们页面，说明产品定位、设计原则与适用人群
pricing/page.tsx: 动态定价页，服务端读取 Stripe 套餐价格并按 `CF-IPCountry` 自动解析展示币种，失败时保留 Free 入口
contact/page.tsx: `/contact` 公开联系我们页面，复用联系组件并承接资源入口
privacy/page.tsx: 隐私政策页面
terms/page.tsx: 服务条款页面
refund-policy/page.tsx: 退款政策页面，说明订阅/一次性套餐/积分包退款边界
acceptable-use/page.tsx: 合理使用页面，说明允许/限制/公开分享边界
cookies/page.tsx: Cookie 设置说明页面，解释必要/分析/偏好存储分类

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
