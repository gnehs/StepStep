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
      {userBadges === null ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-2">
          {userBadges.map((badge) => {
            const info = getBadgeById(badge.badgeId);
            if (!info) return null;
            return (
              <div
                key={badge.id}
                className="dark:glass-effect flex items-center gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800/50"
              >
                <div className="dark:glass-effect font-emoji flex size-12 items-center justify-center rounded bg-primary-50 text-center text-xl dark:bg-primary-900/50">
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
    </Container>
  );
}