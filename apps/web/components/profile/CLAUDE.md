# profile/
> L2 | 父级: components/CLAUDE.md

## 成员清单

account-content.tsx: AccountContent 账户页主内容，左侧二级导航 sticky + 右侧内容面板，支持通过 query 初始化目标页签
account-dashboard-tab.tsx: AccountDashboardTab 账户仪表盘页签，展示套餐摘要、积分分布、升级入口、账本流水与用量趋势
profile-modal.tsx: ProfileModal 旧个人中心弹窗，已不再作为主入口
profile-tab.tsx: ProfileTab 个人资料面板，展示昵称/邮箱/真实密码状态 + 退出登录 + Clerk 安全中心入口
subscription-tab.tsx: SubscriptionTab 订阅页签，承接月付/一次性/积分包切换、权益展示与真实 Stripe 结账动作
model-preferences-tab.tsx: ModelPreferencesTab API 接入配置面板，四类能力卡片 + 每卡多条配置 + 名称/脱敏状态/修改测试删除
works-tab.tsx: WorksTab 我的作品 Tab，工作流/生成作品/已发布/收藏四主页签 + 图片/视频子页签 + 多选删除 + 存储进度 + 本地草稿导入
notifications-tab.tsx: NotificationsTab 通知 Tab，通知列表 + 分页 + 标记已读

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
