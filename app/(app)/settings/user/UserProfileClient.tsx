"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateName } from "@/services/actions/user";
import { logout } from "@/services/actions/auth";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import Container from "@/components/Container";

type ProfileUser = {
  id: string;
  email: string;
  name: string;
};

export default function UserProfileClient({
  initialUser,
}: {
  initialUser: ProfileUser;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const reduceMotion = useReducedMotion();

  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/settings"
          aria-label="返回設定"
          className="pressable flex min-h-11 items-center gap-1 rounded-xl px-2 text-primary-700 dark:text-primary-200"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <h1 className="text-center font-semibold tracking-tight">個人檔案</h1>
      </div>
      <div className="surface-card mb-5 flex flex-col items-center justify-center p-6">
        <motion.img
          src={`/api/v1/avatar/${user.id}`}
          alt={`${user.name} 的頭像`}
          layoutId={reduceMotion ? undefined : "avatar"}
          className="mb-2 size-16 rounded-full bg-white shadow-sm"
        />
        <div className="text-xl font-semibold">{user.name}</div>
        <div className="text-sm opacity-75">{user.email}</div>
      </div>
      <div className="flex flex-col gap-3 pb-8">
        <button
          type="button"
          className="surface-card pressable min-h-12 w-full px-4 py-3 text-center font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50/70 dark:text-primary-200 dark:hover:border-primary-600 dark:hover:bg-primary-800/60"
          onClick={() => {
            if (window.confirm("將把您引導至 Gravatar 網站更改頭貼")) {
              window.open("https://gravatar.com/profile/", "_blank")?.focus();
            }
          }}
        >
          更改頭貼
        </button>
        <button
          type="button"
          className="surface-card pressable min-h-12 w-full px-4 py-3 text-center font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50/70 dark:text-primary-200 dark:hover:border-primary-600 dark:hover:bg-primary-800/60"
          onClick={async () => {
            const name = window.prompt("請輸入新的暱稱")?.trim();
            if (!name) return;

            const updateNameResult = await updateName({ name });
            if (updateNameResult) {
              setUser({
                id: updateNameResult.id,
                email: updateNameResult.email,
                name: updateNameResult.name,
              });
            } else {
              window.alert("更改暱稱失敗");
            }
          }}
        >
          更改暱稱
        </button>
        <button
          type="button"
          className="surface-card pressable min-h-12 w-full px-4 py-3 text-center font-semibold text-primary-700 hover:border-primary-300 hover:bg-primary-50/70 dark:text-primary-200 dark:hover:border-primary-600 dark:hover:bg-primary-800/60"
          onClick={async () => {
            await logout();
            router.replace("/login");
            router.refresh();
          }}
        >
          登出
        </button>
      </div>
    </Container>
  );
}
