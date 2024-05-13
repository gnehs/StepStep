"use client";
import Container from "@/components/Container";
import Input from "@/components/Input";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import SyncGuide from "@/components/SyncGuide";
import { getSyncStatus } from "@/services/actions/sync";
import { updateName } from "@/services/actions/user";
export default function Settings() {
  const [lastsync, setLastsync] = useLocalStorage<Date | null | undefined>(
    "lastsync",
    null
  );
  const [syncToken, setSyncToken] = useLocalStorage("syncToken", "");
  const [token, setToken] = useLocalStorage("token", "");
  const lastsyncStatus = lastsync
    ? new Date(lastsync).toLocaleString("zh-TW")
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
      <SectionTitle>上次同步</SectionTitle>
      <p>{lastsyncStatus}</p>
      <SectionTitle className="mt-2">同步 API 網址</SectionTitle>
      <button
        className="border-2 border-transparent bg-white rounded-lg px-4 py-2 w-full outline-none focus:border-blue-500  mt-1 flex justify-between items-center gap-2"
        onClick={async () => {
          await navigator.clipboard.writeText(syncToken);
          alert("已複製至剪貼簿");
        }}
      >
        <span className="truncate">{syncToken}</span>
        <span className="shrink-0 text-blue-500">複製</span>
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
        onClick={async () => {
          const name = prompt("請輸入新的暱稱");
          if (name) {
            let res = await updateName({ name, token });
            if (res) {
              alert("暱稱已更改");
            } else {
              alert("更改暱稱失敗");
            }
          }
        }}
      >
        更改暱稱
      </button>
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
