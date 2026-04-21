# i18n/
> L2 | 父级: apps/web/CLAUDE.md

next-intl 国际化配置模块，定义路由、请求处理和导航工具。

## 成员清单

config.ts: locale 单一真相源，定义启用语言、显示名、OG locale、Clerk 本地化 key 与回退策略
routing.ts: 路由配置中心，消费 config.ts 暴露的 ACTIVE_LOCALES/DEFAULT_LOCALE，并输出 next-intl routing
request.ts: 服务端请求配置，校验 locale 参数 + 动态加载 messages JSON，被 next-intl 插件自动调用
navigation.ts: i18n 感知导航工具集 (Link/redirect/usePathname/useRouter)，替代 next/link 和 next/navigation
message-index.ts: 由脚本生成的消息索引文件，提供 locale 列表、命名空间索引与全量 leaf key 索引，供校验链和未来类型提示使用
message-usage.ts: 由脚本生成的使用索引文件，记录代码中实际引用的翻译 key + 动态引用汇总，用于缺 key 校验与死 key 清理
message-usage-manifest.json: 动态翻译 key 清单，给模板字符串/运行时拼接场景提供显式索引入口

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
