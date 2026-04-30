# Agent 工作流画板实现任务执行清单

> 文档版本：v1.1
> 创建日期：2026-04-30
> 上游文档：`Agent 工作流画板最终技术设计稿.md`
> 说明：本清单用于指导 Agent 工作流画板 V1 的真实开发执行、验收与留痕

---

## 一、执行原则

1. 先搭骨架，再接能力，再收口体验
2. 先保证画布真相源安全，再追求 Agent 聪明程度
3. 每一阶段必须可演示、可验证、可回滚
4. 每完成一个闭环，都必须更新文档并做 git 留痕

---

## 二、里程碑

| 里程碑 | 名称 | 目标 | 状态 |
| --- | --- | --- | --- |
| M1 | 面板骨架 | 右侧 Agent UI 与状态骨架可运行 | [ ] |
| M2 | 计划链路 | 从用户输入到结构化 plan 跑通 | [ ] |
| M3 | 落图链路 | plan 可安全修改画布并自动保存 | [ ] |
| M4 | 提示词确认 | refine + confirm + execute 跑通 | [ ] |
| M5 | 诊断与收口 | diagnose、任务联动、体验打磨完成 | [ ] |

---

## 三、任务清单

## 3.1 M1 面板骨架

### 文档与结构准备

- [x] `AGENT-001` 在 `.md/CLAUDE.MD` 中登记新增 Agent 技术文档与清单
- [x] `AGENT-002` 为 `apps/web/components/agent/` 创建 `CLAUDE.md`
- [x] `AGENT-003` 为 `apps/web/lib/agent/` 创建 `CLAUDE.md`

### 前端目录与空组件

- [ ] `AGENT-010` 创建 `components/agent/agent-panel.tsx`
- [ ] `AGENT-011` 创建 `components/agent/agent-header.tsx`
- [ ] `AGENT-012` 创建 `components/agent/agent-conversation.tsx`
- [ ] `AGENT-013` 创建 `components/agent/agent-message-item.tsx`
- [ ] `AGENT-014` 创建 `components/agent/agent-composer.tsx`
- [ ] `AGENT-015` 创建 `components/agent/agent-quick-actions.tsx`
- [ ] `AGENT-016` 创建 `components/agent/agent-process-message.tsx`
- [ ] `AGENT-017` 创建 `components/agent/agent-proposal-card.tsx`
- [ ] `AGENT-018` 创建 `components/agent/agent-prompt-compare-card.tsx`

### 状态骨架

- [ ] `AGENT-020` 创建 `stores/use-agent-store.ts`
- [ ] `AGENT-021` 定义 `AgentMode / AgentSessionStatus / AgentMessage / AgentPlan` 基础类型
- [ ] `AGENT-022` 实现消息追加、状态切换、待确认计划设置与清空

### 编辑器接入

- [ ] `AGENT-030` 将 `AgentPanel` 接入编辑器页布局
- [ ] `AGENT-031` 调整画布区与 Agent 区宽度布局
- [ ] `AGENT-032` 保证接入后不破坏现有 Canvas 工具栏、缩略图、自动保存与快捷键

### M1 验收

- [ ] `AGENT-040` 面板可显示
- [ ] `AGENT-041` 输入框可输入
- [ ] `AGENT-042` 发送消息后可渲染用户消息与本地过程消息
- [ ] `AGENT-043` 无画布功能回归

---

## 3.2 M2 计划链路

### Agent 基础能力层

- [ ] `AGENT-100` 创建 `lib/agent/types.ts`
- [ ] `AGENT-101` 创建 `lib/agent/constants.ts`
- [ ] `AGENT-102` 创建 `lib/agent/summarize-canvas.ts`
- [ ] `AGENT-103` 创建 `lib/agent/build-agent-plan.ts`
- [ ] `AGENT-104` 创建 `lib/agent/validate-agent-plan.ts`

### 画布摘要

