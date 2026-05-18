/**
 * [INPUT]: 依赖 ./types 的 AgentPlan/CanvasSummary/AgentPlanIntent/WorkflowOperation，依赖 @/lib/nanoid，依赖 ./operations-builder 的 shouldBuildFollowUpFromResult，依赖 ./intent-resolver 的 isWorkflowReferenceRequest + WorkflowReferenceSketch
 * [OUTPUT]: 对外提供 buildSummary / buildReasons / buildPlanAlternatives
 * [POS]: lib/agent 的计划文案层，把结构化 AgentPlan 上下文翻译成面向用户的摘要与理由列表，被 api/agent/plan/route 的 buildPlannerResponse 消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { nanoid } from '@/lib/nanoid'
import { isWorkflowReferenceRequest } from './intent-resolver'
import type { WorkflowReferenceSketch } from './intent-resolver'
import { shouldBuildFollowUpFromResult } from './operations-builder'
import type { AgentPlan, AgentPlanIntent, CanvasSummary, WorkflowOperation } from './types'

/* ─── Public: Summary ─────────────────────────────────── */

export function buildSummary(
  normalized: string,
  canvas: CanvasSummary,
  mode: AgentPlan['mode'],
  operations: WorkflowOperation[],
  workflowReferenceRequest = false,
  workflowReferenceSketch?: WorkflowReferenceSketch,
): string {
  if (mode === 'diagnose') {
    return canvas.latestExecution?.failedReason
      ? `我会先围绕最近一次失败继续定位：${canvas.latestExecution.failedReason}`
      : '我会先聚焦可能有问题的节点，再给出下一步修复建议。'
  }

  if (canvas.nodeCount === 0) {
    if (workflowReferenceRequest) {
      return workflowReferenceSketch?.summary?.trim()
        ? `我先按参考工作流图还原出一版主链提案：${workflowReferenceSketch.summary.trim()}`
        : '我准备先按参考工作流图整理出一版可落到画板里的结构提案，而不是把图片当成普通参考素材。'
    }

    if (normalized.includes('图') || normalized.includes('图片') || normalized.includes('海报')) {
      return '我准备先搭出"输入提示词 -> 图片生成 -> 结果展示"的最小工作流提案。'
    }
    if (normalized.includes('视频')) {
      return '我准备先搭出"输入提示词 -> 视频生成 -> 结果展示"的最小工作流提案。'
    }
    if (normalized.includes('音频') || normalized.includes('语音')) {
      return '我准备先搭出"文本输入 -> 音频生成 -> 结果展示"的最小工作流提案。'
    }
    return '我准备先搭出"文本输入 -> LLM -> 结果展示"的最小工作流提案。'
  }

  if (
    (mode === 'extend' || shouldBuildFollowUpFromResult(normalized, canvas)) &&
    canvas.latestSuccessfulAsset &&
    operations.length > 0
  ) {
    return `我会基于最近产出的${assetKindLabel(canvas.latestSuccessfulAsset.kind)}结果继续往下长一条新分支，而不是改坏原主链。`
  }

  const firstOpType = operations[0]?.type
  if (firstOpType === 'focus_nodes') return '我先把注意力聚焦到最相关的节点范围，再给你一个可检查的修改方向。'
  if (firstOpType === 'update_node_data') return '我准备先做一个小范围配置修改提案，不直接动整张图。'
  if (firstOpType === 'insert_between') return '我会在现有主链中间补一小步，而不是推翻重建整条流程。'
  if (firstOpType === 'replace_node') return '我会只替换目标节点的模型配置，尽量保留上下游连接和原链路。'
  if (firstOpType === 'batch_update_node_data') return '我准备做一次受控的小范围批量调参，并把改动粒度保持在可撤销范围内。'
  if (firstOpType === 'run_workflow') return '我会先把执行动作作为待确认提案，而不是直接替你运行。'

  return '我准备在当前画板基础上补一小步结构，让链路更完整。'
}

/* ─── Public: Reasons ─────────────────────────────────── */

