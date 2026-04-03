# api/files/
> L2 | 父级: apps/web/app/api/CLAUDE.md

文件上传与读取 API

## 成员清单

```
upload/route.ts         — POST 上传文件到 R2 (类型/大小/配额校验)
[...key]/route.ts       — GET 读取 R2 文件 (thumbnails 公开，uploads/outputs 按用户隔离)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
