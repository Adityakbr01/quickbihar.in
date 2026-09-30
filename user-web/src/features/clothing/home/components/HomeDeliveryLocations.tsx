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
    <section
      className="mx-3 my-4 rounded-2xl border p-4"
      style={{ backgroundColor: theme.background, borderColor: theme.border }}
    >
      {/* Header */}
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2.5">
        <div className="min-w-[200px] flex-1">
          <div className="mb-1 flex flex-row items-center gap-1">
            <Zap size={13} color="#4F46E5" />
            <span className="text-[10px] font-extrabold tracking-[0.8px] text-indigo-600">INSTANT DELIVERY</span>
          </div>
          <h2 className="text-[17px] font-extrabold tracking-tight" style={{ color: theme.text }}>
            Fast Delivery in Buxar & Bihar
          </h2>
          <p className="mt-0.5 text-xs leading-4" style={{ color: theme.secondaryText }}>
            Order fashion & clothing online with doorstep delivery across 26+ PIN codes
          </p>
        </div>

        <Link
          to="/locations/bihar/buxar"
          aria-label="Explore Buxar District Delivery Hub"
          title="Explore Buxar District Delivery Hub"
          className="flex cursor-pointer flex-row items-center gap-1 self-start rounded-full bg-indigo-50 px-3 py-1.5"
        >
          <span className="text-xs font-bold text-indigo-600">All Buxar Hubs</span>
          <ArrowRight size={14} color="#4F46E5" />
        </Link>
      </div>

      {/* Town Grid Chips */}
      <div className="flex flex-row flex-wrap gap-2">
        {keyLocations.map((loc) => {
          const path = `/locations/bihar/buxar/${loc.slug}` as const;
          return (
            <Link
              key={loc.slug}
              to={path}
              aria-label={`Shop clothing & fashion in ${loc.name}, Buxar PIN ${loc.pin}`}
              title={`Fashion store in ${loc.name}`}
              className="w-[48%] cursor-pointer rounded-xl border p-2.5 text-left"
              style={{
                backgroundColor: theme.secondaryBackground || "#F8FAFC",
                borderColor: theme.border || "#E2E8F0",
              }}
            >
              <span className="mb-1 flex flex-row items-center gap-1.5">
                <MapPin size={14} color="#4F46E5" />
                <span className="block truncate text-[13px] font-bold" style={{ color: theme.text }}>
                  {loc.name}
                </span>
              </span>
              <span className="mt-0.5 flex flex-row items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: theme.secondaryText }}>
                  PIN {loc.pin}
                </span>
                <span className="rounded bg-green-100 px-1.5 py-px text-[10px] font-bold text-green-700">{loc.timing}</span>
              </span>
            </Link>
          );
        })}
      </div>

      {/* SEO Natural Text & All 11 Blocks Links */}
      <div className="mt-3.5 border-t pt-2.5" style={{ borderTopColor: theme.border || "#F1F5F9" }}>
        <p className="mb-1 text-[11px] leading-[18px]" style={{ color: theme.secondaryText }}>
          Serving Buxar Sadar & Dumraon Subdivisions:{" "}
        </p>
        <div className="flex flex-row flex-wrap items-center gap-1">
          {BUXAR_BLOCKS.map((b: BuxarLocation, idx: number) => {
            const blockPath = `/locations/bihar/buxar/${b.slug}` as const;
            return (
              <React.Fragment key={b.slug}>
                <Link
                  to={blockPath}
                  aria-label={`Delivery in ${b.name}`}
                  title={`Delivery in ${b.name}`}
                  className="cursor-pointer py-0.5 text-[11px] font-semibold text-indigo-600 underline"
                >
                  {b.name}
                </Link>
                {idx < BUXAR_BLOCKS.length - 1 && (
                  <span className="mx-0.5 text-[11px]" style={{ color: theme.secondaryText }}>•</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HomeDeliveryLocations;