- [ ] `AGENT-110` 从 `useFlowStore` 提取节点与连线摘要
- [ ] `AGENT-111` 从 `plugin-registry` 提取 label / ports 元信息
- [ ] `AGENT-112` 接入最近执行状态与失败节点摘要
- [ ] `AGENT-113` 接入当前选中节点语境
- [ ] `AGENT-114` 对长文本和复杂节点配置做压缩

### 后端 API

- [ ] `AGENT-120` 创建 `app/api/agent/CLAUDE.md`
- [ ] `AGENT-121` 创建 `app/api/agent/plan/route.ts`
- [ ] `AGENT-122` 定义 `AgentPlanRequest / AgentPlanResponse` schema
- [ ] `AGENT-123` 实现服务端 planner 输出 JSON schema 校验
- [ ] `AGENT-124` 实现失败时的稳定错误响应

### 前后端打通

- [ ] `AGENT-130` 创建 `hooks/use-agent-session.ts`
- [ ] `AGENT-131` 发送用户消息后串起 `summary -> plan API -> pendingPlan`
- [ ] `AGENT-132` 面板中渲染 Proposal Card
- [ ] `AGENT-133` plan 返回后切换到 `patch-ready` 或 `awaiting-confirmation`

### M2 验收

- [ ] `AGENT-140` 用户输入一句话后能得到结构化提案
- [ ] `AGENT-141` 提案在 UI 中可读，不暴露原始 JSON
- [ ] `AGENT-142` 失败时有清晰错误提示

---

## 3.3 M3 落图链路

### Plan 应用层

- [ ] `AGENT-200` 创建 `lib/agent/apply-agent-plan.ts`
- [ ] `AGENT-201` 实现 `add_node` 应用
- [ ] `AGENT-202` 实现 `update_node_data` 应用
- [ ] `AGENT-203` 实现 `connect` 应用
- [ ] `AGENT-204` 实现 `disconnect` 应用
- [ ] `AGENT-205` 实现 `focus_nodes` 应用

### 安全校验

- [ ] `AGENT-210` 校验 nodeType 是否存在
- [ ] `AGENT-211` 校验 nodeId 是否存在
- [ ] `AGENT-212` 校验端口连接合法性
- [ ] `AGENT-213` 校验高风险 operation 是否转确认态

### 与现有 store 衔接

- [ ] `AGENT-220` 应用前接入 `useHistoryStore` 快照
- [ ] `AGENT-221` 通过 `useFlowStore` 真正修改节点与边
- [ ] `AGENT-222` 落图后生成用户可读的 change summary
- [ ] `AGENT-223` 验证 `useAutoSave` 能自动接住变更

### 错误与回滚

- [ ] `AGENT-230` 实现 apply 中断与错误上报
- [ ] `AGENT-231` 实现 apply 失败时的回滚策略
- [ ] `AGENT-232` 在聊天区返回“是否已回滚”的真实状态

### M3 验收

- [ ] `AGENT-240` 一句话可在左侧生成最小工作流
- [ ] `AGENT-241` 小范围修改可成功落到现有画布
- [ ] `AGENT-242` 用户可撤销 Agent 改动
- [ ] `AGENT-243` 自动保存无回归

---

## 3.4 M4 提示词确认

### Prompt refine API

- [ ] `AGENT-300` 创建 `app/api/agent/refine-prompt/route.ts`
- [ ] `AGENT-301` 定义 `PromptConfirmationPayload` schema
- [ ] `AGENT-302` 服务端实现原始意图、画面提案、执行 prompt 三段输出
- [ ] `AGENT-303` 支持基础风格变体建议

### 前端确认卡片

- [ ] `AGENT-310` 完成 `agent-prompt-compare-card.tsx` 正式结构
- [ ] `AGENT-311` 支持“确认并执行”
- [ ] `AGENT-312` 支持“再来一版”
- [ ] `AGENT-313` 支持“更写实 / 更动漫 / 更商业”
- [ ] `AGENT-314` 支持展开查看完整 prompt

### 执行联动

- [ ] `AGENT-320` 将确认后的 prompt patch 回对应节点
- [ ] `AGENT-321` 支持确认后触发 `run_workflow`
- [ ] `AGENT-322` 聊天区展示执行开始过程消息

### M4 验收

