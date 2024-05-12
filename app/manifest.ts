import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "餅餅踏踏",
    short_name: "餅餅踏踏",
    description: "來餅餅踏踏紀錄你的步步資料，和親朋好友一起步步大車拼！",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f2f2",
    theme_color: "#f2f2f2",
    icons: [
      {
        src: "/maskable_icon.png",
        sizes: "1280x1280",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
