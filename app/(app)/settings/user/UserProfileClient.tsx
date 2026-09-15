"use client";

import { motion } from "framer-motion";
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

  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">個人檔案</div>
      </div>
      <div className="mb-3 flex flex-col items-center justify-center">
        <motion.img
          src={`/api/v1/avatar/${user.id}`}
          alt="avatar"
          layoutId="avatar"
          className="mb-2 size-16 rounded-full bg-white shadow-sm"
        />
        <div className="text-xl font-semibold">{user.name}</div>
        <div className="text-sm opacity-75">{user.email}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
          onClick={() => {
            if (window.confirm("將把您引導至 Gravatar 網站更改頭貼")) {
              window.open("https://gravatar.com/profile/", "_blank")?.focus();
            }
          }}
        >
          更改頭貼
        </button>
        <button
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
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
          className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
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
