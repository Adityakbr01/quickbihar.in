import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Truck, Zap, Clock } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BUXAR_BLOCKS, type BuxarLocation } from "@/src/constants/locations/buxar";

/**
 * HomeDeliveryLocations — Instant Delivery hub section.
 *
 * Fully theme-aware: every color, border, shadow and background is derived
 * from the active theme (light/dark). No hardcoded hex values.
 *
 * Renders:
 *  1. A hero header with delivery promise badge + "All Buxar Hubs" CTA.
 *  2. A responsive grid of priority town chips (Buxar City, Dumraon, ...).
 *  3. An SEO-friendly block-link list for all 11 Buxar blocks.
 */
export const HomeDeliveryLocations: React.FC = () => {
  const theme = useTheme();

  // Delivery timing variants mapped to theme-aware badge styles.
  const timingBadgeStyle = (timing: string) => {
    const isExpress = timing.includes("60") || timing.includes("120");
    return {
      bg: isExpress ? `${theme.success}18` : `${theme.primary}18`,
      color: isExpress ? theme.success : theme.primary,
    };
  };

  // Priority towns for quick-chips (delivery promise cards).
  const keyLocations = [
    { name: "Buxar City", slug: "buxar-city", pin: "802101", timing: "60-120 min" },
    { name: "Dumraon", slug: "dumraon", pin: "802119", timing: "60-120 min" },
    { name: "Chausa", slug: "chausa", pin: "802114", timing: "Same Day" },
    { name: "Itarhi", slug: "itarhi", pin: "802123", timing: "Same Day" },
    { name: "Rajpur", slug: "rajpur", pin: "802113", timing: "Same Day" },
    { name: "Brahampur", slug: "brahampur", pin: "802112", timing: "Same Day" },
    { name: "Nawanagar", slug: "nawanagar", pin: "802129", timing: "Same Day" },
    { name: "Simri", slug: "simri", pin: "802118", timing: "Same Day" },
  ];

  return (
    <section
      className="w-full max-w-[1280px] mx-auto px-4 md:px-6 my-8 md:my-10"
      style={{ backgroundColor: "transparent" }}
    >
      {/* Hero header */}
      <div
        className="rounded-3xl border p-6 md:p-8 shadow-sm transition-shadow hover:shadow-lg"
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.border,
        }}
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-[200px] flex-1">
            {/* Delivery promise badge */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-[0.8px] transition-all"
                style={{
                  backgroundColor: `${theme.primary}18`,
                  borderColor: `${theme.primary}44`,
                  color: theme.primary,
                }}
              >
                <Zap size={12} color={theme.primary} />
                INSTANT DELIVERY
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-[0.8px] transition-all"
                style={{
                  backgroundColor: `${theme.success}18`,
                  borderColor: `${theme.success}44`,
                  color: theme.success,
                }}
              >
                <Truck size={12} color={theme.success} />
                Cash on Delivery
              </div>
            </div>
            <h2
              className="text-[20px] md:text-2xl font-black tracking-tight leading-tight"
              style={{ color: theme.text }}
            >
              Fast Delivery in Buxar &amp; Bihar
            </h2>
            <p
              className="mt-2 text-xs md:text-sm leading-6 font-medium"
              style={{ color: theme.secondaryText }}
            >
              Order fashion &amp; clothing online with doorstep delivery across
              26+ PIN codes in Buxar district.
            </p>
          </div>

          <Link
            to="/locations/bihar/buxar"
            aria-label="Explore all Buxar District delivery hubs"
            title="Explore Buxar District Delivery Hub"
            className="flex cursor-pointer flex-row items-center gap-1.5 self-start rounded-full border px-4 py-2 text-xs font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.primary}33`,
              color: theme.primary,
            }}
          >
            <span>All Buxar Hubs</span>
            <ArrowRight size={14} color={theme.primary} />
          </Link>
        </div>

        {/* Town Grid Chips - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {keyLocations.map((loc) => {
            const path = `/locations/bihar/buxar/${loc.slug}` as const;
            const badge = timingBadgeStyle(loc.timing);
            return (
              <Link
                key={loc.slug}
                to={path}
                aria-label={`Shop clothing & fashion in ${loc.name}, Buxar PIN ${loc.pin}`}
                title={`Fashion store in ${loc.name}`}
                className="group flex flex-col justify-between cursor-pointer rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  outlineColor: theme.primary,
                }}
              >
                <div className="mb-3 flex flex-row items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <MapPin size={16} color={theme.primary} />
                  </div>
                  <span
                    className="block truncate text-[13px] md:text-sm font-bold group-hover:underline"
                    style={{ color: theme.text }}
                  >
                    {loc.name}
                  </span>
                </div>
                <div className="mt-auto flex flex-row items-center justify-between gap-1 border-t pt-3">
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: theme.secondaryText }}
                  >
                    PIN {loc.pin}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {loc.timing}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* SEO Natural Text & All 11 Blocks Links */}
        <div className="mt-8 border-t pt-6" style={{ borderTopColor: theme.border }}>
          <p className="mb-2 text-[11px] md:text-xs font-semibold tracking-wide">
            Serving Buxar Sadar &amp; Dumraon Subdivisions:
          </p>
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            {BUXAR_BLOCKS.map((b: BuxarLocation, idx: number) => {
              const blockPath = `/locations/bihar/buxar/${b.slug}` as const;
              return (
                <React.Fragment key={b.slug}>
                  <Link
                    to={blockPath}
                    aria-label={`Delivery in ${b.name}`}
                    title={`Delivery in ${b.name}`}
                    className="cursor-pointer rounded-md px-2 py-0.5 text-[11px] md:text-xs font-semibold transition-all hover:opacity-80 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary"
                    style={{
                      color: theme.primary,
                    }}
                  >
                    {b.name}
                  </Link>
                  {idx < BUXAR_BLOCKS.length - 1 && (
                    <span
                      className="text-[11px] mx-0.5"
                      style={{ color: theme.secondaryText }}
                    >
                      •
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeDeliveryLocations;
