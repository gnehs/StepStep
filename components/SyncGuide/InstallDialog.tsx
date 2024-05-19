"use client";
import { useState } from "react";
import { Drawer } from "vaul";
import SyncGuide from "./SyncGuide";
import { twMerge } from "tailwind-merge";
export default function InstallSync() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  return (
    <>
      <button
        className="block text-blue-500 bg-white p-2 rounded-lg text-center shadow-sm font-semibold"
        onClick={() => setVisible(true)}
      >
        設定同步工具
      </button>
      <Drawer.Root open={visible} onOpenChange={setVisible}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-max max-h-[90vh] flex-col rounded-t-[10px] bg-[#f2f2f2] max-w-[500px] m-auto">
            <div className="m-auto mt-3 h-1.5 w-20 rounded-full bg-black/20" />
            <div className="max-h-[80vh] overflow-y-auto p-4 pb-[calc(8px+env(safe-area-inset-bottom))]">
              <div className="bg-black/5 p-1 rounded-lg grid grid-cols-2 mb-2">
                <button
                  onClick={() => setPlatform("ios")}
                  className={twMerge(
                    "p-1 rounded-[6px] text-center",
                    platform === "ios" &&
                      "bg-white text-black shadow-sm font-semibold"
                  )}
                >
                  iOS
                </button>
                <button
                  onClick={() => setPlatform("android")}
                  className={twMerge(
                    "p-1 rounded-[6px] text-center",
                    platform === "android" &&
                      "bg-white text-black shadow-sm font-semibold"
                  )}
                >
                  Android
                </button>
              </div>
              {platform === "ios" && (
                <>
                  <div className="-mx-4">
                    <SyncGuide />
                  </div>
                  <a
                    href="https://www.icloud.com/shortcuts/93567aa7d9ef411099f9c794ec2ed3e1"
                    target="_blank"
                    className="block bg-gradient-to-b from-blue-500 to-blue-700 hover:to-blue-800 border border-blue-700 p-2 rounded-lg text-center shadow-sm font-semibold mt-2"
                  >
                    <span className="drop-shadow-lg text-white">
                      安裝同步 iOS 捷徑
                    </span>
                  </a>
                </>
              )}
              {platform === "android" && (
                <>
                  <div className="flex flex-col w-full bg-white shrink-0 p-2 rounded-lg snap-always snap-center">
                    <img
                      src="/android.jpg"
                      className="w-full rounded-lg shadow-sm"
                    />
                    <div className="mt-2">
                      <h2 className="font-bold">餅餅踏踏記錄器</h2>
                      <div className="opacity-75 text-sm">
                        我們提供了同步 APP，可以將您的步步資料同步到餅餅踏踏。
                      </div>
                    </div>
                  </div>
                  <a
                    href="https://github.com/gnehs/StepStep-RN/releases/latest"
                    target="_blank"
                    className="block bg-gradient-to-b from-blue-500 to-blue-700 hover:to-blue-800 border border-blue-700 p-2 rounded-lg text-center shadow-sm font-semibold mt-2"
                  >
                    <span className="drop-shadow-lg text-white">
                      安裝同步 APP
                    </span>
                  </a>
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
