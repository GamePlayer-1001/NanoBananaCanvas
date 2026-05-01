# apps/web/components/nodes/

> L2 | 父级: apps/web/components/CLAUDE.md

节点组件

## 成员清单

```
plugin-registry.ts       — NodePluginMeta 节点元数据注册中心 (ports/defaults/category/icon，单一真相源)
registry.ts              — NODE_TYPES 节点类型→组件映射 (ReactFlow 消费)
base-node.tsx       — BaseNode 节点基础框架 (从 plugin-registry 读取端口，渲染状态指示/Handle/端口标签/选中样式，并统一提供稳定默认尺寸与边缘缩放)
text-input-node.tsx — TextInputNode 文本输入节点
image-input-node.tsx — ImageInputNode 图片输入节点 (R2 上传 + 图片预览 + image-out 输出)
llm-node.tsx        — LLMNode 大语言模型节点 (platformProvider/platformModel 与 userKeyConfigId 分离，平台执行 + 文本 API 配置卡片/温度/MaxTokens/SystemPrompt/流式输出)
display-node.tsx    — DisplayNode 结果展示节点 (递归渲染文本/图片/视频/音频/JSON/数组对象/裸 base64，以扁平结果视图直接展示并支持浏览器下载)
image-gen-node.tsx  — ImageGenNode 图片生成节点 (平台模式动态读取 `/api/ai/models?category=image` 且收口为 logo + 模型名单模型选择，账号模式绑定 userKeyConfigId，并按静态/学习能力动态禁用非法尺寸与比例与展示平台积分价签，节点内预览可切换)
video-gen-node.tsx  — VideoGenNode 视频生成节点 (平台模型下拉统一为 logo + 模型名，平台 provider/model 与用户视频配置彻底分离，支持时长/画面比例/模式/视频播放/进度条，并在缺少自有配置时触发前三次引导，节点内预览可切换)
audio-gen-node.tsx  — AudioGenNode 音频生成节点 (平台模型下拉统一为 logo + 模型名，平台 provider/model 与用户音频配置分离，支持语音选择/语速调节/音频播放，并在缺少自有配置时触发前三次引导，节点内预览可切换)
merge-node.tsx      — TextMergeNode/ImageMergeNode 工具节点 (多文本/多图片显式汇聚，端口由 plugin-registry 驱动)
note-node.tsx       — NoteNode 备注节点 (可编辑文本+颜色选择器+边缘缩放，纯视觉，不参与执行)
group-node.tsx           — GroupNode 分组容器节点 (可调整大小+颜色，支持边缘悬停缩放，纯视觉)
conditional-node.tsx     — ConditionalNode 条件分支节点 (运算符选择/比较值，路由到 true-out/false-out)
loop-node.tsx            — LoopNode 循环节点 (forEach/repeat 模式，迭代执行 body 子图)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
