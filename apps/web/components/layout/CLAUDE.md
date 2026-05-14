# apps/web/components/layout/

> L2 | 父级: apps/web/components/CLAUDE.md

布局组件 — 页面级导航与结构框架

## 成员清单

```
landing-nav.tsx    — LandingNav Landing 全宽导航栏 (Logo + 功能/定价/模型首页锚点 + 多语言切换 + 主 CTA；公开子页导航已收口)
landing-footer.tsx — LandingFooter Landing 全宽页脚 (左侧应用信息 + 右侧产品/法务链接 + 社媒入口 + 版权；仅保留首页锚点与服务条款/隐私政策)
app-sidebar.tsx    — AppSidebar 应用侧边栏 300px (导航/工作区/文件夹新建/重命名/删除弹窗 + 顶部积分余额/签到入口 + 整块账户入口 + 登录态仪表盘/升级入口；当前通过 `bootstrap/sidebar` 聚合接口把用户/积分/签到/文件夹 4 请求收口为 1 请求)
mobile-header.tsx  — MobileHeader 移动端顶栏 (汉堡菜单 + Logo + Sheet 抽屉复用 AppSidebar，< lg 可见)
global-promo-bar.tsx — GlobalPromoBar 工作台宣传条（挂在整个应用顶层；下方侧边栏与主内容区按剩余高度自适应，避免把通知条错误塞进 Explore 页面本身）
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
