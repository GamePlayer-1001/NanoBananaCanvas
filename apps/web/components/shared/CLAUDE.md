# apps/web/components/shared/

> L2 | 父级: apps/web/CLAUDE.md

跨页面共享的业务组件 — 被多个页面消费的可复用 UI 单元

## 成员清单

```
brand-mark.tsx      — BrandMark 品牌标识组件 (brand/logo-1024.png 图形 logo + 字标 / logo only 统一出口)
empty-state.tsx    — EmptyState 空状态占位组件 (图标 + 标题 + 描述 + 操作按钮)
video-card.tsx     — VideoCard 广场通用卡片 (兼容工作流、站内公开作品与外部导入作品；上传封面优先，视频缺省时在客户端抓取首帧图回退，避免浏览器自动预览不稳定)
workflow-card.tsx   — WorkflowCard 工作流卡片 (缩略图 + 分类 + 作者 + 点赞/使用数)
category-badge.tsx  — CategoryBadge 分类标签 + CategoryBar 水平滚动栏
search-command.tsx  — SearchCommand 探索搜索弹窗 (Cmd+K) + useSearchShortcut hook
image-upload.tsx    — ImageUpload 拖拽上传组件 (R2 上传 + 固定容器 contain 预览 + 删除)
platform-model-select.tsx — PlatformModelSelect 平台模型下拉组件 (图标徽标 + 模型名 + 可选描述，供 Agent 与生成节点复用；选中态按 provider:model 复合值避免同名模型串位)
platform-model-select.test.tsx — PlatformModelSelect 回归测试 (锁定 provider:model 复合值作为显示态与回调态的统一契约，防止模型切换点击无效)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
