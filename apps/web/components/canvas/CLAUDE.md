# apps/web/components/canvas/

> L2 | 父级: apps/web/components/CLAUDE.md

画布引擎组件

## 成员清单

```
canvas.tsx              — Canvas 主画布组件 (ReactFlow 包裹，右键菜单，拖线到空白处按端口类型筛选有效节点并自动补默认连线，辅助线，顶部/底部工具栏，登录态约束的自动保存，快捷键与左下角前三次淡色提示)
canvas-controls.tsx     — CanvasControls 缩放/居中控制栏
node-entry-config.ts    — 画布节点入口共享配置 (快捷栏/右键菜单的可见项、顺序、分组语义、入口图标，含 Merge 工具入口)
canvas-toolbar.tsx      — CanvasToolbar 底部节点拖放工具栏 (指针工具 + 共享入口配置驱动的快捷节点)
canvas-top-toolbar.tsx  — CanvasTopToolbar 顶部操作栏 (Run/Stop/Import/Export/History/Locale/User)
context-menu.tsx        — CanvasContextMenu 画布空白区右键菜单 (共享入口配置驱动，支持按当前拖线端口过滤有效节点后再展示顶层分类 + 右侧子菜单)
node-context-menu.tsx   — NodeContextMenu 节点右键菜单 (复制/删除)
helper-lines.tsx        — HelperLines 对齐辅助线渲染
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
