/**
 * @file src/features/common/locations/screens/LocationDetailScreen.tsx
 * Web location landing page for Buxar district + blocks.
 *
 * Ported from mobile/app/locations/[...slug].tsx (Expo era) to user-web.
 * Static data only (no API) — same BUXAR constants, so prerender + client
 * render identical meta/content. All internal navigation uses <Link> so
 * crawlers see real anchors.
 *
 * Fully theme-aware: every color, border, background and shadow is derived
 * from the active theme (light/dark). No hardcoded indigo/green hex values.
 */

import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
  ALL_BUXAR_PAGES,
  BUXAR_DISTRICT_HUB,
} from "@/src/constants/locations/buxar";

const CATEGORY_LINKS = [
  { title: "Sarees & Ethnic", slug: "sarees" },
  { title: "Kurtis & Suits", slug: "kurtis-suits" },
  { title: "Men's Wear", slug: "mens-wear" },
  { title: "Jeans & Trousers", slug: "jeans" },
  { title: "Kids & Infant Wear", slug: "kids-wear" },
  { title: "Women's Wear", slug: "womens-wear" },
];

// Delivery-time badge style helper — theme-aware.
const deliveryBadgeStyle = (theme: any, timing: string) => {
  const isExpress = timing.includes("60") || timing.includes("120");
  return {
    bg: isExpress ? `${theme.success}18` : `${theme.primary}18`,
    color: isExpress ? theme.success : theme.primary,
  };
};

