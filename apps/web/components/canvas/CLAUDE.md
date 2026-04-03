# apps/web/components/canvas/

> L2 | 父级: apps/web/components/CLAUDE.md

画布引擎组件

## 成员清单

```
canvas.tsx              — Canvas 主画布组件 (ReactFlow 包裹，右键菜单，辅助线，顶部/底部工具栏，自动保存，快捷键)
canvas-controls.tsx     — CanvasControls 缩放/居中控制栏
node-entry-config.ts    — 画布节点入口共享配置 (快捷栏/右键菜单的可见项、顺序、分组语义单一真相源)
canvas-toolbar.tsx      — CanvasToolbar 底部节点拖放工具栏 (指针工具 + 共享入口配置驱动的快捷节点)
canvas-top-toolbar.tsx  — CanvasTopToolbar 顶部操作栏 (Run/Stop/Import/Export/History/Locale/User)
context-menu.tsx        — CanvasContextMenu 画布空白区右键菜单 (共享入口配置驱动，当前隐藏分组展示)
node-context-menu.tsx   — NodeContextMenu 节点右键菜单 (复制/删除)
helper-lines.tsx        — HelperLines 对齐辅助线渲染
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
