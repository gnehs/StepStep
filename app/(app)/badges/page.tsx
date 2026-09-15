import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getBadgeData } from "@/services/actions/badge";
import BadgesData from "@/data/badges";
import Container from "@/components/Container";
import { getCurrentUser } from "@/services/session";
import { redirect } from "next/navigation";

function getBadgeById(id: string) {
  return BadgesData.find((badge) => badge.id === id);
}

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userBadges = await getBadgeData();

  return (
    <Container>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 py-2">
        <Link
          href="/"
          aria-label="返回首頁"
          className="pressable flex min-h-11 items-center gap-1 rounded-xl px-2 text-primary-700 dark:text-primary-200"
        >
          <ChevronLeft size={24} />
          返回
        </Link>
        <h1 className="text-center font-semibold tracking-tight">獎章</h1>
      </div>
      {userBadges.length > 0 && (
        <div className="flex flex-col gap-3 pb-8">
          {userBadges.map((badge) => {
            const info = getBadgeById(badge.badgeId);
            if (!info) return null;
            return (
              <div
                key={badge.id}
                className="surface-card flex items-center gap-4 p-4"
              >
                <div
                  aria-hidden="true"
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-50 text-center font-emoji text-2xl text-primary-600 dark:bg-primary-800 dark:text-white"
                >
                  {info.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight">{info.name}</h2>
                  <p className="mt-1 text-sm leading-6 opacity-75">
                    {info.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {userBadges?.length === 0 && (
        <div className="surface-card my-10 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          你還沒有任何獎章喔
        </div>
      )}
    </Container>
  );
}