export default function LocationDetailScreen() {
  const theme = useTheme();
  const { slug } = useParams<{ slug?: string }>();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const location =
    ALL_BUXAR_PAGES.find((loc) => loc.slug === (slug || "buxar")) ||
    BUXAR_DISTRICT_HUB;

  const pagePath =
    location.slug === "buxar"
      ? "/locations/bihar/buxar"
      : `/locations/bihar/buxar/${location.slug}`;

  return (
    <main
      className="mx-auto w-full max-w-[880px] px-4 md:px-6 pb-16"
      style={{
        backgroundColor: theme.background,
        color: theme.text,
      }}
    >
      {/* Breadcrumb (visible + matches JSON-LD) */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 py-4 text-[12px]">
        <Link
          to="/"
          className="font-semibold underline transition-colors"
          style={{ color: theme.primary }}
        >
          Home
        </Link>
        <span aria-hidden="true" style={{ color: theme.secondaryText }}>/</span>
        <Link
          to="/locations/bihar/buxar"
          className="font-semibold underline transition-colors"
          style={{ color: theme.primary }}
        >
          Buxar
        </Link>
        {location.slug !== "buxar" ? (
          <>
            <span aria-hidden="true" style={{ color: theme.secondaryText }}>/</span>
            <span style={{ color: theme.text }}>{location.name}</span>
          </>
        ) : null}
      </nav>

      {/* Hero — H1 must match prerender shell + meta title intent */}
      <section
        className="rounded-3xl border p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md"
        style={{
          backgroundColor: theme.secondaryBackground,
          borderColor: theme.border,
        }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition-colors"
            style={{
              backgroundColor: `${theme.primary}18`,
              borderColor: `${theme.primary}44`,
              color: theme.primary,
            }}
          >
            {location.subdivision}
          </span>
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition-colors"
            style={{
              backgroundColor: deliveryBadgeStyle(theme, location.deliveryTime).bg,
              color: deliveryBadgeStyle(theme, location.deliveryTime).color,
            }}
          >
            {location.deliveryTime}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
          Online Fashion &amp; Clothes Delivery in {location.name}
        </h1>
        <p className="mt-3 text-[14px] md:text-sm leading-6" style={{ color: theme.secondaryText }}>
          {location.metaDescription}
        </p>
        <p className="mt-2 text-[14px] md:text-sm leading-6" style={{ color: theme.secondaryText }}>
          {location.name} में ऑनलाइन कपड़े मंगाना अब आसान — साड़ी, कुर्ती, जींस और
          किड्स वियर Cash on Delivery के साथ घर बैठे पाएं।
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/clothing/home"
            className="rounded-full border px-4 py-2 text-[13px] font-bold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.primary,
              color: "#ffffff",
            }}
          >
            Shop Trending Clothes in {location.name}
          </Link>
          <Link
            to="/top-selling"
            className="rounded-full border px-4 py-2 text-[13px] font-bold transition-colors hover:opacity-90"
            style={{
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            Top Selling in Bihar
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight">
            Popular Clothing Categories
          </h2>
          <p className="text-[13px]" style={{ color: theme.secondaryText }}>
            Browse top-selling styles for delivery in {location.name}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.secondaryBackground,
                color: theme.text,
              }}
            >
              {cat.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Localities + PINs */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight">
            Localities &amp; Neighborhoods We Serve
          </h2>
          <p className="text-[13px]" style={{ color: theme.secondaryText }}>
            Doorstep clothes delivery across {location.name}
          </p>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {location.localities.map((loc) => (
            <li
              key={loc}
              className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors hover:opacity-80"
              style={{
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.secondaryBackground,
              }}
            >
              {loc}
            </li>
          ))}
        </ul>
        <h3 className="mt-6 text-[16px] font-bold tracking-tight">
          PIN Codes Covered
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {location.pins.map((pin) => (
            <li
              key={pin}
              className="rounded-md border px-2.5 py-1 text-[12px] font-bold transition-colors hover:opacity-90"
              style={{
                borderColor: theme.border,
                color: theme.text,
                backgroundColor: theme.secondaryBackground,
              }}
            >
              PIN {pin}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px]" style={{ color: theme.secondaryText }}>
          Keywords: {location.keywords.slice(0, 6).join(", ")}
        </p>
      </section>

      {/* FAQ — visible, matches FAQPage JSON-LD */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-[13px]" style={{ color: theme.secondaryText }}>
            Everything you need to know about clothes shopping in {location.name}
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-1.5">
          {location.faqs.map((faq, idx) => {
            const open = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border transition-shadow hover:shadow-sm"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.secondaryBackground,
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  style={{
                    backgroundColor: theme.secondaryBackground,
                    outlineColor: theme.primary,
                  }}
                >
                  <span className="text-[14px] font-bold">{faq.question}</span>
                  <span aria-hidden="true" style={{ color: theme.secondaryText }}>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? (
                  <p className="px-4 pb-4 text-[13px] leading-6" style={{ color: theme.secondaryText }}>
                    {faq.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Other locations cluster — fixes orphan pages */}
      <section className="mt-8">
        <h2 className="text-[18px] font-extrabold tracking-tight mb-3">
          Other Areas in Buxar District
        </h2>
        <div className="flex flex-wrap gap-2">
          {ALL_BUXAR_PAGES.filter((p) => p.slug !== location.slug).map((other) => {
            const target =
              other.slug === "buxar"
                ? "/locations/bihar/buxar"
                : `/locations/bihar/buxar/${other.slug}`;
            return (
              <Link
                key={other.slug}
                to={target}
                className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all hover:opacity-90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.secondaryBackground,
                  color: theme.text,
                }}
              >
                {other.name}
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="mt-10 border-t pt-6 text-[12px]" style={{ borderTopColor: theme.border, color: theme.secondaryText }}>
        <p>
          © {new Date().getFullYear()} QuickBihar. Local Fashion, Clothing &amp;
          Daily Essentials with Fast Doorstep Delivery across Buxar, Bihar.
          <Link
            to="/malls"
            className="underline transition-colors hover:opacity-80"
            style={{ color: theme.primary }}
          >
            Explore Bihar malls
          </Link>
          &nbsp;·&nbsp;
          <Link
            to="/jewelery"
            className="underline transition-colors hover:opacity-80"
            style={{ color: theme.primary }}
          >
            Jewellery
          </Link>
        </p>
      </footer>
    </main>
  );
}
