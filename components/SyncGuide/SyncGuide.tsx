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

export default function SyncGuide({
  active = true,
  syncEndpoint,
  legacySyncEndpoint,
  syncToken,
}: {
  active?: boolean;
  syncEndpoint: string;
  legacySyncEndpoint: string;
  syncToken: string;
}) {
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
        修改捷徑中的 API 網址，填入此頁的同步網址：{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">
          {legacySyncEndpoint}
        </code>
        。這是舊版相容格式，既有捷徑可以繼續使用。
      </Step>
      <Step title="2. （建議）改用 Authorization 標頭">
        若要避免令牌出現在 URL，將網址改為{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">
          {syncEndpoint}
        </code>
        ，在「取得 URL 內容」動作點選「顯示更多」→「標頭」→「加入新標頭」；
        確認方法為 POST，鍵填入 <code>Authorization</code>，值填入{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">
          Bearer {syncToken}
        </code>
        。可先按設定頁的「複製」取得令牌；如果要維持舊捷徑模式，可略過本步。
      </Step>
      <Step title="3. 取得存取權限" imgSrc="/sync-guide/allow-access.jpg">
        將捷徑下方三個讀取健康樣本動作都設定為允許
      </Step>
      <Step title="4. 選擇資料來源" imgSrc="/sync-guide/change-source.jpg">
        將捷徑下方三個讀取健康樣本的來源設定為您的手錶或手機名稱
      </Step>
      <Step
        title="5. 允許大量資料存取"
        vidSrc="/sync-guide/allow-bulk.mp4"
        active={active}
        prefersReducedMotion={prefersReducedMotion}
        scrollRoot={scrollRoot}
      >
        在設定＞捷徑＞進階＞啟用「允許分享大量資料」
      </Step>
      <Step title="6-1. 首次同步" imgSrc="/sync-guide/sync-allow.jpg">
        執行本捷徑開始你的首次同步，請選擇「永遠允許」 本捷徑分享你的健康樣本
      </Step>
      <Step title="6-2. 首次同步" imgSrc="/sync-guide/sync-result.jpg">
        同步完成後，你會在最下方看到執行結果，並應該能在餅餅踏踏看到你的步步資料
      </Step>
      <Step title="7. 設定自動執行" imgSrc="/sync-guide/automation.jpg">
        建議建立不少於四次的每日自動執行，讓你的步步資料能夠即時同步到餅餅踏踏
      </Step>
    </div>
  );
}
