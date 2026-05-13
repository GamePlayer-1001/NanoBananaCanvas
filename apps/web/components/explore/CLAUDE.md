# explore/
> L2 | 父级: components/CLAUDE.md

## 成员清单

explore-content.tsx: ExploreContent 客户端容器，组合较宽留白主容器、固定高度且宽度自适应并以 cover 裁切消除留白的纯图片 Banner、圆点叠放在轮播画面上、两行分类/排序工具区、无尽下拉与按 id 去重兜底；主类型默认走“全部”，子分类优先按真实分类/节点映射，缺省再兜底关键词筛选
explore-tabs.tsx: ExploreTabs 顶部工具条，负责全部/图片/视频/工作流主类型切换、条件二级分类切换与无标签排序下拉；视觉对齐轻量导航条样式而非胶囊容器块
explore-grid.tsx: ExploreGrid 瀑布流卡片区域，负责四列不规则排布、压缩移动端间距、Skeleton 加载态与空状态，并承载 Explore 卡片的 Z 轴放大与底部外扩详情层交互
detail/: 探索详情子模块 (见 detail/CLAUDE.md)

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
