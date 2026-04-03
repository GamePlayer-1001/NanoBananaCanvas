-- P8: 对齐生产环境媒体运行时模型
-- 目标:
-- 1. 视频积分模型与当前 Kling 节点默认值一致
-- 2. 音频节点改为 OpenAI TTS 平台模型
-- 3. 迁移可重复执行，不因 provider+model 唯一约束失败

DELETE FROM model_pricing
WHERE
  (provider = 'kling' AND model_id IN ('kling-v2-0', 'kling-v1-6') AND id NOT IN ('mp-201', 'mp-202'))
  OR
  (provider = 'openai' AND model_id IN ('tts-1', 'tts-1-hd') AND id NOT IN ('mp-301', 'mp-302'));

INSERT OR IGNORE INTO model_pricing (id, provider, model_id, model_name, category, credits_per_call, tier, min_plan, is_active)
VALUES
  ('mp-201', 'kling', 'kling-v2-0', 'Kling V2.0', 'video', 15, 'premium', 'pro', 1),
  ('mp-202', 'kling', 'kling-v1-6', 'Kling V1.6', 'video', 10, 'standard', 'free', 1),
  ('mp-301', 'openai', 'tts-1', 'OpenAI TTS-1', 'audio', 5, 'basic', 'free', 1),
  ('mp-302', 'openai', 'tts-1-hd', 'OpenAI TTS-1 HD', 'audio', 12, 'premium', 'pro', 1);

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
WHERE id IN ('mp-203', 'mp-aud-1', 'mp-aud-2');

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
