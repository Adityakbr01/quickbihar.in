import React from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, DESKTOP, useWindowWidth } from "@/src/utils/responsive";

/**
 * Desktop-only footer for the clothing catalog. Null everywhere else,
 * so the mobile app is pixel-identical.
 */
export const DesktopFooter = () => {
  const width = useWindowWidth();
  const theme = useTheme() as any;

  if (width < BREAKPOINTS.desktopMin) return null;

  const cols: { title: string; links: string[] }[] = [
    { title: "Shop", links: ["Men's Wear", "Women's Wear", "Kids", "Sarees & Ethnic", "Top Selling"] },
    { title: "Malls in Bihar", links: ["Patna", "Gaya", "Muzaffarpur", "Buxar", "Explore all malls"] },
    { title: "Help", links: ["Track order", "Shipping & delivery", "Returns", "Contact support"] },
    { title: "Quick Bihar", links: ["About us", "Sell on QuickBihar", "Become a rider", "Terms & privacy"] },
  ];

  return (
    <footer
      className="mt-10 w-full border-t"
      style={{ backgroundColor: theme.secondaryBackground, borderTopColor: theme.border }}
    >
      <div
        className="mx-auto flex w-full flex-row gap-8 px-6 py-9"
        style={{ maxWidth: DESKTOP.maxWidth }}
      >
        <div className="flex flex-[1.4] flex-col gap-2.5">
          <p className="text-xl font-black tracking-tight" style={{ color: theme.text }}>Quick Bihar</p>
          <p className="text-[13px] leading-5" style={{ color: theme.secondaryText }}>
            {"Bihar's own fashion mall — sarees, kurtas, jeans & more with super-fast doorstep delivery."}
          </p>
          <div className="mt-1.5 self-start rounded-[10px] border px-3 py-2" style={{ borderColor: theme.border }}>
            <span className="text-xs font-semibold" style={{ color: theme.secondaryText }}>
              ✓ COD available  •  ✓ Easy returns  •  ✓ Local stores
            </span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex flex-1 flex-col gap-2">
            <p className="mb-1 text-[13px] font-extrabold tracking-wider uppercase" style={{ color: theme.text }}>{c.title}</p>
            {c.links.map((l) => (
              <span key={l} className="text-[13px] leading-[18px] font-medium" style={{ color: theme.secondaryText }}>
                {l}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t py-4 text-center" style={{ borderTopColor: theme.border }}>
        <span
          className="text-xs font-medium"
          style={{
            color:
              (theme as any)?.isDark ?? theme?.text === "#ffffff"
                ? "#a1a1a6"
                : "#636366",
          }}
        >
          © 2026 QuickBihar • Made for Bihar • Fastest fashion delivery
        </span>
      </div>
    </footer>
  );
};

export default DesktopFooter;
