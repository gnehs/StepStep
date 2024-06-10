"use client";
import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Badge } from "@prisma/client";
import { getBadgeData } from "@/services/actions/badge";
import BadgesData from "@/data/badges";
import Container from "@/components/Container";
import Loader from "@/components/Loader";
export default function Page() {
  const [token] = useLocalStorage("token", "");
  const [userBadges, setUserBadges] = useState<null | Badge[]>(null);
  function getBadgeById(id: string) {
    return BadgesData.find((badge) => badge.id === id);
  }
  useEffect(() => {
    if (token === "") return;
    async function fetchData() {
      const data = await getBadgeData(token);
      setUserBadges(data);
    }
    fetchData();
  }, [token]);

  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/"
          className="flex items-center gap-1 text-blue-500 dark:text-blue-300"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <div className="text-center font-semibold">獎章</div>
      </div>
      {userBadges === null && <Loader />}
      {userBadges?.length > 0 && (
        <div className="flex flex-col gap-2">
          {userBadges.map((badge) => {
            const info = getBadgeById(badge.badgeId);
            if (!info) return null;
            return (
              <div
                key={badge.id}
                className="dark:glass-effect flex items-center gap-2 rounded-full bg-white p-3 shadow-sm dark:bg-gray-800/50"
              >
                <div className="dark:glass-effect flex size-12 items-center justify-center rounded-full bg-primary-50 text-center font-emoji text-2xl text-primary-600 dark:bg-primary-900/50 dark:text-white">
                  {info.icon}
                </div>
                <div>
                  <div className="font-bold">{info.name}</div>
                  <div className="text-sm opacity-75">{info.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {userBadges?.length === 0 && (
        <div className="my-10 text-center text-gray-500 dark:text-gray-400">
          你還沒有任何獎章喔
        </div>
      )}
    </Container>
  );
}
