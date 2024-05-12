"use client";
import Container from "@/components/Container";
import Input from "@/components/Input";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import SyncGuide from "@/components/SyncGuide";
import { getSyncStatus } from "@/services/actions/sync";
export default function Settings() {
  const [lastsync, setLastsync] = useLocalStorage<Date | null | undefined>(
    "lastsync",
    null
  );
  const [syncToken, setSyncToken] = useLocalStorage("syncToken", "");
  const [token, setToken] = useLocalStorage("token", "");
  const lastSyncIsWhinAnHour =
    lastsync &&
    new Date().getTime() - new Date(lastsync).getTime() < 60 * 60 * 1000 * 24;
  const lastsyncStatus = lastsync
    ? lastSyncIsWhinAnHour
      ? "已同步至最新"
      : "最後同步時間：" + new Date(lastsync).toDateString()
    : "從未同步";
  useEffect(() => {
    fetchSyncStatus();
  }, []);
  async function fetchSyncStatus() {
    let res = await getSyncStatus(token);
    if (res.success) {
      setSyncToken(location.origin + "/api/v1/sync/" + res.user!.token);
      setLastsync(res.lastSync);
    }
  }
  return (
    <Container>
      <PageTitle>設定</PageTitle>
      <SectionTitle>同步狀態</SectionTitle>
      <p>{lastsyncStatus}</p>
      <SectionTitle className="mt-2">同步 API 網址</SectionTitle>
      <button
        className="border-2 border-transparent bg-white rounded-lg px-4 py-2 w-full outline-none focus:border-blue-500 truncate"
        onClick={async () => {
          await navigator.clipboard.writeText(syncToken);
          alert("已複製至剪貼簿");
        }}
      >
        {syncToken}
      </button>
      <a
        href="https://www.icloud.com/shortcuts/93567aa7d9ef411099f9c794ec2ed3e1"
        target="_blank"
        className="block mt-2 text-blue-500 bg-white p-2 rounded-lg text-center"
      >
        安裝同步 iOS 捷徑
      </a>
      <SectionTitle className="mt-2">如何設定同步捷徑？</SectionTitle>
      <SyncGuide />
      <SectionTitle className="mt-2">帳號管理</SectionTitle>
      <button
        className="border-2 border-transparent bg-white rounded-lg px-4 py-2 w-full text-blue-500 text-center mt-1"
        onClick={() => {
          setToken("");
        }}
      >
        登出
      </button>
    </Container>
  );
}
