# apps/web/hooks/

> L2 | 父级: apps/web/CLAUDE.md

自定义 React Hooks — 画布交互 + TanStack Query 数据层

## 成员清单

```
use-context-menu.ts      — useContextMenu 画布右键菜单状态管理 (pane/node 菜单切换，Escape 关闭)
use-agent-selection-context.ts — useAgentSelectionContext 选中节点语境桥接 (从 Flow/Execution/模板上下文压缩当前节点快照，并同步到 AgentStore)
use-agent-session.ts     — useAgentSession Agent 会话编排 (summary -> multi-plan|template-plan|diagnose|optimize|explain -> prompt refine/confirm -> apply -> run，创建类请求可先自动落工作流，prompt/高风险请求改为聊天确认，并把助手当前平台/用户模式与模型选择传入请求链路)
use-agent-task-summary.ts — useAgentTaskSummary Agent 执行/任务摘要层 (执行态 + 异步任务态 -> 自然语言反馈，并在结果完成后生成“下一步建议”续写提示)
use-agent-task-summary.test.tsx — useAgentTaskSummary 回归测试 (验证图片任务完成后会产出基于结果继续的建议消息，失败任务保持诊断语气)
use-workflow-executor.ts — useWorkflowExecutor 工作流执行 hook (连接 WorkflowExecutor 引擎与 Zustand Store，含 toast 通知；用户 abort 时会同步下发任务 cancel，避免后端异步任务继续占坑)
use-workflow-executor.test.tsx — useWorkflowExecutor 中止回归测试 (验证 abort 会取消活跃任务并记录 aborted 历史)
use-auto-save.ts         — useAutoSave 防抖自动保存 + 页面加载恢复 (400ms local / 1200ms cloud + 页面离场 keepalive 冲刷，并同步模板元数据与审计轨迹)
use-canvas-shortcuts.ts  — useCanvasShortcuts 画布全局快捷键 (Ctrl+Z 撤销/Ctrl+Shift+Z 重做/Ctrl+Enter 执行/Esc 中断/Ctrl+S 导出/Ctrl+O 导入)
use-thumbnail-capture.ts — useThumbnailCapture 画布截图生成 (html-to-image → R2 上传，15s 节流 + 尾触发 + 工作区缓存失效)
use-media-query.ts       — useMediaQuery / useIsDesktop 响应式媒体查询 hook
use-workflows.ts         — useWorkflows / useWorkflow / useCreateWorkflow / useImportLocalWorkflow / useUpdateWorkflow / useDeleteWorkflow (TanStack Query, folder 筛选 + 创建时继承当前文件夹 + 本地草稿导入账户 + 模板起手创建)
use-folders.ts           — useFolders / useCreateFolder / useUpdateFolder / useDeleteFolder / useMoveWorkflowToFolder (TanStack Query)
use-explore.ts           — useExplore / useExploreSearch / useToggleLike / useToggleFavorite / useCloneWorkflow (TanStack Query)
use-user.ts              — useCurrentUser 当前用户数据 (TanStack Query)
use-billing.ts           — useCreditBalance / useDailySigninStatus 本地账本余额与每日签到状态 (TanStack Query)
use-model-configs.ts     — useModelConfigs API 接入配置数据 (登录读账户配置，访客返回空结果；按能力聚合多配置 + 配置 ID 查找)
use-user-preferences.ts  — useUserPreferences 本地用户偏好设置 (新手提示显隐 + 引导重置)
use-user-key-onboarding.tsx — useUserKeyOnboarding 生成类节点自有 API Key 引导 (前三次缺少配置时提示、显式保存工作流并跳转到账户模型偏好)
use-categories.ts        — useCategories 分类数据 (TanStack Query, 5min staleTime)
use-ai-models.ts         — useAIModels AI 模型目录 (TanStack Query, 10min staleTime)
use-mobile.ts            — useIsMobile 移动端断点检测 (768px, matchMedia 监听)
use-notifications.ts     — useNotifications / useMarkAsRead 通知数据 (TanStack Query)
use-upload.ts            — useUpload 文件上传 hook (XMLHttpRequest + progress 追踪)
use-tasks.ts             — useTasks / useTask / useTaskPolling / useSubmitTask / useCancelTask (TanStack Query, 动态轮询)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
