# Google-SEOs.skill - Google SEO 诊断与实施 Skill
> L1 | 项目宪法·技能入口·知识库地图

<directory>
references/ - Google 官方 SEO 文档与落地手册（7 个子目录：01-fundamentals, 02-crawling-indexing, 03-ranking-appearance, 04-structured-data, 05-monitoring-debugging, 06-specialty, 07-patterns）
scripts/ - 知识库辅助脚本（搜索、整理、去重）
</directory>

<config>
SKILL.md - 技能触发入口、工作流、输出规范与引用策略
README.md - 人类读者导览与项目介绍
CLAUDE.md - 当前项目的架构镜像与维护约束
</config>

架构说明：
Skill 采用“精简入口 + 分层 references + 工具脚本”的结构。`SKILL.md` 只保留触发、路由、输出协议；官方材料留在 `references/01-05/`；从 `seo优化.txt` 整合出的可执行实战手册落在 `references/06-specialty/`；症状到原因的快速诊断模式落在 `references/07-patterns/`。

维护法则：
- 改 `SKILL.md` 时，确认引用路径与实际目录一致。
- 新增或移动 reference 文件时，同时更新对应目录的 `CLAUDE.md`。
- 调整脚本职责时，补充文件头部契约并检查本文件。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
