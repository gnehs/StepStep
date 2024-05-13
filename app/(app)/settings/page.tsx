"use client";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import SectionTitle from "@/components/SectionTitle";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import SyncGuide from "@/components/SyncGuide";
import { getSyncStatus } from "@/services/actions/sync";
import StatItem from "@/components/StatItem";
import { CloudUpload } from "lucide-react";
import relativeTime from "@/utils/relativeTime";
export default function Settings() {
  const [user, setUser] = useLocalStorage<{
    id: string;
    email: string;
    password: string;
    name: string;
    token: string;
    lastSync: Date | null;
    lastLogin: Date | null;
  } | null>("user", null);
  const [syncToken, setSyncToken] = useLocalStorage("syncToken", "");
  const [token] = useLocalStorage("token", "");
  useEffect(() => {
    fetchSyncStatus();
  }, []);
  async function fetchSyncStatus() {
    let res = await getSyncStatus(token);
    if (res.success) {
      setSyncToken(location.origin + "/api/v1/sync/" + res.user!.token);
      setUser(res.user!);
    }
  }
  const lastsyncStatus = user
    ? user?.lastSync
      ? relativeTime(new Date(user?.lastSync))
      : "從未同步"
    : "讀取中⋯⋯";
  return (
    <Container>
      <div className="flex justify-between items-center gap-2">
        <PageTitle>設定</PageTitle>
        <Link href="/settings/user">
          <motion.img
            src={`/api/v1/avatar?id=${user?.id}`}
            alt="avatar"
            layoutId="avatar"
            className="size-10 rounded-full bg-white shadow-sm"
          />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <div className="bg-white rounded-lg py-2 px-3 shadow-sm">
          <div className="opacity-75 text-sm">上次同步</div>
          <div className="font-semibold">{lastsyncStatus}</div>
        </div>
        <div className="bg-white rounded-lg py-2 px-3 shadow-sm">
          <div className="opacity-75 text-sm">同步 API 網址</div>
          <div className="font-semibold flex gap-2">
            <span className="truncate">{syncToken}</span>
            <button
              className="shrink-0 text-blue-500"
              onClick={async () => {
                await navigator.clipboard.writeText(syncToken);
                alert("已複製至剪貼簿");
              }}
            >
              複製
            </button>
          </div>
        </div>
        <a
          href="https://www.icloud.com/shortcuts/93567aa7d9ef411099f9c794ec2ed3e1"
          target="_blank"
          className="block text-blue-500 bg-white p-2 rounded-lg text-center shadow-sm font-semibold"
        >
          安裝同步 iOS 捷徑
        </a>
      </div>
      <SectionTitle className="mt-2">如何設定同步捷徑？</SectionTitle>
      <SyncGuide />
    </Container>
  );
}
