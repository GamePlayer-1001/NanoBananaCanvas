# billing/
> L2 | 父级: apps/web/components/CLAUDE.md

## 成员清单

billing-content.tsx: `/billing` 页面主内容，组合余额卡片、流水列表、仅在存在真实 usage 数据时展示的统计图表与 Portal 操作入口
credit-balance-card.tsx: 余额摘要卡片，展示可用积分、月度/永久余额、冻结积分、套餐额度与累计账本镜像
payment-history-table.tsx: 账本流水列表，展示 credit_transactions 分页结果、页容量切换与事件多语言说明，并把 trial pool 明确展示为签到积分来源
usage-chart.tsx: usage 可视化组件，提供 hasUsageData 判定并在有真实数据时展示最近窗口的 summary、日维度柱状图与模型维度消耗排行

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
