import React from "react";
import { Gradient } from "@/src/components/common/Gradient";
import { ShoppingBag } from "lucide-react";

// ─── SHOPPING BAG ICON (Pendulum Sway + Harmonic Levitation) ────────────────────
export const ShoppingBagIcon = () => {
  // CSS keyframe loops (see index.css) replace the reanimated shared values:
  // float + rock, shadow pulse, twinkling spinning stars.
  const bagStyle: React.CSSProperties = {
    animation: "qb-bag 4.8s ease-in-out infinite",
  };

  const shadowStyle: React.CSSProperties = {
    animation: "qb-bag-shadow 4.8s ease-in-out infinite",
  };

  const star1Style: React.CSSProperties = {
    animation: "qb-twinkle-spin 3s ease-in-out infinite",
  };

  const star2Style: React.CSSProperties = {
    animation: "qb-twinkle-spin-rev 4s ease-in-out 1s infinite",
  };

  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <div
        className="absolute bottom-3 h-3 w-[65px] rounded-[30px] bg-black/60"
        style={{ transform: "scaleY(0.5)", ...shadowStyle }}
      />
      <div className="flex items-center justify-center" style={bagStyle}>
        <div style={{ filter: "drop-shadow(0 0 16px rgba(255,255,255,0.6))" }}>
          <ShoppingBag size={120} color="rgba(255,255,255,0.95)" />
        </div>
      </div>
      <div
        className="absolute top-2.5 right-2 h-4 w-4 rounded-[3px] bg-white"
        style={{ boxShadow: "0 0 10px rgba(255,255,255,0.8)", ...star1Style }}
      />
      <div
        className="absolute bottom-[22px] left-1 h-3 w-3 rounded-[2.5px] bg-white/95"
        style={star2Style}
      />
    </div>
  );
};

// ─── CREDIT CARD ICON (Gyroscopic Float + Tap Impact + Hologram) ───────────────────
export const CreditCardIcon = () => {
  // CSS keyframe loops (see index.css): card bob, shadow pulse,
  // holographic sweep, NFC waves.
  const cardStyle: React.CSSProperties = {
    animation: "qb-card-bob 4s ease-in-out infinite",
  };

  const shimmerStyle: React.CSSProperties = {
    animation: "qb-shimmer 6s ease-in-out infinite",
  };

  const shadowStyle: React.CSSProperties = {
    animation: "qb-card-shadow 4s ease-in-out infinite",
  };

  const wave1Style: React.CSSProperties = {
    animation: "qb-wave 2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
  };

  const wave2Style: React.CSSProperties = {
    animation: "qb-wave 2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s infinite",
  };

  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <div
        className="absolute bottom-2.5 h-3 w-[90px] rounded-[30px] bg-black/60"
        style={{ transform: "scaleY(0.5)", ...shadowStyle }}
      />
      <div style={cardStyle}>
        <div
          className="relative h-[70px] w-[108px] overflow-hidden rounded-[14px] border-[1.5px] border-white/80"
          style={{ boxShadow: "0 10px 16px rgba(0,0,0,0.25)" }}
        >
          <Gradient
            colors={["rgba(255,255,255,0.4)", "rgba(255,255,255,0.05)"]}
            style={{ position: "absolute", inset: 0 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <div className="absolute top-[14px] right-0 left-0 h-[14px] bg-black/50" />
          {/* Holographic sweeping line */}
          <div className="absolute inset-0 overflow-hidden" style={shimmerStyle}>
            <Gradient
              colors={["transparent", "rgba(255,255,255,0.8)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: "absolute", inset: 0, width: 40, transform: "skewX(-20deg)" }}
            />
          </div>
          <div
            className="absolute bottom-[14px] left-[14px] h-4 w-[22px] overflow-hidden rounded border border-white/60 bg-[#fcd34d]"
          >
            <Gradient colors={["#fcd34d", "#b45309"]} style={{ position: "absolute", inset: 0 }} />
          </div>
        </div>
      </div>
      <div
        className="absolute top-0 right-1.5 h-14 w-14 rounded-full border-[2.5px] border-white/80"
        style={wave1Style}
      />
      <div
        className="absolute top-2 right-[14px] h-10 w-10 rounded-[20px] border-[2.5px] border-white/80"
        style={wave2Style}
      />
    </div>
  );
};

// ─── TRUCK ICON (Suspension Bounce + Wheel Spin + Speed Streaks) ────────────────────
export const TruckIcon = () => {
  // CSS keyframe loops (see index.css): body bounce, spinning wheels,
  // shadow pulse, speed streaks.
  const truckStyle: React.CSSProperties = {
    animation: "qb-truck 1.4s ease-in-out infinite",
  };

  const wheelStyle: React.CSSProperties = {
    animation: "qb-spin-rev 0.4s linear infinite",
  };

  const shadowStyle: React.CSSProperties = {
    animation: "qb-truck-shadow 1.4s ease-in-out infinite",
  };

  const s1: React.CSSProperties = { animation: "qb-streak 0.6s linear infinite" };
  const s2: React.CSSProperties = { animation: "qb-streak 0.46s linear 0.1s infinite" };
  const s3: React.CSSProperties = { animation: "qb-streak 0.75s linear 0.2s infinite" };
  const particle: React.CSSProperties = { animation: "qb-streak 0.4s linear 0.05s infinite" };

  return (
    <div className="relative flex h-[140px] w-[140px] items-center justify-center">
      <div className="absolute top-[60px] left-0 h-[2.5px] w-10 rounded bg-white/90" style={s1} />
      <div className="absolute top-[70px] left-[-6px] h-[2.5px] w-14 rounded bg-white/90" style={s2} />
      <div className="absolute top-[80px] left-2 h-[2.5px] w-8 rounded bg-white/90" style={s3} />
      <div className="absolute top-[90px] left-5 h-1.5 w-1.5 rounded-full bg-white" style={particle} />

      <div
        className="absolute bottom-[26px] h-3 w-[100px] rounded-[30px] bg-black/60"
        style={{ transform: "scaleY(0.5)", ...shadowStyle }}
      />

      <div className="flex flex-col" style={truckStyle}>
        <div className="relative flex h-[60px] w-[114px] flex-row overflow-hidden rounded-[10px] border-[1.5px] border-white/90">
          <Gradient
            colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.05)"]}
            style={{ position: "absolute", inset: 0 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <div className="relative ml-auto flex h-full w-10 items-start justify-center overflow-hidden border-l-[1.5px] border-l-white/70 pt-2.5">
            <Gradient
              colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.1)"]}
              style={{ position: "absolute", inset: 0 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <div className="h-5 w-[22px] rounded-[5px] border-[1.5px] border-white/90 bg-white/50" />
          </div>
        </div>
        <div className="flex w-[114px] flex-row px-3">
          <div
            className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full border-[2.5px] border-white/90 bg-[#0f172a]"
            style={wheelStyle}
          >
            <div className="absolute h-0.5 w-[26px] bg-white/30" />
            <div className="absolute h-0.5 w-[26px] bg-white/30" style={{ transform: "rotate(90deg)" }} />
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <div className="flex-1" />
          <div
            className="relative flex h-[26px] w-[26px] items-center justify-center rounded-full border-[2.5px] border-white/90 bg-[#0f172a]"
            style={wheelStyle}
          >
            <div className="absolute h-0.5 w-[26px] bg-white/30" />
            <div className="absolute h-0.5 w-[26px] bg-white/30" style={{ transform: "rotate(90deg)" }} />
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
