import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "餅餅踏踏",
  description: "來餅餅踏踏紀錄你的步步資料，和親朋好友一起步步大車拼！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="bg-[#f2f2f2] h-[100svh] flex flex-col text-[#111]">
        {children}
      </body>
    </html>
  );
}
