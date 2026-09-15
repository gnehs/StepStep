"use client";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { getSyncStatus } from "@/services/actions/sync";
import InstallDialog from "@/components/SyncGuide/InstallDialog";
import { ChevronRight, KeyRound } from "lucide-react";

import dynamic from "next/dynamic";
const RelativeTime = dynamic(() => import("@/components/RelativeTime"), {
  ssr: false,
});
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
    async function fetchSyncStatus() {
      let res = await getSyncStatus(token);
      if (res.success) {
        setSyncToken(location.origin + "/api/v1/sync/" + res.user!.token);
        setUser(res.user!);
      }
    }
    fetchSyncStatus();
  }, []);
  return (
    <Container>
      <div className="flex items-center justify-between gap-2">
        <PageTitle>設定</PageTitle>
        <Link href="/settings/user">
          <motion.img
            src={`/api/v1/avatar/${user?.id}`}
            alt="avatar"
            layoutId="avatar"
            className="size-10 rounded-full bg-white shadow-sm"
          />
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/settings/passkeys"
          className="dark:glass-effect flex items-center gap-3 rounded-lg bg-white px-3 py-3 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-black/5 dark:hover:bg-white/5"
        >
          <KeyRound size={20} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Passkey</div>
            <div className="text-sm opacity-75">管理免密碼登入方式</div>
          </div>
          <ChevronRight size={20} aria-hidden="true" />
        </Link>
        <div className="dark:glass-effect rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-black/5">
          <div className="text-sm opacity-75">上次同步</div>
          <div className="font-semibold">
            {user ? (
              user?.lastSync ? (
                <RelativeTime time={new Date(user?.lastSync)} />
              ) : (
                "從未同步"
              )
            ) : (
              "讀取中⋯⋯"
            )}
          </div>
        </div>
        <div className="dark:glass-effect rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-black/5">
          <div className="text-sm opacity-75">同步 API 網址</div>
          <div className="flex gap-2 font-semibold">
            <span className="truncate">{syncToken}</span>
            <button
              className="shrink-0 font-normal text-blue-500 dark:text-blue-300"
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
