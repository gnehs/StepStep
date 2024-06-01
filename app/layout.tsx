import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevBadge from "@/components/DevBadge";

const APP_NAME = "餅餅踏踏";
const APP_TITLE_TEMPLATE = "%s - 餅餅踏踏";
const APP_DESCRIPTION =
  "來餅餅踏踏紀錄你的步步資料，和親朋好友一起步步大車拼！";
const PREVIEW_IMAGE = "https://steps.pancake.tw/cover.jpg";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: PREVIEW_IMAGE,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: APP_NAME,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: PREVIEW_IMAGE,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2f2f2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <link rel="icon" href="/maskable_icon.png" type="image/png" />
      </head>
      <body className="bg-[#f2f2f2] pt-[env(safe-area-inset-top)] text-[#111]">
        {children}
        <DevBadge />
      </body>
    </html>
  );
}
