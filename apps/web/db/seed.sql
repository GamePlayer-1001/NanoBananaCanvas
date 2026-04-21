-- ============================================
--  Nano Banana Canvas — Seed Data
--  分类种子数据 (i18n JSON + 历史双语兼容列)
-- ============================================

INSERT OR IGNORE INTO categories (id, slug, name_i18n, name_en, name_zh, icon, sort_order) VALUES
  ('cat_text',     'text-generation',  '{"en":"Text Generation","zh":"文本生成"}',  'Text Generation',  '文本生成',  'type',            1),
  ('cat_image',    'image-generation', '{"en":"Image Generation","zh":"图片生成"}', 'Image Generation', '图片生成',  'image',           2),
  ('cat_video',    'video-generation', '{"en":"Video Generation","zh":"视频生成"}', 'Video Generation', '视频生成',  'video',           3),
  ('cat_audio',    'audio-generation', '{"en":"Audio Generation","zh":"音频生成"}', 'Audio Generation', '音频生成',  'music',           4),
  ('cat_data',     'data-processing',  '{"en":"Data Processing","zh":"数据处理"}',  'Data Processing',  '数据处理',  'database',        5),
  ('cat_auto',     'automation',       '{"en":"Automation","zh":"自动化"}',         'Automation',       '自动化',    'zap',             6),
  ('cat_creative', 'creative',         '{"en":"Creative","zh":"创意设计"}',         'Creative',         '创意设计',  'palette',         7),
  ('cat_other',    'other',            '{"en":"Other","zh":"其他"}',                'Other',            '其他',      'more-horizontal', 8);
