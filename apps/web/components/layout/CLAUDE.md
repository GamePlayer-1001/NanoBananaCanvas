# apps/web/components/layout/

> L2 | 父级: apps/web/components/CLAUDE.md

布局组件 — 页面级导航与结构框架

## 成员清单

```
landing-nav.tsx    — LandingNav Landing 导航栏，提供真实锚点/公开页链接、资源下拉与双 CTA
landing-footer.tsx — LandingFooter Landing 页脚，提供 Product/Resources/Company/Legal/Social 真实出口，Legal 覆盖 Terms/Privacy/Refund/Acceptable Use/Cookie
app-sidebar.tsx    — AppSidebar 应用侧边栏 200px (导航/工作区/底部链接/用户 Footer + 搜索命令入口 + 登录/登出状态入口 + 登录态积分/升级入口)
mobile-header.tsx  — MobileHeader 移动端顶栏 (汉堡菜单 + Logo + Sheet 抽屉复用 AppSidebar，< lg 可见)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
