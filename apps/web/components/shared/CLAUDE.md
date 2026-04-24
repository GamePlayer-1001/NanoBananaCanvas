# apps/web/components/shared/

> L2 | 父级: apps/web/CLAUDE.md

跨页面共享的业务组件 — 被多个页面消费的可复用 UI 单元

## 成员清单

```
brand-mark.tsx      — BrandMark 品牌标识组件 (brand/logo-1024.png 图形 logo + 字标 / logo only 统一出口)
empty-state.tsx    — EmptyState 空状态占位组件 (图标 + 标题 + 描述 + 操作按钮)
video-card.tsx     — VideoCard 视频卡片 (缩略图 + 时长 + 头像 + 标题 + 作者 + 观看数)
workflow-card.tsx   — WorkflowCard 工作流卡片 (缩略图 + 分类 + 作者 + 点赞/使用数)
category-badge.tsx  — CategoryBadge 分类标签 + CategoryBar 水平滚动栏
search-command.tsx  — SearchCommand 全局搜索弹窗 (Cmd+K) + useSearchShortcut hook
image-upload.tsx    — ImageUpload 拖拽上传组件 (R2 上传 + 预览 + 删除)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
