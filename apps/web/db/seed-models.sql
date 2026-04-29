-- ============================================
--  Nano Banana Canvas — 模型目录种子数据
--  Version: 2.0 (统一免费目录表)
-- ============================================

-- ── LLM 文本生成模型 ─────────────────────────

INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier) VALUES
  ('mp-001', 'openrouter', 'deepseek/deepseek-chat',       'DeepSeek V3',       'text', 'basic'),
  ('mp-002', 'openrouter', 'google/gemini-2.0-flash-exp',  'Gemini 2.0 Flash',  'text', 'basic'),
  ('mp-003', 'openrouter', 'openai/gpt-4o-mini',           'GPT-4o Mini',       'text', 'standard'),
  ('mp-004', 'openrouter', 'anthropic/claude-3.5-haiku',   'Claude 3.5 Haiku',  'text', 'standard'),
  ('mp-005', 'openrouter', 'openai/gpt-4o',                'GPT-4o',            'text', 'premium'),
  ('mp-006', 'openrouter', 'anthropic/claude-sonnet-4',    'Claude Sonnet 4',   'text', 'premium'),
  ('mp-007', 'openrouter', 'google/gemini-2.5-pro',        'Gemini 2.5 Pro',    'text', 'premium'),
  ('mp-008', 'openrouter', 'openai/o1',                    'OpenAI o1',         'text', 'flagship'),
  ('mp-009', 'openrouter', 'anthropic/claude-opus-4',      'Claude Opus 4',     'text', 'flagship'),
  ('mp-ds-1', 'deepseek',  'deepseek-chat',                'DeepSeek Chat',     'text', 'basic'),
  ('mp-ds-2', 'deepseek',  'deepseek-reasoner',            'DeepSeek Reasoner', 'text', 'standard'),
  ('mp-gm-1', 'gemini',    'gemini-2.0-flash',             'Gemini 2.0 Flash',  'text', 'standard'),
  ('mp-gm-2', 'gemini',    'gemini-2.5-pro-preview-06-05', 'Gemini 2.5 Pro',    'text', 'premium');

-- ── 图片生成模型 ─────────────────────────────

INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier) VALUES
  ('mp-101', 'openrouter', 'stabilityai/sd-3.5',            'Stable Diffusion 3.5', 'image', 'standard'),
  ('mp-102', 'openrouter', 'black-forest-labs/flux-schnell','FLUX.1 Schnell',       'image', 'standard'),
  ('mp-103', 'openrouter', 'openai/dall-e-3',               'DALL-E 3',             'image', 'premium'),
  ('mp-104', 'openrouter', 'black-forest-labs/flux-pro',    'FLUX.1 Pro',           'image', 'flagship'),
  ('mp-img-2', 'gemini',   'imagen-3.0-generate-002',       'Imagen 3',             'image', 'standard'),
  ('mp-105', 'openai',     'dall-e-3',                      'DALL-E 3',             'image', 'premium');

-- ── 视频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier) VALUES
  ('mp-201', 'kling',      'kling-v2-0',                   'Kling V2.0',         'video', 'premium'),
  ('mp-202', 'kling',      'kling-v1-6',                   'Kling V1.6',         'video', 'standard');

-- ── 音频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier) VALUES
  ('mp-301', 'openai',     'tts-1',                        'OpenAI TTS-1',       'audio', 'basic'),
  ('mp-302', 'openai',     'tts-1-hd',                     'OpenAI TTS-1 HD',    'audio', 'premium');
