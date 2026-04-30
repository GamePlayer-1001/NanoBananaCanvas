/**
 * [INPUT]: 依赖 @/types 的 TemplateSummary，依赖 @/services/storage/serializer 与 @/lib/utils/create-node
 * [OUTPUT]: 对外提供模板目录查询、模板序列化快照与模板起手工作流构造器
 * [POS]: lib/agent 的模板真相源，为新建项目、模板解释与模板改造规划提供统一目录
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import type { Edge } from '@xyflow/react'
import type { TemplateSummary, WorkflowAuditEntry, WorkflowNode, WorkflowNodeData } from '@/types'
import { createNode } from '@/lib/utils/create-node'
import { serializeWorkflow, type SerializedWorkflow } from '@/services/storage/serializer'

interface TemplateDefinition {
  summary: TemplateSummary
  buildWorkflow: () => {
    nodes: WorkflowNode[]
    edges: Edge[]
  }
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    summary: {
      id: 'tpl_ecom_image_launch',
      key: 'ecom-image-launch',
      name: '电商商品图起手模板',
      description: '从商品卖点梳理、视觉风格规划到主图生成与展示的一条基础链路。',
      goal: '快速产出可继续迭代的商品主图工作流',
      category: 'image-commerce',
      targetAudience: ['电商运营', '品牌设计', '内容团队'],
      applicableIndustries: ['服装', '美妆', '3C', '家居'],
      recommendedStyles: ['写实商业', '简洁棚拍', '品牌广告感'],
      defaultPrompt: '请基于商品卖点生成一版适合电商主图的高转化视觉描述。',
      defaultModel: 'openai/dall-e-3',
      defaultOutputSpec: {
        modality: 'image',
        count: 4,
        aspectRatio: '1:1',
      },
      source: 'system-template',
    },
    buildWorkflow: () => {
      const input = createNode('text-input', { x: 80, y: 160 })
      input.data = patchNode(input.data, {
        label: '商品卖点',
        config: { text: '输入商品、材质、卖点与受众。' },
      })

      const planner = createNode('llm', { x: 360, y: 160 })
      planner.data = patchNode(planner.data, {
        label: '电商视觉规划',
        config: {
          platformProvider: 'openrouter',
          platformModel: 'openai/gpt-4o-mini',
          text: '提炼商品卖点，输出适合电商主图的视觉方向、构图与场景建议。',
        },
      })

      const imageGen = createNode('image-gen', { x: 680, y: 160 })
      imageGen.data = patchNode(imageGen.data, {
        label: '商品主图生成',
        config: {
          platformProvider: 'openrouter',
          platformModel: 'openai/dall-e-3',
          aspectRatio: '1:1',
          size: 'auto',
          outputCount: 4,
        },
      })

      const display = createNode('display', { x: 980, y: 160 })
      display.data = patchNode(display.data, {
        label: '主图结果',
      })

      return {
        nodes: [input, planner, imageGen, display],
        edges: [
          makeEdge(input.id, 'text-out', planner.id, 'prompt-in'),
          makeEdge(planner.id, 'text-out', imageGen.id, 'prompt-in'),
          makeEdge(imageGen.id, 'image-out', display.id, 'content-in'),
        ],
      }
    },
  },
  {
    summary: {
      id: 'tpl_social_video_pitch',
      key: 'social-video-pitch',
      name: '短视频脚本起手模板',
      description: '围绕选题、脚本结构和分镜提示，把短视频创意先串成一条可执行主链。',
      goal: '快速产出短视频脚本与分镜生成工作流',
      category: 'video-content',
      targetAudience: ['内容策划', '短视频团队', '独立创作者'],
      applicableIndustries: ['服装', '餐饮', '教育', '泛品牌内容'],
      recommendedStyles: ['节奏快', '剧情反转', '强卖点引导'],
      defaultPrompt: '请基于主题输出一个适合短视频传播的脚本与分镜结构。',
      defaultModel: 'openai/gpt-4o-mini',
      defaultOutputSpec: {
        modality: 'text',
        count: 1,
      },
      source: 'system-template',
    },
    buildWorkflow: () => {
      const input = createNode('text-input', { x: 80, y: 200 })
      input.data = patchNode(input.data, {
        label: '选题输入',
        config: { text: '输入主题、受众、平台和核心卖点。' },
      })

      const script = createNode('llm', { x: 360, y: 200 })
      script.data = patchNode(script.data, {
        label: '脚本策划',
        config: {
          platformProvider: 'openrouter',
          platformModel: 'openai/gpt-4o-mini',
          text: '把输入整理成短视频脚本结构，包括 hook、冲突、卖点与结尾 CTA。',
        },
      })

      const display = createNode('display', { x: 680, y: 200 })
      display.data = patchNode(display.data, {
        label: '脚本结果',
      })

      return {
        nodes: [input, script, display],
        edges: [
          makeEdge(input.id, 'text-out', script.id, 'prompt-in'),
          makeEdge(script.id, 'text-out', display.id, 'content-in'),
        ],
      }
    },
  },
]

export function listWorkflowTemplates(): TemplateSummary[] {
  return TEMPLATE_DEFINITIONS.map((item) => structuredClone(item.summary))
}

export function getWorkflowTemplateById(templateId: string): TemplateSummary | null {
  return (
    TEMPLATE_DEFINITIONS.find((item) => item.summary.id === templateId)?.summary
      ? structuredClone(TEMPLATE_DEFINITIONS.find((item) => item.summary.id === templateId)!.summary)
      : null
  )
}

export function buildTemplateWorkflow(templateId: string): SerializedWorkflow | null {
  const definition = TEMPLATE_DEFINITIONS.find((item) => item.summary.id === templateId)
  if (!definition) return null

  const workflow = definition.buildWorkflow()
  const auditTrail: WorkflowAuditEntry[] = [
    {
      id: `audit_${templateId}_created`,
      kind: 'template-created',
      message: `基于模板「${definition.summary.name}」创建工作流。`,
      createdAt: new Date().toISOString(),
      actor: 'user',
      templateId: definition.summary.id,
      templateName: definition.summary.name,
    },
  ]

  return serializeWorkflow(workflow.nodes, workflow.edges, { x: 0, y: 0, zoom: 1 }, definition.summary.name, {
    template: structuredClone(definition.summary),
    auditTrail,
  })
}

function patchNode(
  data: WorkflowNodeData,
  patch: { label?: string; config?: Record<string, unknown> },
): WorkflowNodeData {
  return {
    ...data,
    ...(patch.label ? { label: patch.label } : {}),
    config: {
      ...data.config,
      ...(patch.config ?? {}),
    },
  }
}

function makeEdge(source: string, sourceHandle: string, target: string, targetHandle: string): Edge {
  return {
    id: crypto.randomUUID(),
    source,
    sourceHandle,
    target,
    targetHandle,
    type: 'custom',
  }
}