- [ ] `AGENT-330` 图片工作流创建后能进入 prompt 确认态
- [ ] `AGENT-331` 用户确认后左侧节点配置被更新
- [ ] `AGENT-332` 用户可基于风格建议快速再生成一版

---

## 3.5 M5 诊断与收口

### Diagnose API

- [ ] `AGENT-400` 创建 `app/api/agent/diagnose/route.ts`
- [ ] `AGENT-401` 定义 `AgentDiagnosis` schema
- [ ] `AGENT-402` 接入最近执行失败摘要
- [ ] `AGENT-403` 输出现象、根因、修复建议

### Explain API

- [ ] `AGENT-410` 创建 `app/api/agent/explain/route.ts`
- [ ] `AGENT-411` 支持解释当前工作流
- [ ] `AGENT-412` 支持解释当前选中节点

### 异步任务联动

- [ ] `AGENT-420` 聊天区订阅现有任务/执行状态
- [ ] `AGENT-421` 异步任务运行中显示简洁进度反馈
- [ ] `AGENT-422` 异步任务完成后生成自然语言结果消息

### 体验打磨

- [ ] `AGENT-430` 接入面板动效与 reduced motion 降级
- [ ] `AGENT-431` 接入节点高亮、连线描边、focus nodes 视图定位
- [ ] `AGENT-432` 接入 Quick Actions
- [ ] `AGENT-433` 完成中英文文案补齐

### M5 验收

- [ ] `AGENT-440` 用户可询问“为什么跑不通”
- [ ] `AGENT-441` 聊天区能给出像样诊断
- [ ] `AGENT-442` 执行与异步任务状态可被理解
- [ ] `AGENT-443` 体验达到可内测水平

---

## 四、补充任务

### 4.1 测试

- [ ] `AGENT-500` 为 `summarize-canvas.ts` 添加单测
- [ ] `AGENT-501` 为 `validate-agent-plan.ts` 添加单测
- [ ] `AGENT-502` 为 `apply-agent-plan.ts` 添加单测
- [ ] `AGENT-503` 为 `use-agent-store.ts` 添加单测
- [ ] `AGENT-504` 为 Agent API route 添加路由测试
- [ ] `AGENT-505` 增加一条 E2E：一句话生成工作流
- [ ] `AGENT-506` 增加一条 E2E：prompt 确认并执行
- [ ] `AGENT-507` 增加一条 E2E：诊断失败链路

### 4.2 文案与国际化

- [ ] `AGENT-520` 在 `messages/zh.json` 增加 Agent 文案
- [ ] `AGENT-521` 在 `messages/en.json` 增加 Agent 文案
- [ ] `AGENT-522` 为系统过程消息建立统一 key 命名

### 4.3 文档回环

- [ ] `AGENT-530` 为新增目录编写 `CLAUDE.md`
- [ ] `AGENT-531` 为核心业务文件补 L3 头部注释
- [ ] `AGENT-532` 在实现过程结束后回写本清单与技术设计稿状态

---

## 五、风险清单

### 高风险

1. `Canvas` 主组件被继续做胖
2. Planner 输出不稳定导致 plan schema 失控
3. 没有本地二次校验就直接落图
4. Agent 改图与现有撤销链断开

### 中风险

1. 提示词确认卡片做得太复杂
2. 聊天区进度反馈和真实任务状态不同步
3. 文案太多导致 UI 变重

### 低风险

1. 视觉细节还需继续优化
2. Quick Actions 第一版命中率一般

---

## 六、建议开发顺序

1. 先完成 M1 与 M2，拿到“能提案”的演示版本
2. 再完成 M3，拿到“能改图”的核心闭环
3. 然后补 M4，让图片工作流真正可用
4. 最后用 M5 诊断与体验打磨收尾

---

## 七、完成定义

一个任务只有同时满足以下条件才算完成：

1. 功能已落地
2. 文档已同步
3. 至少完成静态自检
4. 可运行验证项已记录结果
5. 已做 git 留痕

---

[PROTOCOL]: 变更时更新此文档，然后检查 CLAUDE.md
