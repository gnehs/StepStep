# 餅餅踏踏

基於 [Next.js](https://nextjs.org/) 的步步紀錄排行榜工具。

![](/public/cover.jpg)

## 開發

```bash
pnpm install
pnpm dlx prisma migrate deploy
pnpm dev
```

## 功能

- [x] 新增步步紀錄
  - [x] iOS Shortcut
  - [x] Android
- [x] 歷史紀錄
  - [x] 七天
  - [x] 一個月
- [x] 排行榜
  - [x] 七天
  - [x] 一個月
- [x] 獎章系統
- [x] PWA
- [x] 分析功能

## 部署

餅餅踏踏使用 SQLite 作為資料庫，因此需要將資料庫檔案掛載到容器中。

```bash
touch stepstep.db
docker run -d -p 3000:3000 \
  -v $(pwd)/stepstep.db:/app/prisma/dev.db \
  -e JWT_SECRET=YOUR_SECRET \
  -e INVITE_CODE=YOUR_INVITE_CODE \
  --name stepstep \
  ghcr.io/gnehs/stepstep
```

## API

### GET `/api/v1/rank?date=2024-06-10`

- 取得指定日期的排行榜。
- 日期格式為 `YYYY-MM-DD`。

```json
[
  {
    "steps": 5000,
    "distance": 5.123456789,
    "energy": 0,
    "user": {
      "id": "c123456",
      "name": "Test"
    }
  }
]
```
