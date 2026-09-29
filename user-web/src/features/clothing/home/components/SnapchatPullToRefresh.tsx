import React, { useCallback, useRef, useState } from "react";
import LazyLottie from "@/src/components/common/LazyLottie";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

import fireLottie from "@/assets/lottie/LoadingCat.json";

const REFRESH_THRESHOLD = 90;
const MAX_PULL = 150;
const HOLD_OFFSET = 110;

interface SnapchatPullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  stickyHeaderIndices?: number[];
}

export default function SnapchatPullToRefresh({
  onRefresh,
  children,
}: SnapchatPullToRefreshProps) {
  const theme = useTheme() as any;
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const [pullOffset, setPullOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const scrollY = useRef(0);
  const refreshingRef = useRef(false);
  const hapticFiredRef = useRef(false);
  const dragStartY = useRef(0);

  const performRefresh = useCallback(async () => {
    if (refreshingRef.current) {
      return;
    }

    setIsRefreshingState(true);
    refreshingRef.current = true;
    setPullOffset(HOLD_OFFSET);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics can fail on some devices/emulators; refresh should still continue.
    }

    try {
      await onRefresh();
    } finally {
      setIsRefreshingState(false);
      setPullOffset(0);
      setTimeout(() => {
        refreshingRef.current = false;
        hapticFiredRef.current = false;
      }, 320);
    }
  }, [onRefresh]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    scrollY.current = event.currentTarget.scrollTop;
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (scrollY.current > 0 || refreshingRef.current) return;
    dragStartY.current = event.clientY;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragging || refreshingRef.current || scrollY.current > 0) return;
    const dy = event.clientY - dragStartY.current;
    if (dy <= 0) {
      if (pullOffset !== 0) setPullOffset(0);
      return;
    }
    const nextOffset = Math.min(dy * 0.55, MAX_PULL);
    setPullOffset(nextOffset);

    if (nextOffset >= REFRESH_THRESHOLD && !hapticFiredRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      hapticFiredRef.current = true;
    }
    if (nextOffset < REFRESH_THRESHOLD && hapticFiredRef.current) {
      hapticFiredRef.current = false;
    }
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    if (refreshingRef.current) return;
    if (pullOffset >= REFRESH_THRESHOLD) {
      void performRefresh();
    } else {
      setPullOffset(0);
      hapticFiredRef.current = false;
    }
  };

  const pullRatio = Math.min(Math.max(pullOffset / REFRESH_THRESHOLD, 0), 1);

  return (
    <div className="flex-1">
      <>
        <div
          className="flex-1"
          style={{
            transform: `translateY(${pullOffset}px)`,
            transition: dragging ? undefined : "transform 0.25s ease-out",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="pointer-events-none absolute top-[-120px] right-0 left-0 z-[2] flex h-[120px] items-center justify-center"
            style={{
              opacity: pullRatio,
              transform: `scale(${0.35 + pullRatio * 0.65})`,
              transition: dragging ? undefined : "opacity 0.25s ease-out, transform 0.25s ease-out",
            }}
          >
            <LazyLottie
              source={fireLottie}
              autoPlay={isRefreshingState}
              loop={isRefreshingState}
              style={{ width: 90, height: 90 }}
            />
          </div>

          <div
            className="flex-1 overflow-y-auto"
            style={{ backgroundColor: theme.background }}
            onScroll={handleScroll}
          >
            {children}
          </div>
        </div>
      </>
    </div>
  );
}
