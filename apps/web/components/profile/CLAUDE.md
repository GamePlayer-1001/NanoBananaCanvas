# profile/
> L2 | 父级: components/CLAUDE.md

## 成员清单

account-content.tsx: AccountContent 账户页主内容，左侧二级导航 sticky + 右侧内容面板，支持通过 query 初始化目标页签，并把账号时区下发到账户子面板；订阅入口当前统一收口到 Standard 试用与月度自动订阅
account-dashboard-tab.tsx: AccountDashboardTab 账户仪表盘页签，展示套餐摘要、积分分布、签到积分、升级入口、账本流水，并把账号时区透传给流水组件统一用户可见时间口径；流水与 usage 已改为页签内按需请求，避免账户首页首屏压库
profile-modal.tsx: ProfileModal 旧个人中心弹窗，已不再作为主入口
profile-tab.tsx: ProfileTab 个人资料面板，展示昵称/邮箱/真实密码状态 + 退出登录 + Clerk 安全中心入口
subscription-tab.tsx: SubscriptionTab 订阅页签，承接 Standard 30 天试用、月度自动订阅的权益展示与真实 Stripe 结账动作，并复用 Landing 四卡主副标题、固定美元价格格式与 Free Trial 高亮文案
model-preferences-tab.tsx: ModelPreferencesTab API 接入配置面板，仅登录用户维护账户级配置；访客态只展示登录后可配置的账户级说明
settings-tab.tsx: SettingsTab 账户设置页签，承载语言切换、签到时区矫正、新手提示显隐与引导重置；时区选择已拆分“当前生效值”和“待保存草稿值”，并优先跟随 useCurrentUser 的最新账户时区，避免保存成功后界面继续显示旧值
works-tab.tsx: WorksTab 我的作品 Tab，工作流/生成作品/已发布/收藏四主页签 + 图片/视频子页签 + 多选删除 + 本地草稿导入；已发布页签同时管理公开工作流与公开生成作品，封面遵循“用户上传优先，视频缺省首帧回退”，并兼容旧数据里 thumbnail=media_url 的脏值回退
publish-output-dialog.tsx: PublishOutputDialog 生成作品公开弹窗，支持封面上传、标题描述编辑与真实分类选择；视频作品未上传封面时不再把视频 URL 伪装成 thumbnail，交由列表/详情按首帧回退
notifications-tab.tsx: NotificationsTab 通知 Tab，通知列表 + 分页 + 标记已读

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
