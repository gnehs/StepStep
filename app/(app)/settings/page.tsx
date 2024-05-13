"use client";
import Container from "@/components/Container";
import Input from "@/components/Input";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import SyncGuide from "@/components/SyncGuide";
import { getSyncStatus } from "@/services/actions/sync";
import { updateName } from "@/services/actions/user";
import StatItem from "@/components/StatItem";
import { User, CloudUpload } from "lucide-react";
export default function Settings() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    password: string;
    name: string;
    token: string;
    lastSync: Date | null;
    lastLogin: Date | null;
  } | null>(null);
  const [lastsync, setLastsync] = useLocalStorage<Date | null | undefined>(
    "lastsync",
    null
  );
  const [syncToken, setSyncToken] = useLocalStorage("syncToken", "");
  const [token, setToken] = useLocalStorage("token", "");
  useEffect(() => {
    fetchSyncStatus();
  }, []);
  async function fetchSyncStatus() {
    let res = await getSyncStatus(token);
    if (res.success) {
      setSyncToken(location.origin + "/api/v1/sync/" + res.user!.token);
      setLastsync(res.lastSync);
      setUser(res.user!);
    }
  }
  const lastsyncStatus = user?.lastSync
    ? new Date(user?.lastSync).toLocaleString("zh-TW")
    : "從未同步";
  return (
    <Container>
      <PageTitle>設定</PageTitle>
      <div className="rounded-lg p-4 bg-white flex gap-4 my-2 items-center shadow-sm">
        <img
          src={`/api/v1/avatar?id=${user?.id}`}
          alt="avatar"
          className="size-12 rounded-full"
        />
        <div className="grow">
          <div className="font-semibold">{user?.name}</div>
          <div className="text-sm opacity-75">{user?.email}</div>
        </div>
        <div>
          <button
            className="px-2 w-full text-blue-500 text-center text-sm"
            onClick={() => setToken("")}
          >
            登出
          </button>
        </div>
      </div>
      <StatItem title="上次同步" value={lastsyncStatus} Icon={CloudUpload} />

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
    </Container>
  );
}
