# apps/web/components/nodes/

> L2 | 父级: apps/web/components/CLAUDE.md

节点组件

## 成员清单

```
registry.ts         — NODE_TYPES 节点类型注册中心 (text-input/llm/display/image-gen/video-gen/audio-gen)
base-node.tsx       — BaseNode 节点基础框架 (状态指示/Handle/选中样式)
text-input-node.tsx — TextInputNode 文本输入节点
llm-node.tsx        — LLMNode 大语言模型节点 (多 Provider 选择/动态模型列表/温度/MaxTokens/SystemPrompt/流式输出)
display-node.tsx    — DisplayNode 结果展示节点 (Markdown 渲染/复制按钮)
image-gen-node.tsx  — ImageGenNode 图片生成节点 (OpenRouter+Gemini/尺寸选择/图片预览)
video-gen-node.tsx  — VideoGenNode 视频生成节点 (可灵+即梦/时长/画面比例/模式/视频播放/进度条)
audio-gen-node.tsx  — AudioGenNode 音频生成节点 (OpenAI TTS/模型选择/语音选择/语速调节/音频播放)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
