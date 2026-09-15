"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Drawer } from "vaul";
import SyncGuide from "./SyncGuide";

function PlatformPanels({
  platform,
  children,
}: {
  platform: "ios" | "android";
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const height = useMotionValue<number | string>("auto");
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const panel = containerRef.current?.children[platform === "ios" ? 0 : 1] as
      HTMLElement | undefined;
    if (!panel) return;

    let animation: ReturnType<typeof animate> | undefined;
    let targetHeight: number | undefined;
    const updateHeight = () => {
      const nextHeight = panel.getBoundingClientRect().height;
      if (nextHeight === targetHeight) return;
      targetHeight = nextHeight;
      animation?.stop();
      if (!initialized.current || reducedMotion) {
        height.set(nextHeight);
        initialized.current = true;
      } else {
        animation = animate(height, nextHeight, {
          duration: 0.25,
          ease: [0.22, 1, 0.36, 1],
        });
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(panel);
    return () => {
      observer.disconnect();
      animation?.stop();
    };
  }, [height, platform, reducedMotion]);

  return (
    <motion.div
      ref={containerRef}
      className="-mx-4 grid overflow-hidden px-4"
      style={{ height }}
    >
      {children}
    </motion.div>
  );
}

export default function InstallSync({
  syncEndpoint,
  legacySyncEndpoint,
  syncToken,
}: {
  syncEndpoint: string;
  legacySyncEndpoint: string;
  syncToken: string;
}) {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android">("ios");

  return (
    <>
      <button
        type="button"
        className="surface-card pressable min-h-12 w-full px-4 py-3 text-center font-semibold text-primary-700 dark:text-primary-200"
        onClick={() => setVisible(true)}
      >
        設定同步工具
      </button>
      <Drawer.Root open={visible} onOpenChange={setVisible}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 bg-noise motion-reduce:animate-none!" />
          <Drawer.Content className="surface-card fixed right-0 bottom-0 left-0 z-50 m-auto mt-24 flex h-max max-h-[90dvh] max-w-[500px] flex-col overflow-hidden rounded-t-3xl rounded-b-none border-b-0 bg-white motion-reduce:animate-none! motion-reduce:transition-none dark:bg-primary-900">
            <Drawer.Title className="sr-only">設定同步工具</Drawer.Title>
            <Drawer.Description className="sr-only">
              選擇您的手機平台，依照教學安裝同步工具。
            </Drawer.Description>
            <div className="m-auto mt-3 h-1.5 w-20 shrink-0 rounded-full bg-black/20 dark:bg-white/10" />
            <div className="min-h-0 overflow-y-auto p-5 pb-[calc(8px+env(safe-area-inset-bottom))]">
              <div
                role="group"
                aria-label="手機平台"
                className="relative mb-4 grid grid-cols-2 rounded-lg bg-black/5 p-1 text-primary-950 dark:bg-black/10 dark:text-white"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-[6px] bg-white shadow-xs transition-transform duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none dark:bg-white/10"
                  style={{
                    transform: `translateX(${platform === "ios" ? "0" : "100%"})`,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPlatform("ios")}
                  aria-pressed={platform === "ios"}
                  className="pressable relative min-h-11 rounded-xl p-2 text-center font-semibold"
                >
                  iOS
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform("android")}
                  aria-pressed={platform === "android"}
                  className="pressable relative min-h-11 rounded-xl p-2 text-center font-semibold"
                >
                  Android
                </button>
              </div>
              {/* Resize one container while keeping both guides mounted. */}
              <PlatformPanels platform={platform}>
                <div
                  inert={platform !== "ios"}
                  aria-hidden={platform !== "ios"}
                  className="col-start-1 row-start-1 -mx-4 min-w-0 self-start transition-opacity duration-150 ease-in-out motion-reduce:transition-none"
                  style={{
                    opacity: platform === "ios" ? 1 : 0,
                  }}
                >
                  <SyncGuide
                    active={visible && platform === "ios"}
                    syncEndpoint={syncEndpoint}
                    legacySyncEndpoint={legacySyncEndpoint}
                    syncToken={syncToken}
                  />
                </div>
                <div
                  inert={platform !== "android"}
                  aria-hidden={platform !== "android"}
                  className="col-start-1 row-start-1 min-w-0 self-start transition-opacity duration-150 ease-in-out motion-reduce:transition-none"
                  style={{
                    opacity: platform === "android" ? 1 : 0,
                  }}
                >
                  <div className="surface-card w-full p-3">
                    <img
                      src="/android.jpg"
                      alt="餅餅踏踏記錄器 Android 應用程式畫面"
                      width={3840}
                      height={2160}
                      decoding="async"
                      className="aspect-video w-full rounded-2xl"
                    />
                    <div className="mt-3">
                      <h2 className="font-semibold tracking-tight">
                        餅餅踏踏記錄器
                      </h2>
                      <div className="mt-1 text-sm leading-6 opacity-75">
                        我們提供了同步 APP，可以將您的步步資料同步到餅餅踏踏。
                      </div>
                    </div>
                  </div>
                </div>
              </PlatformPanels>
              <a
                href={
                  platform === "ios"
                    ? "https://www.icloud.com/shortcuts/93567aa7d9ef411099f9c794ec2ed3e1"
                    : "https://github.com/gnehs/StepStep-RN/releases/latest"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="ios-button pressable mt-3 block p-3 text-center"
              >
                <span className="text-white">
                  {platform === "ios" ? "安裝同步 iOS 捷徑" : "安裝同步 APP"}
                </span>
              </a>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
