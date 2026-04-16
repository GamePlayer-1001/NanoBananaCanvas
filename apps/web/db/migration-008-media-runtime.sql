-- P8: 对齐生产环境媒体运行时模型目录
-- 目标:
-- 1. 视频平台模型与当前 Kling 节点默认值一致
-- 2. 音频节点改为 OpenAI TTS 平台模型
-- 3. 迁移可重复执行，不因 provider+model 唯一约束失败

DELETE FROM ai_models
WHERE
  (provider = 'kling' AND model_id IN ('kling-v2-0', 'kling-v1-6') AND id NOT IN ('mp-201', 'mp-202'))
  OR
  (provider = 'openai' AND model_id IN ('tts-1', 'tts-1-hd') AND id NOT IN ('mp-301', 'mp-302'));

INSERT OR IGNORE INTO ai_models (id, provider, model_id, model_name, category, tier, is_active)
VALUES
  ('mp-201', 'kling', 'kling-v2-0', 'Kling V2.0', 'video', 'premium', 1),
  ('mp-202', 'kling', 'kling-v1-6', 'Kling V1.6', 'video', 'standard', 1),
  ('mp-301', 'openai', 'tts-1', 'OpenAI TTS-1', 'audio', 'basic', 1),
  ('mp-302', 'openai', 'tts-1-hd', 'OpenAI TTS-1 HD', 'audio', 'premium', 1);

UPDATE ai_models
SET
  model_id = 'kling-v2-0',
  model_name = 'Kling V2.0',
  tier = 'premium',
  is_active = 1
WHERE id = 'mp-201';

UPDATE ai_models
SET
  model_id = 'kling-v1-6',
  model_name = 'Kling V1.6',
  tier = 'standard',
  is_active = 1
WHERE id = 'mp-202';

DELETE FROM ai_models
WHERE id IN ('mp-203', 'mp-aud-1', 'mp-aud-2');

UPDATE ai_models
SET
  provider = 'openai',
  model_id = 'tts-1',
  model_name = 'OpenAI TTS-1',
  tier = 'basic',
  is_active = 1
WHERE id = 'mp-301';

UPDATE ai_models
SET
  provider = 'openai',
  model_id = 'tts-1-hd',
  model_name = 'OpenAI TTS-1 HD',
  tier = 'premium',
  is_active = 1
WHERE id = 'mp-302';
