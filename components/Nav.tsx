import Container from "@/components/Container";
import { Cog, User, Cookie, BarChart2 } from "lucide-react";
import Link from "next/link";
function NavButton({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className="flex items-center gap-1 p-2 text-gray-600 hover:text-gray-800 flex-col text-sm"
      href={href}
    >
      {children}
    </Link>
  );
}
export default function Nav() {
  return (
    <div className="border-t border-gray-50 bg-white shadow-2xl">
      <Container>
        <div className="flex justify-around gap-2 w-full">
          <NavButton href="/">
            <Cookie size={28} /> 首頁
          </NavButton>
          <NavButton href="/me">
            <User size={28} /> 我的
          </NavButton>
          <NavButton href="/rank">
            <BarChart2 size={28} /> 排行榜
          </NavButton>
          <NavButton href="/settings">
            <Cog size={28} /> 設定
          </NavButton>
        </div>
      </Container>
    </div>
  );
}
