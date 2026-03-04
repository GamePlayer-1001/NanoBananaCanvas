# apps/web/hooks/

> L2 | 父级: apps/web/CLAUDE.md

自定义 React Hooks

## 成员清单

```
use-context-menu.ts      — useContextMenu 画布右键菜单状态管理 (pane/node 菜单切换，Escape 关闭)
use-workflow-executor.ts — useWorkflowExecutor 工作流执行 hook (连接 WorkflowExecutor 引擎与 Zustand Store，含 toast 通知)
use-auto-save.ts         — useAutoSave 防抖自动保存 + 页面加载恢复 (localStorage, 1s 防抖)
use-canvas-shortcuts.ts  — useCanvasShortcuts 画布全局快捷键 (Ctrl+Enter 执行/Esc 中断/Ctrl+S 导出/Ctrl+O 导入)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
