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
    fetchSyncStatus();
  }, []);
  async function fetchSyncStatus() {
    if (!user) {
      let res = await getSyncStatus(token);
      if (res.success) setUser(res.user!);
    }
  }
  return (
    <Container>
      <div className="grid grid-cols-3 gap-2 py-2 items-center mb-3">
        <Link
          href={"/settings"}
          className="flex gap-2 items-center text-blue-500"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">個人檔案</div>
      </div>
      <div className="flex items-center justify-center flex-col mb-3">
        <motion.img
          src={`/api/v1/avatar?id=${user?.id}`}
          alt="avatar"
          layoutId="avatar"
          className="size-16 rounded-full bg-white shadow-sm mb-2"
        />
        <div className="font-semibold text-xl">{user?.name}</div>
        <div className="text-sm opacity-75">{user?.email}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          className="bg-white rounded-lg px-4 py-2 w-full text-blue-500 text-center"
          onClick={async () => {
            alert("請到 Gravatar 網站更改頭貼");
          }}
        >
          更改頭貼
        </button>
        <button
          className="bg-white rounded-lg px-4 py-2 w-full text-blue-500 text-center"
          onClick={async () => {
            const name = prompt("請輸入新的暱稱");
            if (name) {
              let updateNameResult = await updateName({ name, token });
              alert(updateNameResult ? "暱稱已更改" : "更改暱稱失敗");
            }
          }}
        >
          更改暱稱
        </button>
        <button
          className="bg-white rounded-lg px-4 py-2 w-full text-blue-500 text-center"
          onClick={() => setToken("")}
        >
          登出
        </button>{" "}
      </div>
    </Container>
  );
}
