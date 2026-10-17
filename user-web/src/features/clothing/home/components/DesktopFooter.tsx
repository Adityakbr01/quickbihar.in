import React from "react";
import { Link } from "react-router-dom";
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

  const cols: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: "Shop",
      links: [
        { label: "Sarees & Ethnic", href: "/category/sarees" },
        { label: "Kurtis & Suits", href: "/category/kurtis-suits" },
        { label: "Men's Wear", href: "/category/mens-wear" },
        { label: "Women's Wear", href: "/category/womens-wear" },
        { label: "Top Selling", href: "/top-selling" },
      ],
    },
    {
      title: "Buxar & Dumraon Hubs",
      links: [
        { label: "Buxar District Hub", href: "/locations/bihar/buxar" },
        { label: "Dumraon (802119)", href: "/locations/bihar/buxar/dumraon" },
        { label: "Buxar City (802101)", href: "/locations/bihar/buxar/buxar-city" },
        { label: "Chausa Delivery", href: "/locations/bihar/buxar/chausa" },
        { label: "Brahampur Delivery", href: "/locations/bihar/buxar/brahampur" },
      ],
    },
    {
      title: "Explore",
      links: [
        { label: "Shopping Malls", href: "/malls" },
        { label: "Jewellery Store", href: "/jewelery" },
        { label: "Jewellery Collections", href: "/jewelery/collections" },
        { label: "Food Delivery", href: "/food" },
      ],
    },
    {
      title: "QuickBihar",
      links: [
        { label: "Home", href: "/" },
        { label: "All Buxar Locations", href: "/locations/bihar/buxar" },
        { label: "My Account", href: "/account" },
        { label: "My Orders", href: "/account/orders" },
      ],
    },
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
            {"Bihar's own fashion mall — sarees, kurtas, jeans & more with super-fast doorstep delivery across Buxar & Dumraon."}
          </p>
          <div className="mt-1.5 self-start rounded-[10px] border px-3 py-2" style={{ borderColor: theme.border }}>
            <span className="text-xs font-semibold" style={{ color: theme.secondaryText }}>
              ✓ COD available  •  ✓ Easy returns  •  ✓ 60–120 min delivery
            </span>
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="flex flex-1 flex-col gap-2">
            <p className="mb-1 text-[13px] font-extrabold tracking-wider uppercase" style={{ color: theme.text }}>{c.title}</p>
            {c.links.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="text-[13px] leading-[18px] font-medium hover:underline"
                style={{ color: theme.secondaryText }}
              >
                {l.label}
              </Link>
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