export function buildReasons(
  normalized: string,
  canvas: CanvasSummary,
  mode: AgentPlan['mode'],
  operations: WorkflowOperation[],
  intent: AgentPlanIntent,
  workflowReferenceRequest = false,
  workflowReferenceSketch?: WorkflowReferenceSketch,
): string[] {
  const reasons: string[] = []

  reasons.push(
    canvas.nodeCount === 0
      ? '当前画板还是空白，适合先给出最小可运行结构。'
      : `当前画板已有 ${canvas.nodeCount} 个节点，先做局部提案更安全。`,
  )

  if (workflowReferenceRequest || isWorkflowReferenceRequest(normalized)) {
    reasons.push('这次附图更像结构参考，我会优先复用图里的流程意图，而不是把它只当内容素材。')
  }

  if (workflowReferenceSketch?.notes?.length) {
    reasons.push(workflowReferenceSketch.notes[0] as string)
  }

  if (canvas.displayMissingForNodeIds.length > 0) {
    reasons.push(`我发现有 ${canvas.displayMissingForNodeIds.length} 个 AI 节点还没有明显结果承接。`)
  }

  if (canvas.disconnectedNodeIds.length > 0) {
    reasons.push(`当前有 ${canvas.disconnectedNodeIds.length} 个节点处于未连线状态，后续需要重点确认。`)
  }

  if (canvas.latestSuccessfulAsset) {
    reasons.push(`最近一次成功结果已经沉淀为${assetKindLabel(canvas.latestSuccessfulAsset.kind)}资产，适合拿来继续扩展。`)
  }

  if (mode === 'diagnose') {
    reasons.push('你当前的目标更像是在定位问题，所以我先收缩到问题节点而不是直接改图。')
  }

  if (intent === 'add_step' || intent === 'split_step') {
    reasons.push('这次更适合在现有主链上增量插入步骤，而不是整体重建。')
  }

  if (intent === 'replace_model') {
    reasons.push('你的目标是替换模型而不是改结构，所以我优先保留上下游关系。')
  }

  if (canvas.selectionContext?.nodeLabel) {
    reasons.push(`当前已选中节点「${canvas.selectionContext.nodeLabel}」，我会优先围绕这个局部上下文生成提案。`)
  }

  if (intent === 'change_output_count') {
    reasons.push('这属于输出规格改造，优先走局部参数 patch 更稳。')
  }

  if (normalized.includes('图') || normalized.includes('图片') || normalized.includes('海报')) {
    reasons.push('这类请求通常先需要明确提示词方向，所以我把 prompt 确认保留成显式步骤。')
  }

  if (operations.length === 0) {
    reasons.push('当前上下文不足以安全生成具体操作，我先给出聚焦提案。')
  }

  return reasons.slice(0, 3)
}

/* ─── Public: Alternatives ────────────────────────────── */

export function buildPlanAlternatives(plan: AgentPlan, canvas: CanvasSummary): AgentPlan[] | undefined {
  if (canvas.nodeCount === 0 && plan.mode === 'create') {
    return [
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更保守',
        variantTone: 'conservative',
        summary: '我先给你一版更保守的最小工作流，只保留最核心的输入、生成和展示主链。',
        reasons: ['适合先快速验证主链是否跑通。'],
      },
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更激进',
        variantTone: 'aggressive',
        summary: '我也准备了一版更激进的工作流，会更早补入分析或变体步骤。',
        reasons: ['适合一开始就把后续扩展位留出来。'],
      },
    ]
  }

  if (plan.mode === 'optimize' || plan.intent === 'replace_model') {
    return [
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更省钱',
        variantTone: 'cheaper',
        summary: '这版更偏成本收缩，优先替换高成本模型和预览开销。',
        reasons: ['适合预算敏感的当前工作流。'],
      },
      {
        ...plan,
        id: `plan_${nanoid()}`,
        variantLabel: '更高质量',
        variantTone: 'higher-quality',
        summary: '这版保留更高质量输出，只收缩最不必要的成本点。',
        reasons: ['适合仍要优先保证结果质量的场景。'],
      },
    ]
  }

  return undefined
}

/* ─── Private: Helpers ────────────────────────────────── */

function assetKindLabel(kind: 'image' | 'video' | 'audio' | 'text'): string {
  switch (kind) {
    case 'image': return '图片'
    case 'video': return '视频'
    case 'audio': return '音频'
    case 'text': return '文本'
  }
}
