# apps/web/components/nodes/

> L2 | 父级: apps/web/components/CLAUDE.md

节点组件

## 成员清单

```
plugin-registry.ts       — NodePluginMeta 节点元数据注册中心 (ports/defaults/category/icon，单一真相源)
registry.ts              — NODE_TYPES 节点类型→组件映射 (ReactFlow 消费)
base-node.tsx       — BaseNode 节点基础框架 (从 plugin-registry 读取端口，渲染状态指示/Handle/端口标签/选中样式)
text-input-node.tsx — TextInputNode 文本输入节点
image-input-node.tsx — ImageInputNode 图片输入节点 (R2 上传 + 图片预览 + image-out 输出)
llm-node.tsx        — LLMNode 大语言模型节点 (platformProvider/platformModel 与 userKeyConfigId 分离，平台执行 + 文本 API 配置卡片/温度/MaxTokens/SystemPrompt/流式输出)
display-node.tsx    — DisplayNode 结果展示节点 (Markdown 渲染/复制按钮)
image-gen-node.tsx  — ImageGenNode 图片生成节点 (平台只写 platformProvider/platformModel，账号模式仅绑定 userKeyConfigId/尺寸选择/图片预览)
video-gen-node.tsx  — VideoGenNode 视频生成节点 (平台 provider/model 与用户视频配置彻底分离，支持时长/画面比例/模式/视频播放/进度条)
audio-gen-node.tsx  — AudioGenNode 音频生成节点 (平台 provider/model 与用户音频配置分离，支持语音选择/语速调节/音频播放)
merge-node.tsx      — TextMergeNode/ImageMergeNode 工具节点 (多文本/多图片显式汇聚，端口由 plugin-registry 驱动)
note-node.tsx       — NoteNode 备注节点 (可编辑文本+颜色选择器，纯视觉，不参与执行)
group-node.tsx           — GroupNode 分组容器节点 (可调整大小+颜色，NodeResizer，纯视觉)
conditional-node.tsx     — ConditionalNode 条件分支节点 (运算符选择/比较值，路由到 true-out/false-out)
loop-node.tsx            — LoopNode 循环节点 (forEach/repeat 模式，迭代执行 body 子图)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
