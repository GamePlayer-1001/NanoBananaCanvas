# profile/
> L2 | 父级: components/CLAUDE.md

## 成员清单

profile-modal.tsx: ProfileModal 个人中心弹窗，左侧 Tab 导航 + 右侧内容面板
profile-tab.tsx: ProfileTab 个人资料面板，Clerk useUser 读取头像/姓名/邮箱
billing-tab.tsx: BillingTab 账单面板，积分余额卡片 + 使用统计图表 + PaymentHistory
usage-chart.tsx: UsageChart 使用统计图表，纯 CSS 柱状图 + 统计卡片 (7 天用量)
payment-history.tsx: PaymentHistory 交易历史列表，useTransactions hook 消费
subscription-tab.tsx: SubscriptionTab 订阅面板，Free/Pro 双档 + 周/月/年周期切换
model-preferences-tab.tsx: ModelPreferencesTab 模型偏好，账号级模型槽位配置（文本 OpenAI 兼容 / 图片 OpenAI 兼容 / 图片 Google）
works-tab.tsx: WorksTab 我的作品 Tab，全部/已发布/收藏 三子 Tab + 工作流列表
notifications-tab.tsx: NotificationsTab 通知 Tab，通知列表 + 分页 + 标记已读

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
