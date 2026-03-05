-- ============================================
--  Nano Banana Canvas — Seed Data
--  分类种子数据 (i18n 双语)
-- ============================================

INSERT OR IGNORE INTO categories (id, slug, name_en, name_zh, icon, sort_order) VALUES
  ('cat_text',     'text-generation',  'Text Generation',  '文本生成',  'type',            1),
  ('cat_image',    'image-generation', 'Image Generation', '图片生成',  'image',           2),
  ('cat_video',    'video-generation', 'Video Generation', '视频生成',  'video',           3),
  ('cat_audio',    'audio-generation', 'Audio Generation', '音频生成',  'music',           4),
  ('cat_data',     'data-processing',  'Data Processing',  '数据处理',  'database',        5),
  ('cat_auto',     'automation',       'Automation',       '自动化',    'zap',             6),
  ('cat_creative', 'creative',         'Creative',         '创意设计',  'palette',         7),
  ('cat_other',    'other',            'Other',            '其他',      'more-horizontal', 8);
