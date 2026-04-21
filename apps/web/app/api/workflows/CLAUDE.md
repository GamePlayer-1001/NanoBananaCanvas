# api/workflows/
> L2 | 父级: apps/web/app/api/CLAUDE.md

工作流 CRUD + 发布 + 社交互动 API

## 成员清单

```
route.ts                  — GET (列表) / POST (创建/导入本地草稿) 当前用户的工作流
favorites/route.ts        — GET 当前用户收藏的工作流列表

[id]/route.ts             — GET / PUT / DELETE 单个工作流详情+更新+删除
[id]/publish/route.ts     — POST 发布 / DELETE 取消发布
[id]/clone/route.ts       — POST 克隆公开工作流到自己的工作区
[id]/like/route.ts        — POST toggle 点赞 (幂等切换)
[id]/favorite/route.ts    — POST toggle 收藏 (幂等切换)
[id]/report/route.ts      — POST 提交举报 (reason + description)
[id]/thumbnail/route.ts   — PUT 上传画布截图缩略图 (FormData → R2 thumbnails/{id}.webp)
[id]/history/route.ts     — GET 执行历史列表 / POST 记录执行结果
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
