import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Zap } from "lucide-react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BUXAR_BLOCKS, type BuxarLocation } from "@/src/constants/locations/buxar";

export const HomeDeliveryLocations: React.FC = () => {
  const theme = useTheme();

  // Priority towns for quick-chips
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
    <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 my-6">
      <section
        className="rounded-2xl md:rounded-3xl border p-5 md:p-7 shadow-sm transition-shadow hover:shadow-md"
        style={{
          backgroundColor: theme.tertiaryBackground,
          borderColor: theme.border,
        }}
      >
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-[200px] flex-1">
            <div className="mb-2 flex flex-row items-center gap-1.5">
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.8px]"
                style={{
                  backgroundColor: `${theme.primary}18`,
                  color: theme.primary,
                }}
              >
                <Zap size={13} color={theme.primary} />
                INSTANT DELIVERY
              </span>
            </div>
            <h2
              className="text-[19px] md:text-2xl font-black tracking-tight"
              style={{ color: theme.text }}
            >
              Fast Delivery in Buxar & Bihar
            </h2>
            <p
              className="mt-1 text-xs md:text-sm leading-5 font-medium"
              style={{ color: theme.secondaryText }}
            >
              Order fashion & clothing online with doorstep delivery across 26+ PIN codes
            </p>
          </div>

          <Link
            to="/locations/bihar/buxar"
            aria-label="Explore Buxar District Delivery Hub"
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
            return (
              <Link
                key={loc.slug}
                to={path}
                aria-label={`Shop clothing & fashion in ${loc.name}, Buxar PIN ${loc.pin}`}
                title={`Fashion store in ${loc.name}`}
                className="group flex flex-col justify-between cursor-pointer rounded-xl border p-3.5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]"
                style={{
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }}
              >
                <span className="mb-2.5 flex flex-row items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${theme.primary}15` }}
                  >
                    <MapPin size={15} color={theme.primary} />
                  </span>
                  <span
                    className="block truncate text-[13px] md:text-sm font-bold group-hover:underline"
                    style={{ color: theme.text }}
                  >
                    {loc.name}
                  </span>
                </span>
                <span className="mt-auto flex flex-row items-center justify-between gap-1 border-t pt-2" style={{ borderTopColor: theme.border }}>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: theme.secondaryText }}
                  >
                    PIN {loc.pin}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide"
                    style={{
                      backgroundColor: `${theme.success}18`,
                      color: theme.success,
                    }}
                  >
                    {loc.timing}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* SEO Natural Text & All 11 Blocks Links */}
        <div
          className="mt-5 border-t pt-4"
          style={{ borderTopColor: theme.border }}
        >
          <p
            className="mb-1.5 text-[11px] md:text-xs font-semibold"
            style={{ color: theme.secondaryText }}
          >
            Serving Buxar Sadar & Dumraon Subdivisions:{" "}
          </p>
          <div className="flex flex-row flex-wrap items-center gap-2">
            {BUXAR_BLOCKS.map((b: BuxarLocation, idx: number) => {
              const blockPath = `/locations/bihar/buxar/${b.slug}` as const;
              return (
                <React.Fragment key={b.slug}>
                  <Link
                    to={blockPath}
                    aria-label={`Delivery in ${b.name}`}
                    title={`Delivery in ${b.name}`}
                    className="cursor-pointer rounded-md px-1.5 py-0.5 text-[11px] md:text-xs font-semibold transition-colors hover:underline"
                    style={{ color: theme.primary }}
                  >
                    {b.name}
                  </Link>
                  {idx < BUXAR_BLOCKS.length - 1 && (
                    <span
                      className="text-[11px]"
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
      </section>
    </div>
  );
};

export default HomeDeliveryLocations;
