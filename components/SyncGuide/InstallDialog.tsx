"use client";
import { useState } from "react";
import { Drawer } from "vaul";
import { motion, AnimatePresence } from "framer-motion";
import SyncGuide from "./SyncGuide";
import { twMerge } from "tailwind-merge";
export default function InstallSync() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  return (
    <>
      <button
        className="dark:glass-effect w-full rounded-lg bg-white px-4 py-2 text-center text-blue-500 shadow-sm dark:bg-black/5 dark:text-blue-300"
        onClick={() => setVisible(true)}
      >
        設定同步工具
      </button>
      <Drawer.Root open={visible} onOpenChange={setVisible}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 bg-noise backdrop-blur" />
          <Drawer.Content className="dark:bg-primary-900 fixed bottom-0 left-0 right-0 z-50 m-auto mt-24 flex h-max max-h-[90vh] max-w-[500px] flex-col rounded-t-[10px] bg-[#f2f2f2]">
            <div className="m-auto mt-3 h-1.5 w-20 rounded-full bg-black/20 dark:bg-white/10" />
            <div className="max-h-[80vh] overflow-y-auto p-4 pb-[calc(8px+env(safe-area-inset-bottom))]">
              <div className="mb-2 grid grid-cols-2 rounded-lg bg-black/5 p-1 text-black dark:bg-black/10 dark:text-white">
                <button onClick={() => setPlatform("ios")} className="relative">
                  <div className="relative z-20 p-1 text-center">iOS</div>
                  <AnimatePresence>
                    {platform === "ios" && (
                      <motion.div
                        className="dark:glass-effect absolute left-0 top-0 h-full w-full rounded-[6px] bg-white bg-noise font-semibold shadow-sm dark:bg-black/5"
                        layoutId="switcher"
                        style={{
                          originY: "0px",
                        }}
                      />
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => setPlatform("android")}
                  className="relative"
                >
                  <div className="relative z-20 p-1 text-center">Android</div>{" "}
                  <AnimatePresence>
                    {platform === "android" && (
                      <motion.div
                        className="dark:glass-effect absolute left-0 top-0 h-full w-full rounded-[6px] bg-white bg-noise font-semibold shadow-sm dark:bg-black/5"
                        layoutId="switcher"
                        style={{
                          originY: "0px",
                        }}
                      />
                    )}
                  </AnimatePresence>
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
                  <div className="dark:glass-effect flex w-full shrink-0 flex-col rounded-lg bg-white p-2 shadow-sm dark:bg-black/5">
                    <img
                      src="/android.jpg"
                      className="h-[378px] w-full rounded object-cover"
                    />
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
