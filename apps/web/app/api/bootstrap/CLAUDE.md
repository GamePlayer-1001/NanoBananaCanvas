# api/bootstrap/
> L2 | 父级: apps/web/app/api/CLAUDE.md

常驻布局聚合 API。用于把页面级稳定底噪请求收口成单次读取，优先服务 Sidebar / Header 这类跨页面常驻 UI。

## 成员清单

sidebar/route.ts: GET 侧边栏 bootstrap 聚合接口，返回当前 actor 的用户镜像、积分摘要、真实签到状态与文件夹列表，替代原先 4 次常驻请求

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
