# apps/web/components/

> L2 | 父级: apps/web/CLAUDE.md

React 组件库

## 成员清单

```
error-boundary.tsx — React 错误边界，捕获渲染异常并显示 fallback UI
error-boundary-fallback.tsx — 错误边界本地化 fallback UI，消费 common 文案并复用 retry 语义
locale-switcher.tsx — 语言切换器，下拉展示所有启用 locale，使用 @/i18n/navigation 路由切换
canvas/            — 画布引擎组件 (Canvas + TopToolbar + Toolbar + Controls + ContextMenu)
nodes/             — 节点组件 (BaseNode + 输入/AI/展示/控制流/合并工具节点)
edges/             — 连线组件 (CustomEdge 贝塞尔曲线)
layout/            — 布局组件 (LandingNav + LandingFooter + AppSidebar)
auth/              — 认证组件 (AuthShell 双栏认证壳，承载登录/注册视觉骨架)
landing/           — Landing 页面组件 (HeroSection + FloatingCards + CtaSection)
explore/           — 探索页组件 (ExploreContent + ExploreTabs + ExploreGrid)
workflows/         — 工作流分享组件 (WorkflowsContent)
video-analysis/    — 视频分析组件 (UploadArea + ModelSelector + AnalysisHistory)
workspace/         — 工作区组件 (WorkspaceHeader + WorkspaceGrid + ProjectCard + NewProjectDialog)
profile/           — 个人中心组件 (ProfileModal + ProfileTab + ModelPreferencesTab + WorksTab + NotificationsTab)
shared/            — 共享组件 (EmptyState + VideoCard + WorkflowCard + CategoryBadge)
ui/                — shadcn/ui 自动管理的基础组件 (21 个: button/input/card/badge/
                     dialog/dropdown-menu/tabs/sonner/skeleton/avatar/separator/
                     scroll-area/tooltip/label/sidebar/sheet/select/switch/
                     progress/breadcrumb/collapsible)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
