"use client";
import Nav from "@/components/Nav";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "usehooks-ts";
import { refreshToken } from "@/services/actions/auth";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [token, setToken] = useLocalStorage("token", "");
  // refresh token
  useEffect(() => {
    if (token !== "") {
      refresh();
    } else {
      router.push("/login");
    }
  }, [token]);
  async function refresh() {
    try {
      let res = await refreshToken(token);
      if (!res.success) {
        setToken("");
        router.push("/login");
      }
      setToken(res.token!);
    } catch (error) {}
  }
  return (
    <div className="bg-[#f2f2f2] min-h-[100svh]">
      <div className="grow overflow-y-scroll pb-[calc(64px+8px+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <Nav />
    </div>
  );
}
