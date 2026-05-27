# apps/web/components/canvas/

> L2 | 父级: apps/web/components/CLAUDE.md

画布引擎组件

## 成员清单

```
canvas.tsx              — Canvas 主画布组件 (ReactFlow 包裹，右键菜单，拖线到空白处按端口类型筛选有效节点并自动补默认连线，辅助线，顶部/底部工具栏，本地草稿自动保存 + 离场云端兜底，快捷键与左下角前三次淡色提示，并在运行态统一禁删节点/连线)
editor-particle-field.tsx — EditorParticleField 编辑器交互粒子背景层 (跟随视口平移/缩放的自绘点阵，鼠标邻域浮起、加粗、变大并在离开后缓动恢复)
canvas-controls.tsx     — CanvasControls 缩放/居中控制栏
node-entry-config.ts    — 画布节点入口共享配置 (快捷栏/右键菜单的可见项、顺序、分组语义、入口图标，含 Merge 工具入口；右键菜单的 Input 分组现包含 Text Input / Image Input / Mask 三项)
canvas-toolbar.tsx      — CanvasToolbar 底部节点拖放工具栏 (指针工具 + 共享入口配置驱动的快捷节点)
canvas-top-toolbar.tsx  — CanvasTopToolbar 顶部操作栏 (Run/Stop/手动保存/Import/Export/History/Locale/User，并在返回工作区前对未保存改动做一次确认；Run 前现会做文本上限与工作流积分预检，避免“白等几分钟后才因超长提示词或余额不足失败”)
context-menu.tsx        — CanvasContextMenu 画布空白区右键菜单 (共享入口配置驱动，支持按当前拖线端口过滤有效节点后再展示顶层分类 + 右侧子菜单)
node-context-menu.tsx   — NodeContextMenu 节点右键菜单 (复制/删除，运行态禁用删除)
helper-lines.tsx        — HelperLines 对齐辅助线渲染
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
