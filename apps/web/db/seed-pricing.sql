-- ============================================
--  Nano Banana Canvas — Billing Seed Data
--  目标:
--  1. 初始化积分包目录
--  2. 初始化 token 计费版本模型定价
--  3. 与 Stripe 四档套餐 + 积分包主方案对齐
-- ============================================

-- ── 默认积分包 ───────────────────────────────

INSERT OR IGNORE INTO credit_packages (id, name, credits, price_cents, bonus_credits, is_active, sort_order)
VALUES
  ('pack_500', '500 Credits', 500, 500, 0, 1, 1),
  ('pack_1200', '1,200 Credits', 1000, 1000, 200, 1, 2),
  ('pack_3500', '3,500 Credits', 2500, 2500, 1000, 1, 3),
  ('pack_8000', '8,000 Credits', 5000, 5000, 3000, 1, 4);

-- ── 默认模型定价 ─────────────────────────────

INSERT OR IGNORE INTO model_pricing (
  id,
  provider,
  model_id,
  model_name,
  category,
  credits_per_1k_units,
  tier,
  min_plan,
  is_active
)
VALUES
  -- 文本模型
  ('mpr-text-001', 'deepseek', 'deepseek-chat', 'DeepSeek V3', 'text', 1, 'basic', 'free', 1),
  ('mpr-text-002', 'gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 'text', 1, 'basic', 'free', 1),
  ('mpr-text-003', 'openrouter', 'openai/gpt-4o-mini', 'GPT-4o Mini', 'text', 3, 'standard', 'free', 1),
  ('mpr-text-004', 'openrouter', 'anthropic/claude-3.5-haiku', 'Claude 3.5 Haiku', 'text', 3, 'standard', 'free', 1),
  ('mpr-text-005', 'openrouter', 'openai/gpt-4o', 'GPT-4o', 'text', 8, 'premium', 'standard', 1),
  ('mpr-text-006', 'openrouter', 'anthropic/claude-sonnet-4', 'Claude Sonnet 4', 'text', 8, 'premium', 'standard', 1),
  ('mpr-text-007', 'openrouter', 'openai/o1', 'OpenAI o1', 'text', 20, 'flagship', 'pro', 1),
  ('mpr-text-008', 'openrouter', 'anthropic/claude-opus-4', 'Claude Opus 4', 'text', 20, 'flagship', 'pro', 1),

  -- 图片模型
  ('mpr-image-001', 'openrouter', 'black-forest-labs/flux-schnell', 'FLUX.1 Schnell', 'image', 10, 'basic', 'free', 1),
  ('mpr-image-002', 'openrouter', 'openai/dall-e-3', 'DALL-E 3', 'image', 25, 'premium', 'standard', 1),
  ('mpr-image-003', 'gemini', 'gemini-2.0-flash-image', 'Gemini Image Gen', 'image', 30, 'premium', 'standard', 1),
  ('mpr-image-004', 'openrouter', 'black-forest-labs/flux-pro', 'FLUX.1 Pro', 'image', 50, 'flagship', 'pro', 1),
  ('mpr-image-005', 'dlapi', 'gpt-image-2', 'GPT Image 2', 'image', 30, 'premium', 'standard', 1),
  ('mpr-image-006', 'comfly', 'dall-e-3', 'DALL-E 3 (Comfly)', 'image', 35, 'premium', 'standard', 1),
  ('mpr-image-007', 'comfly', 'gemini-2.5-flash-image', 'Gemini 2.5 Flash Image', 'image', 35, 'premium', 'standard', 1),

  -- 视频模型
  ('mpr-video-001', 'kling', 'kling-v1-6', 'Kling V1.6', 'video', 50, 'standard', 'standard', 1),
  ('mpr-video-002', 'kling', 'kling-v2-0', 'Kling V2.0', 'video', 150, 'premium', 'pro', 1),
  ('mpr-video-003', 'runway', 'gen-3-alpha', 'Runway Gen-3', 'video', 150, 'premium', 'pro', 1),
  ('mpr-video-004', 'sora', 'sora-standard', 'Sora', 'video', 300, 'flagship', 'ultimate', 1),
  ('mpr-video-005', 'comfly', 'gemini-2.5-flash', 'Gemini 2.5 Flash Video Analysis', 'video', 30, 'premium', 'pro', 1),
  ('mpr-video-006', 'comfly', 'gemini-3-pro-preview', 'Gemini 3 Pro Preview Video Analysis', 'video', 120, 'flagship', 'pro', 1),

  -- 音频模型
  ('mpr-audio-001', 'openai', 'tts-1', 'OpenAI TTS-1', 'audio', 5, 'basic', 'free', 1),
  ('mpr-audio-002', 'openai', 'tts-1-hd', 'OpenAI TTS-1 HD', 'audio', 15, 'premium', 'standard', 1),
  ('mpr-audio-003', 'elevenlabs', 'eleven-multilingual-v2', 'ElevenLabs', 'audio', 15, 'premium', 'standard', 1);
