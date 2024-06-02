"use client";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";
import { getSyncStatus } from "@/services/actions/sync";
import { updateName } from "@/services/actions/user";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
export default function SettingsUser() {
  const [user, setUser] = useLocalStorage<{
    id: string;
    email: string;
    password: string;
    name: string;
    token: string;
    lastSync: Date | null;
    lastLogin: Date | null;
  } | null>("user", null);
  const [token, setToken] = useLocalStorage("token", "");
  useEffect(() => {
    fetchData();
  }, []);
  async function fetchData(force = false) {
    if (!user || force) {
      let res = await getSyncStatus(token);
      if (res.success) setUser(res.user!);
    }
  }
  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href={"/settings"}
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">個人檔案</div>
      </div>
      <div className="mb-3 flex flex-col items-center justify-center">
        <motion.img
          src={`/api/v1/avatar?id=${user?.id}`}
          alt="avatar"
          layoutId="avatar"
          className="mb-2 size-16 rounded-full bg-white shadow-sm"
        />
        <div className="text-xl font-semibold">{user?.name}</div>
        <div className="text-sm opacity-75">{user?.email}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
          onClick={async () => {
            if (confirm("將把您引導至 Gravatar 網站更改頭貼"))
              open("https://gravatar.com/profile/", "_blank")?.focus();
          }}
        >
          更改頭貼
        </button>
        <button
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
          onClick={async () => {
            const name = prompt("請輸入新的暱稱");
            if (name) {
              let updateNameResult = await updateName({ name, token });
              if (updateNameResult) setUser(updateNameResult);
              else alert("更改暱稱失敗");
            }
          }}
        >
          更改暱稱
        </button>
        <button
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
          onClick={() => setToken("")}
        >
          登出
        </button>
      </div>
    </Container>
  );
}
