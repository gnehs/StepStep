"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronRight, KeyRound } from "lucide-react";
import { useSyncExternalStore } from "react";
import Container from "@/components/Container";
import InstallDialog from "@/components/SyncGuide/InstallDialog";
import PageTitle from "@/components/PageTitle";

const RelativeTime = dynamic(() => import("@/components/RelativeTime"), {
  ssr: false,
});

export type SettingsUser = {
  id: string;
  email: string;
  name: string;
  lastSync: Date | null;
  syncToken: string;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      alert(`${label}已複製至剪貼簿`);
    } catch {
      alert(`無法複製${label}，請手動選取後複製`);
    }
  }

  return (
    <button
      type="button"
      className="shrink-0 font-normal text-blue-500 dark:text-blue-300"
      onClick={() => void copy()}
    >
      複製
    </button>
  );
}

const subscribeToOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export default function SettingsClient({ user }: { user: SettingsUser }) {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getOrigin,
    getServerOrigin,
  );

  const syncEndpoint = `${origin || ""}/api/v1/sync`;
  const legacySyncEndpoint = `${origin || ""}/api/v1/sync/${user.syncToken}`;

  return (
    <Container>
      <div className="flex items-center justify-between gap-2">
        <PageTitle>設定</PageTitle>
        <Link href="/settings/user">
          <motion.img
            src={`/api/v1/avatar/${user.id}`}
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
            {user.lastSync ? (
              <RelativeTime time={new Date(user.lastSync)} />
            ) : (
              "從未同步"
            )}
          </div>
        </div>
        <div className="dark:glass-effect rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-black/5">
          <div className="text-sm opacity-75">同步 API 網址（舊版相容）</div>
          <div className="flex items-center gap-2 font-semibold">
            <code className="min-w-0 flex-1 truncate">{legacySyncEndpoint}</code>
            <CopyButton value={legacySyncEndpoint} label="同步 API 網址" />
          </div>
          <p className="mt-1 text-xs font-normal opacity-65">
            既有捷徑可繼續使用；這個網址含有令牌，可能出現在 URL 記錄中。
          </p>
        </div>
        <div className="dark:glass-effect rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-black/5">
          <div className="text-sm opacity-75">新版同步 API 網址（建議）</div>
          <div className="flex items-center gap-2 font-semibold">
            <code className="min-w-0 flex-1 truncate">{syncEndpoint}</code>
            <CopyButton value={syncEndpoint} label="新版同步 API 網址" />
          </div>
        </div>
        <div className="dark:glass-effect rounded-lg bg-white px-3 py-2 shadow-sm dark:bg-black/5">
          <div className="text-sm opacity-75">同步令牌</div>
          <div className="flex items-center gap-2 font-semibold">
            <code className="min-w-0 flex-1 break-all">{user.syncToken}</code>
            <CopyButton value={user.syncToken} label="同步令牌" />
          </div>
          <p className="mt-1 text-xs font-normal opacity-65">
            令牌只會在目前頁面使用，不會寫入瀏覽器儲存空間；請勿貼到網址列或公開訊息。
          </p>
        </div>
        <InstallDialog
          syncEndpoint={syncEndpoint}
          legacySyncEndpoint={legacySyncEndpoint}
          syncToken={user.syncToken}
        />
      </div>
    </Container>
  );
}
