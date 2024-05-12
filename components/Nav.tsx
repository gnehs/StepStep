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
        "flex items-center gap-1 p-2 flex-col text-xs",
        active ? "text-blue-500 font-bold" : "text-gray-500 hover:text-gray-700"
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
    <div className="bg-white fixed bottom-0 w-full z-10">
      <Container>
        <div className="flex justify-around gap-2 w-full">
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
