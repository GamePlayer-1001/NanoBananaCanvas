# messages/
> L2 | 父级: apps/web/CLAUDE.md

i18n 翻译文件 · next-intl JSON 消息包，按命名空间组织翻译 key。

## 成员清单

en.json: 英文翻译，包含 common/metadata/notFound/landing/workspace/canvas/toolbar/contextMenu/apiKey/nodes/executor 命名空间
zh.json: 中文翻译，与 en.json 结构完全对称

## 命名空间约定

- `common` — 跨页面通用文本
- `metadata` — 页面 SEO 元数据
- `notFound` — 404 页面
- `landing` — Landing Page 内容 (含 signIn/dashboard 认证按钮文案)
- `auth` — 登录/注册页面文案与认证视觉区说明
- `workspace` — 工作空间页面
- `canvas` — 画布操作 (Run/Stop/Import/Export/toast)
- `toolbar` — 底部工具栏标签
- `contextMenu` — 右键菜单项
- `apiKey` — API Key 配置对话框
- `nodes` — 节点组件标签/占位符
- `executor` — 执行引擎错误消息

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
