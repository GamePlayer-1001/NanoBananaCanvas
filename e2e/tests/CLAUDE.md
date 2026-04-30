# tests/
> L2 | 父级: e2e/CLAUDE.md

成员清单
helpers/agent.ts: Agent E2E helper，负责创建空白项目、模板项目、图片工作流与带结果资产的可复用场景
agent-create-workflow.spec.ts: Agent 主链 E2E，覆盖一句话提案、Prompt 确认落图与失败诊断
agent-template-adapt.spec.ts: Agent 模板改造链路 E2E，覆盖模板 quick action 到提案出现
agent-node-edit.spec.ts: Agent 节点级修改 E2E，覆盖选中节点后发出局部修改指令
agent-result-followup.spec.ts: Agent 结果续写 E2E，覆盖图片工作流后显示“基于结果继续”
agent-multi-proposal.spec.ts: Agent 多提案比较 E2E，覆盖多方案比较卡与方案切换按钮
agent-optimize-apply.spec.ts: Agent 优化建议 E2E，覆盖优化 quick action 与应用提案入口
api-public.spec.ts: 公开 API 冒烟测试，覆盖健康检查与匿名访问守卫
health.spec.ts: 健康检查端点冒烟测试
landing.spec.ts: Landing 页面渲染、导航链接与性能预算
navigation.spec.ts: 公开路由可达性与匿名主链稳定性
seo.spec.ts: SEO 基础设施测试，覆盖 robots、sitemap 与 OG 元信息

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
