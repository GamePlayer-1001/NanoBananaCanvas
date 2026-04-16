-- P2: 新增 DeepSeek + Gemini 直连模型目录项
-- 这些模型通过平台 Key 直接调用 (非 OpenRouter 代理)

-- DeepSeek 模型 (高性价比)
INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier, is_active)
VALUES
  ('mp-ds-1', 'deepseek', 'deepseek-chat', 'DeepSeek Chat', 'text', 'basic', 1),
  ('mp-ds-2', 'deepseek', 'deepseek-reasoner', 'DeepSeek Reasoner', 'text', 'standard', 1);

-- Gemini 模型 (直连 Google API)
INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier, is_active)
VALUES
  ('mp-gm-1', 'gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 'text', 'standard', 1),
  ('mp-gm-2', 'gemini', 'gemini-2.5-pro-preview-06-05', 'Gemini 2.5 Pro', 'text', 'premium', 1);

-- 图片生成模型
INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier, is_active)
VALUES
  ('mp-img-1', 'openrouter', 'openai/dall-e-3', 'DALL-E 3', 'image', 'standard', 1),
  ('mp-img-2', 'gemini', 'imagen-3.0-generate-002', 'Imagen 3', 'image', 'standard', 1);

-- 视频生成模型
INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier, is_active)
VALUES
  ('mp-vid-1', 'kling', 'kling-v2-0', 'Kling V2.0', 'video', 'premium', 1),
  ('mp-vid-2', 'kling', 'kling-v1-6', 'Kling V1.6', 'video', 'standard', 1),
  ('mp-vid-3', 'jimeng', 'seedance-2.0', 'Seedance 2.0', 'video', 'premium', 0);
