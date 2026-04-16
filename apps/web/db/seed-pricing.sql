-- ============================================
--  Nano Banana Canvas — 模型目录种子数据
--  Version: 1.2 (兼容历史定价字段)
-- ============================================

-- ── LLM 文本生成模型 ─────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-001', 'openrouter', 'deepseek/deepseek-chat',       'DeepSeek V3',       'text', 1,  'basic',    'free'),
  ('mp-002', 'openrouter', 'google/gemini-2.0-flash-exp',  'Gemini 2.0 Flash',  'text', 1,  'basic',    'free'),
  ('mp-003', 'openrouter', 'openai/gpt-4o-mini',           'GPT-4o Mini',       'text', 3,  'standard', 'free'),
  ('mp-004', 'openrouter', 'anthropic/claude-3.5-haiku',    'Claude 3.5 Haiku',  'text', 3,  'standard', 'free'),
  ('mp-005', 'openrouter', 'openai/gpt-4o',                'GPT-4o',            'text', 8,  'premium',  'pro'),
  ('mp-006', 'openrouter', 'anthropic/claude-sonnet-4',     'Claude Sonnet 4',   'text', 8,  'premium',  'pro'),
  ('mp-007', 'openrouter', 'google/gemini-2.5-pro',        'Gemini 2.5 Pro',    'text', 8,  'premium',  'pro'),
  ('mp-008', 'openrouter', 'openai/o1',                    'OpenAI o1',         'text', 20, 'flagship', 'pro'),
  ('mp-009', 'openrouter', 'anthropic/claude-opus-4',      'Claude Opus 4',     'text', 20, 'flagship', 'pro');

-- ── 图片生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-101', 'openrouter', 'stabilityai/sd-3.5',           'Stable Diffusion 3.5', 'image', 10, 'standard', 'free'),
  ('mp-102', 'openrouter', 'black-forest-labs/flux-schnell','FLUX.1 Schnell',       'image', 10, 'standard', 'free'),
  ('mp-103', 'openrouter', 'openai/dall-e-3',              'DALL-E 3',             'image', 25, 'premium',  'pro'),
  ('mp-104', 'openrouter', 'black-forest-labs/flux-pro',   'FLUX.1 Pro',           'image', 50, 'flagship', 'pro');

-- ── 视频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-201', 'kling',      'kling-v2-0',                   'Kling V2.0',         'video', 15,  'premium',  'pro'),
  ('mp-202', 'kling',      'kling-v1-6',                   'Kling V1.6',         'video', 10,  'standard', 'free');

-- ── 音频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-301', 'openai',     'tts-1',                        'OpenAI TTS-1',       'audio', 5,  'basic',    'free'),
  ('mp-302', 'openai',     'tts-1-hd',                     'OpenAI TTS-1 HD',    'audio', 12, 'premium',  'pro');
