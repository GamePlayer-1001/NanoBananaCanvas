# apps/web/components/nodes/

> L2 | 父级: apps/web/components/CLAUDE.md

节点组件

## 成员清单

```
plugin-registry.ts       — NodePluginMeta 节点元数据注册中心 (ports/defaults/category/icon，单一真相源)
registry.ts              — NODE_TYPES 节点类型→组件映射 (ReactFlow 消费)
base-node.tsx       — BaseNode 节点基础框架 (从 plugin-registry 读取端口，渲染状态指示/Handle/端口标签/选中样式，并统一提供稳定默认尺寸、内容裁切与边缘缩放)
text-node.tsx       — TextNode 纯文本输入节点 (单纯的文本输入，通过 Text string 管道输出给下一个节点)
text-input-node.tsx — TextInputNode 文本输入节点（现收口 `800` 字输入上限，并放宽节点高度/底部留白，让底部字数提示不再紧贴边缘；节点底部会回显当前字数与剩余额度，避免超长提示词把图片主链拖入异常长耗时）
image-input-node.tsx — ImageInputNode 图片输入节点 (R2 上传 + 固定内容区图片预览 + image-out 输出)
image-mask-node.tsx  — ImageMaskNode 笔刷蒙版节点 (节点内自包含 ImageUpload 直接落 config.imageUrl + canvas 笔刷/橡皮/撤销/清空 + 防抖将白色蒙版 PNG 上传 R2 写入 config.maskUrl + 单一 image-out 同时承载 `{imageUrl, maskUrl}` 复合负载，下游 image-gen 自动解包；笔刷/橡皮工具切换时光标对应变化)
llm-node.tsx        — LLMNode 大语言模型节点 (platformProvider/platformModel 与 userKeyConfigId 分离；平台模式只暴露 4 个 comfly 静态文本模型且不再单独显示供应商字段，用户模式保留多协议自配置，支持温度/MaxTokens/SystemPrompt/流式输出，并通过 showPreview 开关控制节点内结果预览)
display-node.tsx    — DisplayNode 结果展示节点 (默认节点名已统一回显为 `output`，并会把旧的 `Display/显示` 标签自动迁移成 `output`；递归渲染文本/图片/视频/音频/JSON/数组对象/裸 base64，以固定节点框体承载滚动文本与 contain 媒体预览，并支持浏览器下载)
image-gen-node.tsx  — ImageGenNode 图片生成节点 (平台模式当前仅在下拉中展示 GPT Image 2，Nano Banana 系列仍保留在逻辑目录与执行链中但对用户隐藏；节点内部始终归一到 dlapi 直出图主链，执行异常时再由后端处理器托底到 comfly 对应兼容模型；用户模式绑定 userKeyConfigId，并按能力表动态禁用非法尺寸与比例，节点内预览固定在内容区内缩放)
video-gen-node.tsx  — VideoGenNode 视频生成节点 (当前已隐藏平台模式，仅保留用户自配置执行链；支持时长/画面比例/模式/视频播放/进度条，并把视频预览固定收口在节点内容区内)
audio-gen-node.tsx  — AudioGenNode 音频生成节点 (当前已隐藏平台模式，仅保留用户自配置执行链；支持语音选择/语速调节/音频播放，并把音频预览固定收口在节点内容区内)
merge-node.tsx      — TextMergeNode/ImageMergeNode 工具节点 (多文本/多图片显式汇聚，端口由 plugin-registry 驱动)
note-node.tsx       — NoteNode 备注节点 (可编辑文本+颜色选择器+边缘缩放，纯视觉，不参与执行)
group-node.tsx           — GroupNode 分组容器节点 (可调整大小+颜色，支持边缘悬停缩放，纯视觉)
conditional-node.tsx     — ConditionalNode 条件分支节点 (运算符选择/比较值，路由到 true-out/false-out)
loop-node.tsx            — LoopNode 循环节点 (forEach/repeat 模式，迭代执行 body 子图)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
