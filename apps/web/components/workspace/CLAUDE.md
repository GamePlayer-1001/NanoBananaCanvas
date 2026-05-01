# workspace/
> L2 | 父级: components/CLAUDE.md

## 成员清单

workspace-content.tsx: WorkspaceContent 客户端容器，组合 header + grid + dialog，负责 folder 筛选、搜索/排序/视图应用与多选批量管理
workspace-header.tsx: WorkspaceHeader 顶部工具栏，普通态提供面包屑/搜索/排序/视图切换/新建，管理态提供多选移动与批量删除入口
workspace-grid.tsx: WorkspaceGrid 项目列表容器，支持网格/列表双视图、Skeleton 加载态和空状态
project-card.tsx: ProjectCard 单个项目卡片，支持网格/列表展示、进入画板、多选勾选，以及三点菜单的重命名/删除/发布/取消发布/移动文件夹
new-project-dialog.tsx: NewProjectDialog 创建项目弹窗，支持空白项目与系统模板起手，再跳转到全屏画布
rename-dialog.tsx: RenameDialog 重命名弹窗，useUpdateWorkflow mutation + toast
delete-dialog.tsx: DeleteDialog 删除确认弹窗，useDeleteWorkflow mutation + toast
publish-dialog.tsx: PublishDialog 发布弹窗，分类选择 + usePublishWorkflow mutation + toast

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
