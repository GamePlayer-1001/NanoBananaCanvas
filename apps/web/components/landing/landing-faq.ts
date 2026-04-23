/**
 * [INPUT]: 无外部依赖
 * [OUTPUT]: 对外提供 LANDING_FAQ_ITEMS 首页 FAQ key 清单
 * [POS]: landing 的 FAQ 数据契约，被首页 JSON-LD 与可见 FAQ 手风琴共同消费
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

export const LANDING_FAQ_ITEMS = [
  {
    questionKey: 'faqQuestion1',
    answerKey: 'faqAnswer1',
  },
  {
    questionKey: 'faqQuestion2',
    answerKey: 'faqAnswer2',
  },
  {
    questionKey: 'faqQuestion3',
    answerKey: 'faqAnswer3',
  },
] as const
