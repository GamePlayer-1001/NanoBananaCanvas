# explore/detail/
> L2 | 父级: components/explore/CLAUDE.md

## 成员清单

explore-detail-content.tsx: ExploreDetailContent 客户端容器，组合 预览+作者+统计/操作卡，兼容 workflow 与 imported/task output 两类详情数据
workflow-preview.tsx: WorkflowPreview 只读 ReactFlow 预览，ReactFlowProvider + deserializeWorkflow
author-info.tsx: AuthorInfo 作者信息卡片，头像 + 名称 + 发布时间
action-buttons.tsx: ActionButtons 互动按钮组，含点赞/收藏即时状态、统计补充、克隆与举报入口
report-dialog.tsx: ReportDialog 举报弹窗，4 种原因选择 + 描述输入 + useReportWorkflow mutation

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
