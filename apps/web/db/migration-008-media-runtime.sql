-- P8: 对齐生产环境媒体运行时模型
-- 目标:
-- 1. 视频积分模型与当前 Kling 节点默认值一致
-- 2. 音频节点改为 OpenAI TTS 平台模型

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan, is_active)
VALUES
  ('mp-aud-1', 'openai', 'tts-1', 'OpenAI TTS-1', 'audio', 5, 'basic', 'free', 1),
  ('mp-aud-2', 'openai', 'tts-1-hd', 'OpenAI TTS-1 HD', 'audio', 12, 'premium', 'pro', 1);

UPDATE model_pricing
SET
  model_id = 'kling-v2-0',
  model_name = 'Kling V2.0',
  credits_per_call = 15,
  tier = 'premium',
  min_plan = 'pro',
  is_active = 1
WHERE id = 'mp-201';

UPDATE model_pricing
SET
  model_id = 'kling-v1-6',
  model_name = 'Kling V1.6',
  credits_per_call = 10,
  tier = 'standard',
  min_plan = 'free',
  is_active = 1
WHERE id = 'mp-202';

DELETE FROM model_pricing
WHERE id = 'mp-203';

UPDATE model_pricing
SET
  provider = 'openai',
  model_id = 'tts-1',
  model_name = 'OpenAI TTS-1',
  credits_per_call = 5,
  tier = 'basic',
  min_plan = 'free',
  is_active = 1
WHERE id = 'mp-301';

UPDATE model_pricing
SET
  provider = 'openai',
  model_id = 'tts-1-hd',
  model_name = 'OpenAI TTS-1 HD',
  credits_per_call = 12,
  tier = 'premium',
  min_plan = 'pro',
  is_active = 1
WHERE id = 'mp-302';
