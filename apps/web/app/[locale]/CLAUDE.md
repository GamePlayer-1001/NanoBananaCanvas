# [locale]/

> L2 | 父级: apps/web/app/CLAUDE.md

语言外壳层，负责 locale 级 Provider、404、以及该语言下全部公开与应用路由的共同边界。

## 成员清单

layout.tsx: 语言布局真相源，注入 ClerkProvider、NextIntlClientProvider、QueryProvider、字体与全局 Script，并输出 locale 级 html lang
not-found.tsx: locale 感知 404 页面，复用翻译文案为不同语言输出一致的错误引导
(landing)/: 公开营销与法务路由组，承接首页、功能、模型、定价、文档及法务页 SEO 信号
(auth)/: 认证路由组，承接登录与注册壳层并与 Clerk URL 保持对齐
(app)/: 登录后应用路由组，承接工作区、账单、社区与工具页
(editor)/: 全屏编辑器路由组，承接画布编辑体验与编辑器级 noindex 边界

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
