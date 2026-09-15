"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const CARD_VISIBILITY_THRESHOLD = 0.75;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

function Step({
  title,
  imgSrc,
  vidSrc,
  children,
  active = true,
  prefersReducedMotion = false,
  scrollRoot,
}: {
  title: string;
  imgSrc?: string;
  vidSrc?: string;
  children: React.ReactNode;
  active?: boolean;
  prefersReducedMotion?: boolean;
  scrollRoot?: RefObject<HTMLDivElement | null>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const root = scrollRoot?.current;

    if (!video || !root || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(
          entry.isIntersecting &&
            entry.intersectionRatio >= CARD_VISIBILITY_THRESHOLD,
        );
      },
      {
        root,
        threshold: [0, CARD_VISIBILITY_THRESHOLD],
      },
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (!active || !isCardVisible || prefersReducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Autoplay can still be blocked by the browser; controls remain
      // available when reduced motion is enabled for manual playback.
    });

    return () => video.pause();
  }, [active, isCardVisible, prefersReducedMotion]);

  return (
    <div className="flex w-[80%] shrink-0 snap-center snap-always flex-col rounded-lg bg-white p-2 dark:bg-black/5">
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          width={1}
          height={1}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full rounded bg-gray-50 object-contain"
        />
      )}
      {vidSrc && (
        <video
          ref={videoRef}
          src={vidSrc}
          controls
          loop
          muted
          playsInline
          preload="metadata"
          className="aspect-square w-full rounded bg-gray-50 object-cover"
        />
      )}
      <div className="mt-2">
        <h2 className="font-bold">{title}</h2>
        <div className="text-sm opacity-75">{children}</div>
      </div>
    </div>
  );
}

export default function SyncGuide({ active = true }: { active?: boolean }) {
  const scrollRoot = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      ref={scrollRoot}
      className="mt-1 flex snap-x snap-mandatory flex-nowrap gap-2 overflow-x-auto rounded-sm px-4"
    >
      <Step title="0. 安裝捷徑" imgSrc="/sync-guide/install-shortcut.jpg">
        將餅餅踏踏記錄器安裝到您的 iPhone 或 iPad 上
      </Step>
      <Step title="1. 設定 API 網址" imgSrc="/sync-guide/change-api-url.jpg">
        修改捷徑中的 API 網址，將其更改為此頁面上方的專屬同步網址
      </Step>
      <Step title="2. 取得存取權限" imgSrc="/sync-guide/allow-access.jpg">
        將捷徑下方三個讀取健康樣本動作都設定為允許
      </Step>
      <Step title="3. 選擇資料來源" imgSrc="/sync-guide/change-source.jpg">
        將捷徑下方三個讀取健康樣本的來源設定為您的手錶或手機名稱
      </Step>
      <Step
        title="4. 允許大量資料存取"
        vidSrc="/sync-guide/allow-bulk.mp4"
        active={active}
        prefersReducedMotion={prefersReducedMotion}
        scrollRoot={scrollRoot}
      >
        在設定＞捷徑＞進階＞啟用「允許分享大量資料」
      </Step>
      <Step title="5-1. 首次同步" imgSrc="/sync-guide/sync-allow.jpg">
        執行本捷徑開始你的首次同步，請選擇「永遠允許」 本捷徑分享你的健康樣本
      </Step>
      <Step title="5-2. 首次同步" imgSrc="/sync-guide/sync-result.jpg">
        同步完成後，你會在最下方看到執行結果，並應該能在餅餅踏踏看到你的步步資料
      </Step>
      <Step title="6. 設定自動執行" imgSrc="/sync-guide/automation.jpg">
        建議建立不少於四次的每日自動執行，讓你的步步資料能夠即時同步到餅餅踏踏
      </Step>
    </div>
  );
}
