"use client";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { getSyncStatus } from "@/services/actions/sync";
import relativeTime from "@/utils/relativeTime";
import InstallDialog from "@/components/SyncGuide/InstallDialog";
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
        <InstallDialog />
      </div>
    </Container>
  );
}
