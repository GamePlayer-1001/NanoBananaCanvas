# workspace/
> L2 | 父级: components/CLAUDE.md

## 成员清单

workspace-content.tsx: WorkspaceContent 客户端容器，组合 header + grid + dialog，支持 folder 筛选
workspace-header.tsx: WorkspaceHeader 顶部工具栏，面包屑/搜索/排序/视图切换/新建
workspace-grid.tsx: WorkspaceGrid 项目卡片网格，含 Skeleton 加载态和空状态
project-card.tsx: ProjectCard 单个项目卡片，缩略图 + 名称 + 更新时间 + 三点菜单 (重命名/删除/发布/取消发布/移动文件夹) + 已发布角标
new-project-dialog.tsx: NewProjectDialog 创建项目弹窗，名称 + 描述 + 提交
rename-dialog.tsx: RenameDialog 重命名弹窗，useUpdateWorkflow mutation + toast
delete-dialog.tsx: DeleteDialog 删除确认弹窗，useDeleteWorkflow mutation + toast
publish-dialog.tsx: PublishDialog 发布弹窗，分类选择 + usePublishWorkflow mutation + toast

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
