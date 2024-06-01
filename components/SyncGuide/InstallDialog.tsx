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
        className="block rounded-lg bg-white p-2 text-center font-semibold text-blue-500 shadow-sm"
        onClick={() => setVisible(true)}
      >
        設定同步工具
      </button>
      <Drawer.Root open={visible} onOpenChange={setVisible}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 m-auto mt-24 flex h-max max-h-[90vh] max-w-[500px] flex-col rounded-t-[10px] bg-[#f2f2f2]">
            <div className="m-auto mt-3 h-1.5 w-20 rounded-full bg-black/20" />
            <div className="max-h-[80vh] overflow-y-auto p-4 pb-[calc(8px+env(safe-area-inset-bottom))]">
              <div className="mb-2 grid grid-cols-2 rounded-lg bg-black/5 p-1">
                <button
                  onClick={() => setPlatform("ios")}
                  className={twMerge(
                    "rounded-[6px] p-1 text-center",
                    platform === "ios" &&
                      "bg-white font-semibold text-black shadow-sm",
                  )}
                >
                  iOS
                </button>
                <button
                  onClick={() => setPlatform("android")}
                  className={twMerge(
                    "rounded-[6px] p-1 text-center",
                    platform === "android" &&
                      "bg-white font-semibold text-black shadow-sm",
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
                    className="mt-2 block rounded-lg border border-blue-700 bg-gradient-to-b from-blue-500 to-blue-700 p-2 text-center font-semibold shadow-sm hover:to-blue-800"
                  >
                    <span className="text-white drop-shadow-lg">
                      安裝同步 iOS 捷徑
                    </span>
                  </a>
                </>
              )}
              {platform === "android" && (
                <>
                  <div className="flex w-full shrink-0 flex-col rounded-lg bg-white p-2 shadow-sm">
                    <img src="/android.jpg" className="w-full rounded" />
                    <div className="mt-2">
                      <h2 className="font-bold">餅餅踏踏記錄器</h2>
                      <div className="text-sm opacity-75">
                        我們提供了同步 APP，可以將您的步步資料同步到餅餅踏踏。
                      </div>
                    </div>
                  </div>
                  <a
                    href="https://github.com/gnehs/StepStep-RN/releases/latest"
                    target="_blank"
                    className="mt-2 block rounded-lg border border-blue-700 bg-gradient-to-b from-blue-500 to-blue-700 p-2 text-center font-semibold shadow-sm hover:to-blue-800"
                  >
                    <span className="text-white drop-shadow-lg">
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
