# profile/
> L2 | 父级: components/CLAUDE.md

## 成员清单

profile-modal.tsx: ProfileModal 个人中心弹窗，左侧 Tab 导航 + 右侧内容面板
profile-tab.tsx: ProfileTab 个人资料面板，Clerk useUser 读取头像/姓名/邮箱
billing-tab.tsx: BillingTab 账单面板，积分余额卡片 + 充值按钮 + PaymentHistory
payment-history.tsx: PaymentHistory 交易历史列表，useTransactions hook 消费
topup-dialog.tsx: TopupDialog 积分充值弹窗，选择积分包 + Stripe Checkout
subscription-tab.tsx: SubscriptionTab 订阅面板，Free/Pro/Team 三档对比
model-preferences-tab.tsx: ModelPreferencesTab 模型偏好，API Key + 默认模型
works-tab.tsx: WorksTab 我的作品 Tab，全部/已发布 子 Tab + 工作流列表
notifications-tab.tsx: NotificationsTab 通知 Tab，通知列表 + 分页 + 标记已读

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
