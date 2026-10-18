import { Camera, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React from "react";
import { goBack, goTo } from "@/src/utils/navigation";

import { useColors } from "../hooks/useColors";

/**
 * Virtual try-on placeholder. Live AR needs backend 3D models per product
 * (not served yet) — this screen honestly says "coming soon" instead of
 * rendering mock jewellery. Product pages hide the Try button until then.
 */
export const JeweleryTryOnScreen = () => {
  const navigate = useNavigate();
  const colors = useColors();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: colors.ivory }}
    >
      <div className="flex flex-row items-center justify-between px-4 py-3">
        <button
          type="button"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full"
          onClick={() => goBack(navigate)}
          aria-label="Close"
        >
          <X size={22} color={colors.ink} />
        </button>
        <h1
          className="text-base tracking-[2px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          Virtual Try-On
        </h1>
        <div className="w-9" />
      </div>

      <div
        className="flex flex-1 flex-col items-center justify-center gap-3.5 p-8"
        style={{ backgroundColor: colors.pearl }}
      >
        <div
          className="mb-2 flex h-[88px] w-[88px] items-center justify-center rounded-full border"
          style={{ borderColor: colors.gold, borderWidth: 1 }}
        >
          <Camera size={32} color={colors.gold} />
        </div>
        <h2
          className="text-center text-[32px] leading-[38px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_500Medium_Italic",
          }}
        >
          Coming soon.
        </h2>
        <p
          className="max-w-[300px] text-center text-sm leading-[22px]"
          style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
        >
          Live AR mirror is in the works. Meanwhile, every piece ships with
          free 30-day returns — try it at home, for real.
        </p>
        <button
          type="button"
          className="mt-2.5 cursor-pointer rounded-[2px] px-7 py-3.5 transition-opacity active:opacity-90"
          style={{ backgroundColor: colors.gold }}
          onClick={() => goTo(navigate, "/jewelery/collections" as any)}
        >
          <span
            className="text-xs tracking-[1.5px]"
            style={{ color: colors.onBrand, fontFamily: "DMSans_500Medium" }}
          >
            Browse Collections →
          </span>
        </button>
      </div>
    </div>
  );
};
