# api/files/
> L2 | 父级: apps/web/app/api/CLAUDE.md

文件上传与读取 API

## 成员清单

```
upload/route.ts         — POST 上传文件到 R2 (图片/视频/工作流类型 + 大小校验；返回值优先输出公开资产域名 URL，未配置时回退 /api/files)
[...key]/route.ts       — GET 读取 R2 文件 (thumbnails 公开；被公开 Explore 作品引用的 media/thumbnail 可匿名读取并做短 TTL 白名单缓存；其余 uploads/outputs 按用户隔离)
```

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
