import React from "react";
import { Power, Radio } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderProfile } from "../../api/delivery.api";
import type { RiderStyles } from "../../types/rider.types";

export function RiderHeader({
  styles,
  theme,
  profile,
  isOnline,
  busy,
  onToggleOnline,
}: {
  styles: RiderStyles;
  theme: Theme;
  profile: RiderProfile | null;
  isOnline: boolean;
  busy: boolean;
  onToggleOnline: () => void;
}) {
  void styles;
  return (
    <div className="mb-3.5 flex flex-row items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-bold tracking-wide uppercase" style={{ color: theme.primary }}>
          QuickBihar Rider
        </span>
        <h1 className="mt-0.5 text-2xl font-extrabold" style={{ color: theme.text }}>
          Delivery Workspace
        </h1>
        <span className="line-clamp-1 block truncate text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
          {profile?.fullName || "Delivery Partner"} - {profile?.isVerified ? "Verified" : "Verification pending"}
        </span>
      </div>
      <button
        type="button"
        onClick={onToggleOnline}
        disabled={busy}
        className="flex min-h-[42px] cursor-pointer flex-row items-center gap-1.5 rounded-[14px] px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ backgroundColor: isOnline ? theme.primary : theme.text }}
      >
        {isOnline ? <Radio size={17} color="#fff" /> : <Power size={17} color={theme.background} />}
        <span
          className="font-extrabold"
          style={{ color: isOnline ? "#fff" : theme.background }}
        >
          {isOnline ? "Online" : "Go Online"}
        </span>
      </button>
    </div>
  );
}
