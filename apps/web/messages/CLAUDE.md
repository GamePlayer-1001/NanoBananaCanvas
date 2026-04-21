# messages/
> L2 | 父级: apps/web/CLAUDE.md

i18n 翻译文件 · next-intl JSON 消息包，按命名空间组织翻译 key。

## 成员清单

en.json: 英文翻译基准文件，包含 common/metadata/landingSeo/notFound/landing/auth/sidebar/explore/search/workflows/videoAnalysis/workspace/upload/profile/profileWorks/notifications/canvas/contextMenu/nodes/exploreDetail/contact/legal 命名空间
zh.json: 中文翻译，与 en.json 结构完全对称并通过脚本校验

## 命名空间约定

- `common` — 跨页面通用文本
  当前同时承载 loading/retry/error-boundary 这类跨页面兜底文案
- `metadata` — 页面 SEO 元数据
- `notFound` — 404 页面
- `landing` — Landing Page 内容 (含 signIn/dashboard 认证按钮文案)
- `landingSeo` — Landing 页 SEO/GEO 内容层与 FAQ，可见语义与结构化数据共用事实源
- `auth` — 登录/注册页面文案与认证视觉区说明
- `sidebar` — 已登录侧边栏与访客态导航文案
- `search` — 全局搜索弹窗文案
- `explore` — 社区广场文案
- `workflows` — 工作流分享页文案
- `videoAnalysis` — 视频分析页面文案
- `workspace` — 工作空间页面
- `upload` — 上传交互文案
- `profile` — 账户页与 API 配置文案
- `profileWorks` — 账户页作品区文案
- `notifications` — 通知面板文案
- `canvas` — 画布操作 (Run/Stop/Import/Export/toast)
- `contextMenu` — 右键菜单项
- `nodes` — 节点组件标签/占位符
- `exploreDetail` — 广场详情与举报交互文案
- `contact` — 联系方式与社媒入口文案
- `legal` — 服务条款与隐私政策文案

## 运维约束

- 新增语言前先运行 `pnpm i18n:add-locale <locale>`
- 补翻译或重排 key 后运行 `pnpm i18n:sync` 与 `pnpm i18n:check`
- 动态拼接 key 先登记到 `i18n/message-usage-manifest.json`，再运行 `pnpm i18n:check`
- 历史死 key 清理走 `pnpm i18n:prune-unused`，让索引与消息文件同步收口
- `en.json` 是当前结构基准，其他 locale 文件必须与其 leaf key 完全对称

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
