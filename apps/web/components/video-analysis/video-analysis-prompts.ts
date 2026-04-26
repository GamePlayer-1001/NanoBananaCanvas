/**
 * [INPUT]: 无运行时外部依赖
 * [OUTPUT]: 对外提供 buildVideoAnalysisSystemPrompt / buildVideoAnalysisUserPrompt / VIDEO_ANALYSIS_OUTPUT_SCHEMA
 * [POS]: video-analysis 的提示词模板层，为未来视频理解后端与结构化分镜/剧本输出提供单一真相源
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

/* ─── Types ──────────────────────────────────────────── */

export interface VideoAnalysisPromptOptions {
  language?: 'zh-CN' | 'en-US'
  targetDurationSeconds?: number
  desiredShotGranularity?: 'coarse' | 'balanced' | 'dense'
  screenplayStyle?: 'cinematic' | 'commercial' | 'documentary' | 'social'
  includeVoiceoverDraft?: boolean
  includeDialogueDraft?: boolean
}

/* ─── Output Contract ────────────────────────────────── */

export const VIDEO_ANALYSIS_OUTPUT_SCHEMA = String.raw`{
  "language": "zh-CN",
  "videoSummary": {
    "logline": "一句话概括视频主事件与主情绪",
    "narrativeArc": "用 3-6 句概括开场、发展、转折、收束",
    "visualStyle": "概括画面风格、镜头气质、光线色调、节奏",
    "primaryCharacters": ["核心人物或主体 1", "核心人物或主体 2"],
    "primaryLocations": ["核心场景 1", "核心场景 2"],
    "keywords": ["主题词 1", "主题词 2", "主题词 3"]
  },
  "storyboard": [
    {
      "shotNumber": 1,
      "startTime": "00:00.000",
      "endTime": "00:03.200",
      "durationSeconds": 3.2,
      "shotType": "远景/全景/中景/近景/特写/俯拍/仰拍/跟拍/手持/航拍等",
      "cameraMovement": "固定/推进/拉远/平移/摇摄/跟随/变焦等",
      "subject": "这一镜头中最重要的人物、物体或动作主体",
      "action": "镜头里发生了什么",
      "sceneDescription": "环境、布景、光线、构图、色彩与氛围",
      "emotion": "镜头传递的主情绪",
      "dialogueOrOnScreenText": "听到或看到的关键台词/字幕/画面文字，没有则留空字符串",
      "soundDesign": "环境音、音乐、音效建议，没有则留空字符串",
      "editingCue": "剪辑衔接建议、节奏功能、转场用途",
      "storyFunction": "该镜头在叙事中的作用"
    }
  ],
  "screenplay": {
    "title": "自动生成标题",
    "format": "短视频/广告片/剧情短片/纪录风格等",
    "tone": "整体语气与情绪基调",
    "premise": "一句话故事前提",
    "beatSheet": [
      {
        "beat": 1,
        "name": "开场建立",
        "summary": "这一段剧情推进了什么"
      }
    ],
    "sceneDraft": [
      {
        "sceneNumber": 1,
        "timeRange": "00:00.000-00:08.500",
        "sceneHeading": "INT./EXT. + 场景 + 时间",
        "action": "符合剧本格式的动作描述",
        "dialogue": [
          {
            "speaker": "角色名",
            "line": "台词内容"
          }
        ],
        "voiceover": "旁白，没有则留空字符串"
      }
    ]
  },
  "confidenceNotes": {
    "overallConfidence": "high/medium/low",
    "uncertainMoments": ["识别不确定的镜头、人物、字幕或动作点"],
    "missingContext": ["若视频缺少完整上下文，这里指出限制"]
  }
}`

/* ─── Prompt Builders ────────────────────────────────── */

export function buildVideoAnalysisSystemPrompt(
  options: VideoAnalysisPromptOptions = {},
): string {
  const language = options.language ?? 'zh-CN'
  const granularity = options.desiredShotGranularity ?? 'balanced'
  const screenplayStyle = options.screenplayStyle ?? 'cinematic'
  const includeVoiceoverDraft = options.includeVoiceoverDraft ?? true
  const includeDialogueDraft = options.includeDialogueDraft ?? true

  return [
    '你是一名同时具备导演、分镜师、场记、编剧能力的高级视频分析助手。',
    '你的任务不是简单总结视频，而是把视频还原成可继续生产的结构化前期文档。',
    `输出语言必须是 ${language}。`,
    `镜头拆解密度使用 ${granularity} 级别：coarse 表示较粗颗粒，balanced 表示适中，dense 表示尽可能细。`,
    `剧本语气默认采用 ${screenplayStyle} 风格。`,
    `旁白草稿 ${includeVoiceoverDraft ? '必须给出' : '除非非常必要否则不要生成'}。`,
    `对白草稿 ${includeDialogueDraft ? '必须尽量补全' : '如无明确语音证据则可留空'}。`,
    '如果视频中没有真实对白，不要虚构大量对白；可以给出最小必要草稿，并在 confidenceNotes 中说明推断成分。',
    '必须严格输出 JSON，不能输出 Markdown，不能输出解释，不能在 JSON 前后加任何额外文本。',
    '必须尽量基于视频中真实看见或听见的内容分析；无法确定的信息要显式标注不确定，不准装作确定。',
    'storyboard 中每个镜头都要写清时间段、镜头类型、主体动作、环境描述、情绪、声音与叙事作用。',
    'screenplay.sceneDraft 要把 storyboard 提炼成可继续编辑的剧本草稿，而不是逐字重复分镜描述。',
    '如果视频是广告、短视频、剧情片、Vlog 或纪录片，请优先保持原有节奏和表达目的。',
    '如果视频时长较长，可按段落先分章节，再在章节内细分镜头，但最终 storyboard 仍必须是线性数组。',
    '输出必须满足以下 JSON 结构：',
    VIDEO_ANALYSIS_OUTPUT_SCHEMA,
  ].join('\n')
}

export function buildVideoAnalysisUserPrompt(
  fileName: string,
  options: VideoAnalysisPromptOptions = {},
): string {
  const targetDurationSeconds =
    typeof options.targetDurationSeconds === 'number'
      ? `视频总时长约 ${options.targetDurationSeconds} 秒。`
      : '如果你能从视频中判断总时长，请在 storyboard 与 sceneDraft 中保持时间覆盖完整。'

  return [
    `请分析文件《${fileName}》。`,
    targetDurationSeconds,
    '请先整体理解视频叙事，再按时间顺序拆解镜头。',
    '重点产出两类结果：',
    '1. 可用于制片/导演沟通的分镜表。',
    '2. 可继续改写成正式文本的剧本草稿。',
    '如果视频更像情绪片、MV、广告或无对白短片，也仍然要给出：镜头节奏、画面意图、潜台词、动作组织方式。',
    '请特别关注以下信息：人物出场、场景切换、镜头运动、字幕文案、关键道具、情绪转折、配乐与音效功能。',
    '如果某段内容由于画面模糊、剪辑过快、音频不清而无法完全确认，请在 confidenceNotes 中记录。',
  ].join('\n')
}
