# video-analysis/
> L2 | 父级: components/CLAUDE.md

## 成员清单

video-analysis-content.tsx: VideoAnalysisContent 客户端容器，组合上传/模型/真实执行入口/结果展示/账号历史拉取，默认模型为 Gemini 2.5 Flash
upload-area.tsx: UploadArea 拖拽上传区组件，支持视频预览、文件大小与 600 秒时长校验
model-selector.tsx: ModelSelector AI 模型下拉选择，默认 Gemini 2.5 Flash，支持切换到 Gemini 3 Pro Preview
analysis-history.tsx: AnalysisHistory 分析历史面板，展示分析中/成功/失败状态并支持结果回看
analysis-result.tsx: AnalysisResult 结构化结果展示区，渲染摘要、分镜表、剧本草稿与置信说明
video-analysis-prompts.ts: VideoAnalysis 提示词模板与结果归一化层，统一约束分镜表/剧本 JSON 输出结构与分析口径

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
