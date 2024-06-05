"use client";
import Container from "@/components/Container";
import { usePathname } from "next/navigation";
import { Cog, User, Cookie, BarChart2 } from "lucide-react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
function NavButton({
  children,
  href,
  Icon,
}: {
  children: React.ReactNode;
  href: string;
  Icon: LucideIcon;
}) {
  const active = usePathname() === href;
  return (
    <Link
      className={twMerge(
        "flex flex-col items-center gap-1 p-2 text-xs",
        active
          ? "text-primary-500 dark:text-primary-400 font-bold"
          : "text-primary-500 hover:text-primary-700 dark:hover:text-primary-300 dark:text-[#7F7F7F]",
      )}
      href={href}
    >
      <Icon size={28} strokeWidth={active ? 2 : 1.5} />
      {children}
    </Link>
  );
}
export default function Nav() {
  return (
    <div className="dark:bg-primary-900 fixed bottom-0 z-10 w-full bg-white pb-[env(safe-area-inset-bottom)] drop-shadow-2xl">
      <Container>
        <div className="flex w-full justify-around gap-2">
          <NavButton href="/" Icon={Cookie}>
            首頁
          </NavButton>
          {/* <NavButton href="/me" Icon={User}>
            我的
          </NavButton> */}
          <NavButton href="/rank" Icon={BarChart2}>
            排行榜
          </NavButton>
          <NavButton href="/settings" Icon={Cog}>
            設定
          </NavButton>
        </div>
      </Container>
    </div>
  );
}
