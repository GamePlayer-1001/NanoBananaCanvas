# Google SEO Expert Skill

基于 Google Search Central 文档与实战落地手册整理的 SEO 诊断 Skill。它既能回答“为什么会出问题”，也能把答案继续展开成“该怎么落地、按什么顺序做、怎么验证”的执行方案。

## 当前结构

```text
Google-SEOs.skill/
├── SKILL.md
├── CLAUDE.md
├── README.md
├── references/
│   ├── 01-fundamentals/
│   ├── 02-crawling-indexing/
│   ├── 03-ranking-appearance/
│   ├── 04-structured-data/
│   ├── 05-monitoring-debugging/
│   ├── 06-specialty/
│   │   ├── implementation-playbook.md
│   │   ├── multilingual-seo-playbook.md
│   │   ├── geo-seo-playbook.md
│   │   ├── keyword-optimization-playbook.md
│   │   └── content-growth-playbook.md
│   └── 07-patterns/
└── scripts/
    ├── search_kb.py
    ├── organize_files.py
    └── deduplicate_specialty.py
```

## 适合解决的问题

- 网站不收录、抓取异常、robots / sitemap / canonical 配置问题
- 页面标题、摘要、图片、视频、富结果等搜索呈现问题
- 结构化数据设计、落地和验证
- 搜索流量下滑、关键词波动、SEO 体检
- 多语言网站的 `hreflang`、语言路由和区域化问题
- geo targeting、城市页、区域页、服务地区 SEO 设计
- 页面关键词布局、关键词蚕食治理和关键词刷新优化
- SEO 增长方案、内容计划、月度复盘

## 如何使用

直接把问题交给 Skill，例如：

```text
请帮我诊断网站为什么没有被 Google 收录
给我一个 SaaS 官网的技术 SEO 上线清单
Product 结构化数据怎么做，顺便给验证步骤
帮我设计一套中英文站点的 hreflang 方案
帮我设计城市页 / 区域页的 geo SEO 方案
帮我判断这些页面有没有关键词蚕食
给我一个 90 天 SEO 增长计划
```

## 设计原则

- 主入口 `SKILL.md` 只负责触发、路由和输出协议，不塞超长细节。
- `references/01-05/` 保留 Google 官方知识。
- `references/06-specialty/` 承载从 `seo优化.txt` 沉淀出的实战实施手册。
- `references/07-patterns/` 用于快速问题定位和模式复用。
- geo SEO 和关键词优化被拆成独立手册，避免和国际化、多语言、增长策略混写。

## 核心价值

- 所有建议优先绑定 Google 官方依据
- 复杂问题可直接展开为实施清单与优先级
- 多语言、geo SEO、关键词优化、增长运营和技术落地都有专项手册可用

## 免责声明

本 Skill 以 Google 官方文档为主，辅以工程实践整理。排名结果受行业竞争、内容质量、站点历史与算法变化共同影响，不承诺具体排名结果。
