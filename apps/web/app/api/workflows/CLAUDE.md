# api/workflows/
> L2 | 父级: apps/web/app/api/CLAUDE.md

工作流 CRUD + 发布 + 收藏 API

## 成员清单

```
route.ts            — GET (列表) / POST (创建) 当前用户的工作流
[id]/route.ts       — GET / PUT / DELETE 单个工作流 + 发布/取消发布
favorites/route.ts  — GET 当前用户收藏的工作流列表
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
