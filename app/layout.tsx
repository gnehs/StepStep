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
      <head>
        {/* font */}
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&display=swap"
          rel="stylesheet"
        />
        {/* icon */}
        <link rel="icon" href="/logo-favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/logo.png" type="image/png" />
      </head>
      <body className="bg-[#f2f2f2] text-[#111]">{children}</body>
    </html>
  );
}
