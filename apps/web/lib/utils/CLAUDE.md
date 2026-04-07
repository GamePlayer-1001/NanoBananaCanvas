# apps/web/lib/utils/

> L2 | 父级: apps/web/lib/CLAUDE.md

画布与节点通用工具函数

## 成员清单

```
create-node.ts        — createNode() 节点工厂 (从 plugin-registry 获取 defaults)
get-helper-lines.ts   — getHelperLines() 对齐辅助线计算 (5 种对齐 + 吸附)
simple-markdown.tsx   — renderSimpleMarkdown() 轻量 Markdown→React 渲染器
validate-connection.ts — isValidConnection() 连接验证 (从 plugin-registry 获取 ports，拒绝重复边/输入端口多占用/类型不兼容)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
