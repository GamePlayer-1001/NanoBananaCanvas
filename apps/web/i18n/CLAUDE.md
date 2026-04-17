# i18n/
> L2 | 父级: apps/web/CLAUDE.md

next-intl 国际化配置模块，定义路由、请求处理和导航工具。

## 成员清单

routing.ts: 路由配置中心，定义 locales=['en','zh'] + defaultLocale='en'，被 middleware/navigation/request 消费
request.ts: 服务端请求配置，校验 locale 参数 + 动态加载 messages JSON，被 next-intl 插件自动调用
navigation.ts: i18n 感知导航工具集 (Link/redirect/usePathname/useRouter)，替代 next/link 和 next/navigation

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
