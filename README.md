# 餅餅踏踏

基於 [Next.js](https://nextjs.org/) 的步步紀錄排行榜工具。

```bash
pnpm install
pnpm dlx prisma migrate deploy
pnpm dev
```

## 功能

- [ ] 新增步步紀錄
  - [x] iOS Shortcut
  - [ ] Android
- [ ] 歷史紀錄
  - [x] 七天
  - [ ] 一個月
- [ ] 排行榜
  - [x] 七天
  - [ ] 一個月
- [ ] 徽章系統

## 部署

餅餅踏踏使用 SQLite 作為資料庫，因此需要將資料庫檔案掛載到容器中。

```bash
touch stepstep.db
docker run -d -p 3000:3000 -v $(pwd)/stepstep.db:/app/prisma/dev.db --name stepstep ghcr.io/gnehs/stepstep
```
