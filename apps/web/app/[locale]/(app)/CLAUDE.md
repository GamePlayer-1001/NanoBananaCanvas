# (app)/
> L2 | 父级: apps/web/app/CLAUDE.md

成员清单
layout.tsx: 应用动态布局，提供桌面侧边栏、移动端头部和主内容滚动容器，不再承载公开 contact 页面
account/page.tsx: 账户页，展示个人资料、作品、通知与 API 接入配置
billing/page.tsx: 账单页，展示余额、流水、usage 和 Stripe Portal 入口
explore/page.tsx: 社区广场，展示公开工作流搜索、分类与卡片
explore/[id]/page.tsx: 公开工作流详情页，展示预览、作者与互动
workflows/page.tsx: 工作流分享页，展示分类、搜索与工作流卡片
video-analysis/page.tsx: 视频分析页，展示上传、模型选择与历史
workspace/page.tsx: 工作区入口，展示项目卡片网格与新建流程
workspace/[id]/page.tsx: 画布编辑器入口，挂载 ReactFlowProvider 与 Canvas CSR

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
