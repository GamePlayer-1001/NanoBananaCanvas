-- EXPLORE-006: add use-case categories for imported image libraries
INSERT OR IGNORE INTO categories (id, slug, name_i18n, name_en, name_zh, icon, sort_order) VALUES
  ('cat_design', 'design', '{"en":"Design","zh":"设计"}', 'Design', '设计', 'pen-tool', 21),
  ('cat_photography', 'photography', '{"en":"Photography","zh":"摄影"}', 'Photography', '摄影', 'camera', 22),
  ('cat_concept_art', 'concept-art', '{"en":"Concept Art","zh":"概念艺术"}', 'Concept Art', '概念艺术', 'brush', 23),
  ('cat_ui_ux', 'ui-ux', '{"en":"UI / UX","zh":"UI / UX"}', 'UI / UX', 'UI / UX', 'layout-template', 24),
  ('cat_illustration', 'illustration', '{"en":"Illustration","zh":"插画"}', 'Illustration', '插画', 'image', 25),
  ('cat_marketing', 'marketing', '{"en":"Marketing","zh":"营销"}', 'Marketing', '营销', 'megaphone', 26),
  ('cat_product', 'product', '{"en":"Product","zh":"产品"}', 'Product', '产品', 'package', 27);
