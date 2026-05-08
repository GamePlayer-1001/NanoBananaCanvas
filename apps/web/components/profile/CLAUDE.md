# profile/
> L2 | 父级: components/CLAUDE.md

## 成员清单

account-content.tsx: AccountContent 账户页主内容，左侧二级导航 sticky + 右侧内容面板，支持通过 query 初始化目标页签，并把账号时区下发到账户子面板；首屏只承接轻摘要，重查询已下沉到页签内懒加载
account-dashboard-tab.tsx: AccountDashboardTab 账户仪表盘页签，展示套餐摘要、积分分布、签到积分、升级入口、账本流水，并把账号时区透传给流水组件统一用户可见时间口径；流水与 usage 已改为页签内按需请求，避免账户首页首屏压库
profile-modal.tsx: ProfileModal 旧个人中心弹窗，已不再作为主入口
profile-tab.tsx: ProfileTab 个人资料面板，展示昵称/邮箱/真实密码状态 + 退出登录 + Clerk 安全中心入口
subscription-tab.tsx: SubscriptionTab 订阅页签，承接月付/一次性/积分包切换、权益展示与真实 Stripe 结账动作，并把套餐卖点收口为积分补给与交付节奏
model-preferences-tab.tsx: ModelPreferencesTab API 接入配置面板，仅登录用户维护账户级配置；访客态只展示登录后可配置的账户级说明
settings-tab.tsx: SettingsTab 账户设置页签，承载语言切换、签到时区矫正、新手提示显隐与引导重置；时区选择已拆分“当前生效值”和“待保存草稿值”，避免下拉框被账号旧值立即顶回
works-tab.tsx: WorksTab 我的作品 Tab，工作流/生成作品/已发布/收藏四主页签 + 图片/视频子页签 + 多选删除 + 本地草稿导入
notifications-tab.tsx: NotificationsTab 通知 Tab，通知列表 + 分页 + 标记已读

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
