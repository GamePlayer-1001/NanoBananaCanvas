-- ============================================
--  Nano Banana Canvas — 模型定价 + 积分包种子数据
--  Version: 1.0 (M7)
-- ============================================

-- ── LLM 文本生成模型 ─────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-001', 'openrouter', 'deepseek/deepseek-chat',       'DeepSeek V3',       'text', 1,  'basic',    'free'),
  ('mp-002', 'openrouter', 'google/gemini-2.0-flash-exp',  'Gemini 2.0 Flash',  'text', 1,  'basic',    'free'),
  ('mp-003', 'openrouter', 'openai/gpt-4o-mini',           'GPT-4o Mini',       'text', 3,  'standard', 'free'),
  ('mp-004', 'openrouter', 'anthropic/claude-3.5-haiku',    'Claude 3.5 Haiku',  'text', 3,  'standard', 'free'),
  ('mp-005', 'openrouter', 'openai/gpt-4o',                'GPT-4o',            'text', 8,  'premium',  'standard'),
  ('mp-006', 'openrouter', 'anthropic/claude-sonnet-4',     'Claude Sonnet 4',   'text', 8,  'premium',  'standard'),
  ('mp-007', 'openrouter', 'google/gemini-2.5-pro',        'Gemini 2.5 Pro',    'text', 8,  'premium',  'standard'),
  ('mp-008', 'openrouter', 'openai/o1',                    'OpenAI o1',         'text', 20, 'flagship', 'pro'),
  ('mp-009', 'openrouter', 'anthropic/claude-opus-4',      'Claude Opus 4',     'text', 20, 'flagship', 'pro');

-- ── 图片生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-101', 'openrouter', 'stabilityai/sd-3.5',           'Stable Diffusion 3.5', 'image', 10, 'standard', 'free'),
  ('mp-102', 'openrouter', 'black-forest-labs/flux-schnell','FLUX.1 Schnell',       'image', 10, 'standard', 'free'),
  ('mp-103', 'openrouter', 'openai/dall-e-3',              'DALL-E 3',             'image', 25, 'premium',  'standard'),
  ('mp-104', 'openrouter', 'black-forest-labs/flux-pro',   'FLUX.1 Pro',           'image', 50, 'flagship', 'pro');

-- ── 视频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-201', 'kling',      'kling/standard-5s',            'Kling Standard 5s',  'video', 50,  'standard', 'standard'),
  ('mp-202', 'kling',      'kling/pro-10s',                'Kling Pro 10s',      'video', 150, 'premium',  'pro'),
  ('mp-203', 'kling',      'kling/master-15s',             'Kling Master 15s',   'video', 300, 'flagship', 'ultimate');

-- ── 音频生成模型 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan) VALUES
  ('mp-301', 'openrouter', 'edge-tts/standard',            'Edge TTS',           'audio', 5,  'basic',    'free'),
  ('mp-302', 'openrouter', 'elevenlabs/multilingual-v2',   'ElevenLabs V2',      'audio', 15, 'premium',  'standard');

-- ── 积分包 ───────────────────────────────────

INSERT OR IGNORE INTO credit_packages (id, name, credits, price_cents, bonus_credits, sort_order) VALUES
  ('pack-500',  'Starter',    500,  500,  0,    1),
  ('pack-1200', 'Popular',    1200, 1000, 200,  2),
  ('pack-3500', 'Power',      3500, 2500, 1000, 3),
  ('pack-8000', 'Ultimate',   8000, 5000, 3000, 4);