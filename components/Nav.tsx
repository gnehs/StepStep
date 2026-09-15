"use client";

import { usePathname } from "next/navigation";
import {
  Settings,
  Footprints,
  ChartNoAxesColumn,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const items: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "餅餅踏踏", Icon: Footprints },
  { href: "/rank", label: "排行榜", Icon: ChartNoAxesColumn },
  { href: "/settings", label: "設定", Icon: Settings },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="主要導覽" className="app-nav">
      <div className="mx-auto flex w-full max-w-3xl items-center px-4">
        {items.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? ["/", "/analytics", "/badges", "/me"].includes(pathname)
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="ios-tab pressable"
            >
              <Icon
                size={25}
                strokeWidth={active ? 2.2 : 1.7}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
