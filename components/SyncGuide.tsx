function Step({
  title,
  imgSrc,
  children,
}: {
  title: string;
  imgSrc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col w-[80%] bg-white shrink-0 p-2 rounded-lg snap-always snap-center">
      <img
        src={imgSrc}
        alt=""
        className="w-full aspect-square object-contain bg-gray-50 rounded"
      />
      <div className="mt-2">
        <h2 className="font-bold">{title}</h2>
        <div>{children}</div>
      </div>
    </div>
  );
}
export default function SyncGuide() {
  return (
    <div className="mt-1 overflow-x-scroll flex gap-2 flex-nowrap snap-x snap-mandatory">
      <Step title="0. 安裝捷徑" imgSrc="/sync-guide/install-shortcut.jpg">
        將餅餅踏踏記錄器安裝到您的 iPhone 或 iPad 上。
      </Step>
      <Step title="1. 設定 API 網址" imgSrc="/sync-guide/change-api-url.jpg">
        修改捷徑中的 API 網址，將其更改為此頁面上方的專屬同步網址。
      </Step>
      <Step title="2. 取得存取權限" imgSrc="/sync-guide/allow-access.jpg">
        將捷徑下方三個讀取健康樣本動作都設定為允許。
      </Step>
      <Step title="3. 選擇資料來源" imgSrc="/sync-guide/change-source.jpg">
        將捷徑下方三個讀取健康樣本的來源設定為您的手錶或手機名稱。
      </Step>
      <Step title="4. 允許大量資料存取" imgSrc="/sync-guide/allow-bulk.jpg">
        在設定＞捷徑＞進階＞啟用「允許分享大量資料」
      </Step>
      <Step title="5. 首次同步" imgSrc="/sync-guide/sync-allow.jpg">
        執行本捷徑開始你的首次同步，請選擇「永遠允許」 本捷徑分享你的健康樣本，
      </Step>
      <Step title="5. 首次同步" imgSrc="/sync-guide/sync-result.jpg">
        同步完成後，你會在最下方看到執行結果
      </Step>
      <Step title="6. 設定自動執行" imgSrc="/sync-guide/automation.jpg">
        我們建議建立不小於四次的每日自動執行，讓你的步步資料能夠即時同步到餅餅踏踏。
      </Step>
    </div>
  );
}
