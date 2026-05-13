# explore/
> L2 | 父级: components/CLAUDE.md

## 成员清单

explore-content.tsx: ExploreContent 客户端容器，组合下移无遮罩旋转木马 Banner、去结果统计的两行分类/排序工具区与 Explore API；主类型默认走“全部”，子分类优先按真实分类/节点映射，缺省再兜底关键词筛选
explore-tabs.tsx: ExploreTabs 顶部工具条，负责全部/图片/视频/工作流主类型切换、条件二级分类切换与无标签排序下拉；视觉对齐轻量导航条样式而非胶囊容器块
explore-grid.tsx: ExploreGrid 瀑布流卡片区域，负责四列不规则排布、压缩移动端间距、Skeleton 加载态与空状态
detail/: 探索详情子模块 (见 detail/CLAUDE.md)

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
