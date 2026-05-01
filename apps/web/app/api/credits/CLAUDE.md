# credits/
> L2 | 父级: apps/web/app/api/CLAUDE.md

成员清单
balance/route.ts — GET 当前登录用户的积分余额摘要，返回签到试用/订阅/永久三池余额、冻结积分与当前套餐额度镜像
signin/route.ts — GET/POST 当前登录用户的每日签到状态与签到发放，负责“当天一次、100 试用积分、当天过期”的账本入口
transactions/route.ts — GET 当前登录用户的积分流水分页结果，返回账本审计列表
usage/route.ts — GET 当前登录用户的 usage 聚合摘要，返回 summary / byModel / daily 三个维度

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
