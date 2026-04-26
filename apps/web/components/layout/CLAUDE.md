# apps/web/components/layout/

> L2 | 父级: apps/web/components/CLAUDE.md

布局组件 — 页面级导航与结构框架

## 成员清单

```
landing-nav.tsx    — LandingNav Landing 全宽导航栏 (Logo + 模型/功能/定价真实路由 + Resources 下拉 + 多语言切换 + 主 CTA，企业版入口已移除)
landing-footer.tsx — LandingFooter Landing 全宽页脚 (品牌列 + 产品/资源/公司/法务链接 + 社媒入口 + 版权；全部落到真实公开子页面)
app-sidebar.tsx    — AppSidebar 应用侧边栏 300px (导航/工作区/文件夹新建/重命名/删除弹窗 + 整块账户入口 + 登录态仪表盘/升级入口)
mobile-header.tsx  — MobileHeader 移动端顶栏 (汉堡菜单 + Logo + Sheet 抽屉复用 AppSidebar，< lg 可见)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
