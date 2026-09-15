"use client";

import { motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
      aria-label={`複製${label}`}
      className="ios-link pressable min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold"
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
  const reduceMotion = useReducedMotion();
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    getOrigin,
    getServerOrigin,
  );

  const syncEndpoint = `${origin || ""}/api/v1/sync`;
  const legacySyncEndpoint = `${origin || ""}/api/v1/sync/${user.syncToken}`;

  return (
    <Container>
      <PageTitle>設定</PageTitle>
      <div className="flex flex-col gap-6 pb-8">
        <div className="ios-group overflow-hidden">
          <Link
            href="/settings/user"
            aria-label={`${user.name} 的個人檔案`}
            className="ios-row pressable flex items-center gap-3"
          >
            <motion.img
              src={`/api/v1/avatar/${user.id}`}
              alt={`${user.name} 的頭像`}
              layoutId={reduceMotion ? undefined : "avatar"}
              className="size-10 shrink-0 rounded-full bg-white"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{user.name}</span>
              <span className="ios-secondary mt-0.5 block truncate text-sm">
                {user.email}
              </span>
            </span>
            <ChevronRight
              size={20}
              aria-hidden="true"
              className="ios-secondary shrink-0"
            />
          </Link>
          <Link
            href="/settings/passkeys"
            className="ios-row pressable flex items-center gap-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Passkey</span>
              <span className="ios-secondary mt-0.5 block text-sm">
                管理免密碼登入方式
              </span>
            </span>
            <ChevronRight
              size={20}
              aria-hidden="true"
              className="ios-secondary shrink-0"
            />
          </Link>
        </div>

        <div className="ios-group overflow-hidden">
          <div className="ios-row flex items-center justify-between gap-3">
            <span className="flex-1">上次同步</span>
            <span className="ios-secondary text-right">
              {user.lastSync ? (
                <RelativeTime time={new Date(user.lastSync)} />
              ) : (
                "從未同步"
              )}
            </span>
          </div>
          <div className="ios-row ios-link p-0 [&>button]:min-h-11! [&>button]:rounded-none! [&>button]:border-0! [&>button]:bg-transparent! [&>button]:p-4! [&>button]:text-left! [&>button]:text-[var(--ios-tint)]! [&>button]:shadow-none!">
            <InstallDialog
              syncEndpoint={syncEndpoint}
              legacySyncEndpoint={legacySyncEndpoint}
              syncToken={user.syncToken}
            />
          </div>
        </div>

        <details className="ios-group group overflow-hidden">
          <summary className="ios-row pressable flex cursor-pointer list-none items-center gap-3">
            <span className="flex-1 font-semibold">進階同步設定</span>
            <span className="ios-secondary mr-2 text-sm">API 與令牌</span>
            <ChevronRight
              size={20}
              aria-hidden="true"
              className="ios-secondary shrink-0 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none"
            />
          </summary>
          <div className="ios-row flex flex-col items-stretch gap-2">
            <div className="ios-secondary text-sm">
              同步 API 網址（舊版相容）
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <code className="min-w-0 flex-1 truncate font-mono text-sm">
                {legacySyncEndpoint}
              </code>
              <CopyButton value={legacySyncEndpoint} label="同步 API 網址" />
            </div>
            <p className="ios-secondary text-xs">
              既有捷徑可繼續使用；這個網址含有令牌，可能出現在 URL 記錄中。
            </p>
          </div>
          <div className="ios-row flex flex-col items-stretch gap-2">
            <div className="ios-secondary text-sm">
              新版同步 API 網址（建議）
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <code className="min-w-0 flex-1 truncate font-mono text-sm">
                {syncEndpoint}
              </code>
              <CopyButton value={syncEndpoint} label="新版同步 API 網址" />
            </div>
          </div>
          <div className="ios-row flex flex-col items-stretch gap-2">
            <div className="ios-secondary text-sm">同步令牌</div>
            <div className="flex items-start gap-2 font-semibold">
              <code className="min-w-0 flex-1 font-mono text-sm break-all">
                {user.syncToken}
              </code>
              <CopyButton value={user.syncToken} label="同步令牌" />
            </div>
            <p className="ios-secondary text-xs">
              令牌只會在目前頁面使用，不會寫入瀏覽器儲存空間；請勿貼到網址列或公開訊息。
            </p>
          </div>
        </details>
      </div>
    </Container>
  );
}
