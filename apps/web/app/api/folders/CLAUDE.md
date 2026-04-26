# api/folders/
> L2 | 父级: apps/web/app/api/CLAUDE.md

工作区文件夹 CRUD API — 项目分组管理

## 成员清单

```
route.ts        — GET (当前用户文件夹列表，含项目数) / POST (创建文件夹)
[id]/route.ts   — PUT (重命名) / DELETE (删除，子项目 folder_id 自动置 NULL)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
