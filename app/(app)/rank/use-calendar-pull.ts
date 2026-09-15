import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  animate,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";

const collapsedHeight = 248;
const expandedHeight = 572;

export function useCalendarPull(reducedMotion: boolean) {
  const height = useMotionValue(collapsedHeight);
  // Use the same progress as the rows so portraits occupy the space as it opens.
  const avatarProgress = useTransform(
    height,
    [collapsedHeight, expandedHeight],
    [0, 1],
  );
  const avatarOpacity = useTransform(
    avatarProgress,
    [0, 0.2, 0.65, 1],
    [0, 0.45, 1, 1],
  );
  const avatarY = useTransform(avatarProgress, [0, 1], [-4, 0]);
  const [expanded, setExpanded] = useState(false);
  const [avatarsMounted, setAvatarsMounted] = useState(false);
  const animation = useRef<{ stop: () => void } | null>(null);
  const origin = useRef(collapsedHeight);
  const axis = useRef<"x" | "y" | null>(null);
  const dragged = useRef(false);
  const cancelled = useRef(false);

  useEffect(() => () => animation.current?.stop(), []);

  function settle(open: boolean, immediate = reducedMotion) {
    animation.current?.stop();
    setExpanded(open);
    if (open) setAvatarsMounted(true);
    animation.current = animate(
      height,
      open ? expandedHeight : collapsedHeight,
      {
        ...(immediate
          ? { duration: 0 }
          : { type: "spring", stiffness: 440, damping: 42 }),
        onComplete: () => {
          if (!open) setAvatarsMounted(false);
        },
      },
    );
  }

  return {
    height,
    avatarProgress,
    avatarOpacity,
    avatarY,
    expanded,
    avatarsMounted,
    dragged,
    settle,
    gestureProps: {
      onPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
        if (!event.isPrimary || event.button !== 0) return;
        origin.current = height.get();
        axis.current = null;
        dragged.current = false;
        cancelled.current = false;
      },
      onPointerCancel() {
        cancelled.current = true;
        if (axis.current === "y") settle(expanded);
      },
      onPan(_: globalThis.PointerEvent, { offset }: PanInfo) {
        if (
          !axis.current &&
          Math.max(Math.abs(offset.x), Math.abs(offset.y)) >= 6
        ) {
          axis.current = Math.abs(offset.y) > Math.abs(offset.x) ? "y" : "x";
          if (axis.current === "y") {
            animation.current?.stop();
            origin.current = height.get() - offset.y;
            setAvatarsMounted(true);
            dragged.current = true;
          }
        }
        if (axis.current !== "y" || reducedMotion) return;
        const next = origin.current + offset.y;
        // Give the ends a little resistance while keeping the rows attached to the finger.
        height.set(
          next < collapsedHeight
            ? collapsedHeight - Math.min(12, (collapsedHeight - next) * 0.08)
            : next > expandedHeight
              ? expandedHeight + Math.min(12, (next - expandedHeight) * 0.08)
              : next,
        );
      },
      onPanEnd(_: globalThis.PointerEvent, { offset, velocity }: PanInfo) {
        if (axis.current !== "y" || cancelled.current) return;
        const deliberate =
          Math.abs(offset.y) >= 32 ||
          (Math.abs(offset.y) >= 12 && Math.abs(velocity.y) >= 300);
        settle(deliberate ? offset.y > 0 : expanded);
      },
    },
  };
}
