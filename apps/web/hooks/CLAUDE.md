# apps/web/hooks/

> L2 | 父级: apps/web/CLAUDE.md

自定义 React Hooks — 画布交互 + TanStack Query 数据层

## 成员清单

```
use-context-menu.ts      — useContextMenu 画布右键菜单状态管理 (pane/node 菜单切换，Escape 关闭)
use-workflow-executor.ts — useWorkflowExecutor 工作流执行 hook (连接 WorkflowExecutor 引擎与 Zustand Store，含 toast 通知)
use-auto-save.ts         — useAutoSave 防抖自动保存 + 页面加载恢复 (localStorage + 同源凭据云保存)
use-canvas-shortcuts.ts  — useCanvasShortcuts 画布全局快捷键 (Ctrl+Z 撤销/Ctrl+Shift+Z 重做/Ctrl+Enter 执行/Esc 中断/Ctrl+S 导出/Ctrl+O 导入)
use-thumbnail-capture.ts — useThumbnailCapture 画布截图生成 (html-to-image → R2 上传，60s 节流)
use-media-query.ts       — useMediaQuery / useIsDesktop 响应式媒体查询 hook
use-workflows.ts         — useWorkflows / useWorkflow / useCreateWorkflow / useImportLocalWorkflow / useUpdateWorkflow / useDeleteWorkflow (TanStack Query, folder 筛选 + 本地草稿导入账户)
use-folders.ts           — useFolders / useCreateFolder / useUpdateFolder / useDeleteFolder / useMoveWorkflowToFolder (TanStack Query)
use-explore.ts           — useExplore / useExploreSearch / useToggleLike / useToggleFavorite / useCloneWorkflow (TanStack Query)
use-user.ts              — useCurrentUser 当前用户数据 (TanStack Query)
use-billing.ts           — useCreditBalance 本地账本余额摘要 (TanStack Query)
use-model-configs.ts     — useModelConfigs 账号 API 接入配置数据 (TanStack Query + 按能力聚合多配置 + 配置 ID 查找)
use-categories.ts        — useCategories 分类数据 (TanStack Query, 5min staleTime)
use-ai-models.ts         — useAIModels AI 模型目录 (TanStack Query, 10min staleTime)
use-mobile.ts            — useIsMobile 移动端断点检测 (768px, matchMedia 监听)
use-notifications.ts     — useNotifications / useMarkAsRead 通知数据 (TanStack Query)
use-upload.ts            — useUpload 文件上传 hook (XMLHttpRequest + progress 追踪)
use-tasks.ts             — useTasks / useTask / useTaskPolling / useSubmitTask / useCancelTask (TanStack Query, 动态轮询)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
