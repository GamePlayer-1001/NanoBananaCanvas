# explore/detail/
> L2 | 父级: components/explore/CLAUDE.md

## 成员清单

explore-detail-content.tsx: ExploreDetailContent 客户端容器，组合“标题+标签统计”头部、左侧预览区与右侧信息卡组；兼容 workflow 与 imported/task output，详情页去掉独立 workflow json 卡片并把下载收口进操作按钮
workflow-preview.tsx: WorkflowPreview 只读 ReactFlow 预览，ReactFlowProvider + deserializeWorkflow
author-info.tsx: AuthorInfo 作者信息卡片，头像 + 名称 + 发布时间，视觉与标题区顶部对齐
action-buttons.tsx: ActionButtons 操作按钮组，提供“立即生成 / 加入收藏 / 下载”主动作，并保留举报入口
report-dialog.tsx: ReportDialog 举报弹窗，4 种原因选择 + 描述输入 + useReportWorkflow mutation

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
