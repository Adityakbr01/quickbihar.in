import React from "react";
import { ArrowLeft } from "lucide-react";
import { useWindowWidth } from "@/src/utils/responsive";

interface ProductDetailSkeletonProps {
  theme: any;
  onBack?: () => void;
}

/** Local pulse bar — avoids pulling the RN-based Skeleton into this module. */
const Sk = ({
  theme,
  width,
  height,
  radius = 4,
  className = "",
  style,
}: {
  theme: any;
  width: number | string;
  height: number | string;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`animate-pulse ${className}`}
    style={{ width, height, borderRadius: radius, backgroundColor: theme.border, ...style }}
  />
);

const ProductDetailSkeleton: React.FC<ProductDetailSkeletonProps> = ({ theme, onBack }) => {
  const isDark = theme.text === "#ffffff" || theme.background === "#0f0f0f";
  const windowWidth = useWindowWidth();
  const galleryHeight = Math.min(windowWidth * 1.2, 560);

  return (
    <div className="flex-1" style={{ backgroundColor: theme.background }}>
      {/* ── Image Gallery Placeholder ── */}
      <div className="relative" style={{ height: galleryHeight, backgroundColor: theme.tertiaryBackground }}>
        <Sk theme={theme} width="100%" height="100%" radius={0} />

        {/* Floating nav skeleton (matches real button size + position) */}
        <div className="absolute top-3.5 right-4 left-4 z-10 flex flex-row items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border"
              style={{
                backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
            </button>
          ) : (
            <Sk theme={theme} width={40} height={40} radius={20} />
          )}
          <div className="flex flex-row items-center gap-2.5">
            <Sk theme={theme} width={40} height={40} radius={20} />
            <Sk theme={theme} width={40} height={40} radius={20} />
          </div>
        </div>

        {/* Image counter pill placeholder */}
        <div className="absolute right-4 bottom-[60px] flex flex-row items-center rounded-[14px] border px-2.5 py-1.5">
          <Sk theme={theme} width={46} height={14} radius={7} />
        </div>
      </div>

      {/* ── Info Section ── */}
      <div className="px-4 pt-4 pb-3" style={{ backgroundColor: theme.background }}>
        {/* Brand */}
        <Sk theme={theme} width={120} height={14} style={{ marginBottom: 10 }} />
        {/* Title (2 lines) */}
        <Sk theme={theme} width="90%" height={14} style={{ marginBottom: 6 }} />
        <Sk theme={theme} width="60%" height={14} style={{ marginBottom: 14 }} />
        {/* Rating chip placeholder */}
        <div className="mb-3.5 flex flex-row items-center">
          <Sk theme={theme} width={42} height={18} />
          <Sk theme={theme} width={1} height={14} radius={1} style={{ marginLeft: 8, marginRight: 8 }} />
          <Sk theme={theme} width={70} height={12} />
        </div>
        {/* Price row */}
        <div className="flex flex-row items-baseline gap-2">
          <Sk theme={theme} width={90} height={22} radius={5} />
          <Sk theme={theme} width={70} height={14} />
          <Sk theme={theme} width={56} height={18} />
        </div>
        {/* Tax info */}
        <Sk theme={theme} width={150} height={11} style={{ marginTop: 8 }} />
      </div>

      {/* ── Color Section ── */}
      <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
        <Sk theme={theme} width={80} height={13} style={{ marginBottom: 14 }} />
        <div className="flex flex-row flex-wrap gap-2.5">
          {[0, 1, 2].map((i) => (
            <Sk key={`c-${i}`} theme={theme} width={86} height={36} radius={18} />
          ))}
        </div>
      </div>

      {/* ── Size Section ── */}
      <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
        <div className="mb-3.5 flex flex-row items-center justify-between">
          <Sk theme={theme} width={110} height={13} />
          <Sk theme={theme} width={80} height={12} />
        </div>
        <div className="flex flex-row flex-wrap gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Sk key={`s-${i}`} theme={theme} width={48} height={48} radius={24} />
          ))}
        </div>
      </div>

      {/* ── Delivery Section ── */}
      <div className="px-4 py-4" style={{ backgroundColor: theme.background }}>
        <Sk theme={theme} width={140} height={13} style={{ marginBottom: 14 }} />
        <div className="mb-5 flex flex-col gap-2.5">
          <div
            className="flex flex-row items-center gap-3 rounded-xl border p-3.5"
            style={{ backgroundColor: theme.tertiaryBackground, borderColor: theme.border }}
          >
            <Sk theme={theme} width={22} height={22} radius={11} />
            <div className="flex-1">
              <Sk theme={theme} width="70%" height={12} style={{ marginBottom: 6 }} />
              <Sk theme={theme} width="90%" height={10} />
            </div>
          </div>
        </div>

        {/* Policies row */}
        <div className="flex flex-row justify-around pt-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={`p-${i}`} className="flex flex-1 flex-col items-center gap-1.5">
              <Sk theme={theme} width={42} height={42} radius={21} />
              <Sk theme={theme} width={50} height={10} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Expandable Sections ── */}
      <div className="px-4" style={{ backgroundColor: theme.background }}>
        {[0, 1, 2].map((i) => (
          <div key={`exp-${i}`}>
            <div className="flex flex-row items-center justify-between py-4">
              <Sk theme={theme} width={180} height={14} />
              <Sk theme={theme} width={16} height={16} />
            </div>
            {/* Content preview (only for the first one which is open by default) */}
            {i === 0 && (
              <div className="pb-4">
                <Sk theme={theme} width="100%" height={11} style={{ marginBottom: 6 }} />
                <Sk theme={theme} width="95%" height={11} style={{ marginBottom: 6 }} />
                <Sk theme={theme} width="80%" height={11} style={{ marginBottom: 16 }} />

                {/* Spec rows */}
                {[0, 1, 2, 3, 4].map((j) => (
                  <div
                    key={`spec-${j}`}
                    className="flex flex-row border-b py-2.5"
                    style={{ borderBottomColor: theme.border }}
                  >
                    <Sk theme={theme} width="30%" height={12} />
                    <Sk theme={theme} width="45%" height={12} style={{ marginLeft: "auto" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Reviews Section Skeleton ── */}
      <div className="px-4" style={{ backgroundColor: theme.background }}>
        <div className="flex flex-row items-center justify-between py-4">
          <Sk theme={theme} width={170} height={14} />
          <Sk theme={theme} width={16} height={16} />
        </div>
        <div className="pb-4">
          {/* Rating overview */}
          <div className="mb-6 flex flex-row">
            <div className="flex flex-col items-center border-r pr-5" style={{ borderRightColor: "#E5E7EB" }}>
              <Sk theme={theme} width={56} height={36} radius={6} style={{ marginBottom: 6 }} />
              <Sk theme={theme} width={80} height={12} style={{ marginBottom: 4 }} />
              <Sk theme={theme} width={70} height={10} />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-1 pl-4">
              {[0, 1, 2, 3, 4].map((k) => (
                <div key={`rb-${k}`} className="flex flex-row items-center gap-1">
                  <Sk theme={theme} width={12} height={10} radius={3} />
                  <Sk theme={theme} width="100%" height={5} radius={3} />
                  <Sk theme={theme} width={22} height={10} radius={3} />
                </div>
              ))}
            </div>
          </div>

          {/* Sample review card */}
          <div className="border-b py-4" style={{ borderBottomColor: theme.border, paddingTop: 12 }}>
            <div className="mb-2 flex flex-row items-center gap-2.5">
              <Sk theme={theme} width={32} height={16} />
              <Sk theme={theme} width="60%" height={14} />
            </div>
            <Sk theme={theme} width="100%" height={11} style={{ marginTop: 8, marginBottom: 6 }} />
            <Sk theme={theme} width="92%" height={11} style={{ marginBottom: 6 }} />
            <Sk theme={theme} width="70%" height={11} style={{ marginBottom: 12 }} />
            <div className="flex flex-row items-center gap-1.5">
              <Sk theme={theme} width={26} height={26} radius={13} />
              <Sk theme={theme} width={80} height={12} />
              <div className="flex-1" />
              <Sk theme={theme} width={40} height={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer matching the real screen (for the sticky action bar) */}
      <div style={{ height: 100 }} />
    </div>
  );
};

export default ProductDetailSkeleton;
