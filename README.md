# 餅餅踏踏

基於 [Next.js](https://nextjs.org/) 的步步紀錄排行榜工具。

![](/public/cover.jpg)

## 開發

```bash
pnpm install --frozen-lockfile --trust-lockfile --ignore-scripts
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
- [x] Passkey 登入與管理

## 部署

餅餅踏踏使用 Node.js 24 內建的 `node:sqlite`，首次使用時會自動建立資料表。舊版 Prisma SQLite 資料庫可直接沿用（日期欄位仍使用毫秒 Unix 時間戳）。開發環境預設資料庫位置為 `prisma/dev.db`；可用 `SQLITE_PATH` 指定絕對路徑，既有的 `DATABASE_URL=file:./dev.db` 也仍可使用。部署時請將資料庫檔案掛載到容器中，並在切換前備份。

```bash
touch stepstep.db
docker run -d -p 3000:3000 \
  -v $(pwd)/stepstep.db:/app/prisma/dev.db \
  -e JWT_SECRET=YOUR_SECRET \
  -e INVITE_CODE=YOUR_INVITE_CODE \
  --name stepstep \
  ghcr.io/gnehs/stepstep
```

### Passkey

先用密碼登入，在「設定 → Passkey」輸入目前密碼與方便辨識的名稱，即可使用裝置的指紋、臉部辨識或 PIN 新增 Passkey。之後可在登入頁選擇「使用 Passkey 登入」，不必輸入 Email。Passkey 子頁面可查看及移除已新增的 Passkey；移除網站上的紀錄後，也可自行從裝置的密碼管理器刪除對應項目。密碼登入仍可使用。

正式環境需設定公開網站的來源（通訊協定、網域及非預設連接埠，不含路徑）：

```bash
WEBAUTHN_ORIGIN=https://steps.example.com
```

Docker 部署時加入 `-e WEBAUTHN_ORIGIN=https://steps.example.com`。網站必須使用 HTTPS；本機開發預設為 `http://localhost:3000`，若使用其他連接埠，請明確設定 `WEBAUTHN_ORIGIN`。反向代理後方也應填寫使用者實際開啟的 HTTPS 來源。未設定時，正式環境會停用 Passkey 註冊與登入，密碼登入不受影響。

Passkey 綁定此來源的網域；更換網域後需重新新增。資料儲存在同一份 SQLite 資料庫的 `Passkey` 與 `PasskeyChallenge` 表，首次使用自動建立，不需執行 Prisma migration。伺服器只保存公鑰與驗證資訊，私鑰由裝置或密碼管理器保管。新增 Passkey 需再次確認目前密碼；每次驗證要求裝置驗證使用者，挑戰五分鐘後過期且只能使用一次。

執行 Passkey 整合測試（使用暫存 SQLite 與測試金鑰，不會存取開發資料庫）：

```bash
pnpm test:passkey
```

實作參考 [SimpleWebAuthn 官方文件](https://simplewebauthn.dev/docs/packages/server) 與 [Next.js Server Functions 安全指南](https://nextjs.org/docs/app/getting-started/mutating-data)。

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

### GET `/api/v1/analytics?token=<TOKEN>`

- 透過同步令牌取得分析資料。

```ts
interface ActivityData {
  success: boolean;
  data: {
    aggregate: {
      _sum: {
        distance: number;
        energy: number;
        steps: number;
      };
      _avg: {
        distance: number;
        energy: number;
        steps: number;
      };
    };
    last30dAggregate: {
      日: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      一: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      二: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      三: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      四: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      五: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
      六: {
        [hour: string]: { distance: number; energy: number; steps: number };
      };
    };
    last30dByDay: Array<
      | {
          distance: number;
          energy: number;
          steps: number;
          timestamp: string;
        }
      | { timestamp: string }
    >;
  };
}
```
