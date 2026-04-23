# (landing)/
> L2 | 父级: apps/web/app/CLAUDE.md

成员清单
layout.tsx: Landing 深色布局壳层，负责 landing-dark 风格边界
page.tsx: Landing 首页，承载 Hero、模型区、功能区、定价摘要、Proof、FAQ、CTA 与页脚
features/page.tsx: Features 公开总览页，承接导航与 sitemap 的功能入口
features/visual-workflow/page.tsx: Visual Workflow 公开细分页，解释节点画布生产逻辑
features/image-generation/page.tsx: Image Generation 公开细分页，解释图像生成与融合逻辑
features/video-generation/page.tsx: Video Generation 公开细分页，解释静帧到动态镜头链路
features/model-routing/page.tsx: Model Routing 公开细分页，解释多 Provider 路由边界
models/page.tsx: Models 公开总览页，承接模型生态解释与真实支持边界
docs/page.tsx: Docs 公开入口页，承接 Resources 菜单与后续文档树
contact/page.tsx: Contact 公开联系页，展示四个平台联系方式与 Organization JSON-LD
about/page.tsx: About 公开介绍页，承接页脚公司信息入口
pricing/page.tsx: 动态定价页，服务端读取 Stripe 套餐价格并按 `CF-IPCountry` 自动解析展示币种
privacy/page.tsx: 隐私政策页面
terms/page.tsx: 服务条款页面
refund-policy/page.tsx: Refund Policy 公开法律资源页，解释退款边界
acceptable-use/page.tsx: Acceptable Use 公开法律资源页，解释平台使用边界
cookie-settings/page.tsx: Cookie Settings 公开法律资源页，解释 Cookie 与偏好设置边界

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
