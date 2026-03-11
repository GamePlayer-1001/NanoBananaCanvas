# apps/web/components/canvas/

> L2 | 父级: apps/web/components/CLAUDE.md

画布引擎组件

## 成员清单

```
canvas.tsx              — Canvas 主画布组件 (ReactFlow 包裹，右键菜单，辅助线，顶部/底部工具栏，自动保存，快捷键)
canvas-controls.tsx     — CanvasControls 缩放/居中控制栏
canvas-toolbar.tsx      — CanvasToolbar 底部节点拖放工具栏 (指针工具 + 从 plugin-registry 派生节点工具)
canvas-top-toolbar.tsx  — CanvasTopToolbar 顶部操作栏 (Run/Stop/Import/Export/API Key)
context-menu.tsx        — CanvasContextMenu 画布空白区右键菜单 (添加 Text Input/LLM/Display)
node-context-menu.tsx   — NodeContextMenu 节点右键菜单 (复制/删除)
helper-lines.tsx        — HelperLines 对齐辅助线渲染
api-key-dialog.tsx      — ApiKeyDialog OpenRouter API Key 配置对话框 (保存/测试/密码显隐)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
