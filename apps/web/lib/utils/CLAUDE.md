# apps/web/lib/utils/

> L2 | 父级: apps/web/lib/CLAUDE.md

画布与节点通用工具函数

## 成员清单

```
create-node.ts        — createNode() 节点工厂 (从 plugin-registry 获取 defaults)
create-node.test.ts   — createNode() 节点工厂测试
get-helper-lines.ts   — getHelperLines() 对齐辅助线计算 (5 种对齐 + 吸附)
resolve-auto-connect-handle.ts — resolveAutoConnectTargetHandle()/resolveAutoConnectSourceHandle() 自动推断拖线创建节点时的默认输入/输出口
resolve-auto-connect-handle.test.ts — resolveAutoConnectTargetHandle()/resolveAutoConnectSourceHandle() 回归测试
filter-node-entry-groups.ts — filterNodeEntryGroupsByPort() 按当前拖线端口类型筛选可创建节点
filter-node-entry-groups.test.ts — filterNodeEntryGroupsByPort() 回归测试
simple-markdown.tsx   — renderSimpleMarkdown() 轻量 Markdown→React 渲染器
format-time.ts        — formatTime() 时间格式化工具
validate-connection.ts — isValidConnection() 连接验证 (从 plugin-registry 获取 ports，拒绝重复边/输入端口多占用/类型不兼容)
validate-connection.test.ts — isValidConnection() 连接验证测试
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
