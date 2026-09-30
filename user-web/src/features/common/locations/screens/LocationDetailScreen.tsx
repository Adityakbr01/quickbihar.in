/**
 * @file src/features/common/locations/screens/LocationDetailScreen.tsx
 * Web location landing page for Buxar district + blocks.
 *
 * Ported from mobile/app/locations/[...slug].tsx (Expo era) to user-web.
 * Static data only (no API) — same BUXAR constants, so prerender + client
 * render identical meta/content. All internal navigation uses <Link> so
 * crawlers see real anchors.
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

export default function LocationDetailScreen() {
  const theme = useTheme() as any;
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
      className="mx-auto w-full max-w-[880px] px-4 pb-16"
      style={{ backgroundColor: theme.background, color: theme.text }}
    >
      {/* Breadcrumb (visible + matches JSON-LD) */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 py-3 text-[12px]">
        <Link to="/" className="font-semibold text-indigo-600 underline">
          Home
        </Link>
        <span aria-hidden="true" style={{ color: theme.secondaryText }}>/</span>
        <Link
          to="/locations/bihar/buxar"
          className="font-semibold text-indigo-600 underline"
        >
          Buxar
        </Link>
        {location.slug !== "buxar" ? (
          <>
            <span aria-hidden="true" style={{ color: theme.secondaryText }}>/</span>
            <span style={{ color: theme.secondaryText }}>{location.name}</span>
          </>
        ) : null}
      </nav>

      {/* Hero — H1 must match prerender shell + meta title intent */}
      <section
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: theme.secondaryBackground || "#fff",
          borderColor: theme.border,
        }}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
            {location.subdivision}
          </span>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">
            {location.deliveryTime}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Online Fashion &amp; Clothes Delivery in {location.name}
        </h1>
        <p className="mt-2 text-[14px] leading-6" style={{ color: theme.secondaryText }}>
          {location.metaDescription}
        </p>
        <p className="mt-2 text-[14px] leading-6" style={{ color: theme.secondaryText }}>
          {location.name} में ऑनलाइन कपड़े मंगाना अब आसान — साड़ी, कुर्ती, जींस और
          किड्स वियर Cash on Delivery के साथ घर बैठे पाएं।
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/clothing/home"
            className="rounded-full bg-indigo-600 px-4 py-2 text-[13px] font-bold text-white"
          >
            Shop Trending Clothes in {location.name}
          </Link>
          <Link
            to="/top-selling"
            className="rounded-full border px-4 py-2 text-[13px] font-bold text-indigo-700"
            style={{ borderColor: theme.border }}
          >
            Top Selling in Bihar
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold">Popular Clothing Categories</h2>
        <p className="mt-0.5 text-[13px]" style={{ color: theme.secondaryText }}>
          Browse top-selling styles available for delivery in {location.name}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_LINKS.map((cat) => (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className="rounded-full border px-3.5 py-2 text-[13px] font-semibold text-indigo-700 underline"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.secondaryBackground || "#F8FAFC",
              }}
            >
              {cat.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Localities + PINs */}
      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold">
          Localities &amp; Neighborhoods We Serve
        </h2>
        <p className="mt-0.5 text-[13px]" style={{ color: theme.secondaryText }}>
          Doorstep clothes delivery across {location.name} — {pagePath}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {location.localities.map((loc) => (
            <li
              key={loc}
              className="rounded-full border px-3 py-1.5 text-[12px] font-medium"
              style={{ borderColor: theme.border, color: theme.secondaryText }}
            >
              {loc}
            </li>
          ))}
        </ul>
        <h3 className="mt-5 text-[16px] font-bold">PIN Codes Covered</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {location.pins.map((pin) => (
            <li
              key={pin}
              className="rounded-md bg-black/[0.04] px-2.5 py-1 text-[12px] font-bold"
            >
              PIN {pin}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px]" style={{ color: theme.secondaryText }}>
          Keywords: {location.keywords.slice(0, 6).join(", ")}
        </p>
      </section>

      {/* FAQ — visible, matches FAQPage JSON-LD */}
      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold">Frequently Asked Questions</h2>
        <p className="mt-0.5 text-[13px]" style={{ color: theme.secondaryText }}>
          Everything you need to know about clothes shopping in {location.name}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {location.faqs.map((faq, idx) => {
            const open = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border"
                style={{ borderColor: theme.border }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(open ? null : idx)}
                  aria-expanded={open}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <span className="text-[14px] font-bold">{faq.question}</span>
                  <span aria-hidden="true" style={{ color: theme.secondaryText }}>
                    {open ? "−" : "+"}
                  </span>
                </button>
                {open ? (
                  <p
                    className="px-4 pb-4 text-[13px] leading-6"
                    style={{ color: theme.secondaryText }}
                  >
                    {faq.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Other locations cluster — fixes orphan pages */}
      <section className="mt-6">
        <h2 className="text-[18px] font-extrabold">Other Areas in Buxar District</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_BUXAR_PAGES.filter((p) => p.slug !== location.slug).map((other) => {
            const target =
              other.slug === "buxar"
                ? "/locations/bihar/buxar"
                : `/locations/bihar/buxar/${other.slug}`;
            return (
              <Link
                key={other.slug}
                to={target}
                className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-indigo-700 underline"
              >
                {other.name}
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="mt-8 border-t pt-4 text-[12px]" style={{ borderTopColor: theme.border, color: theme.secondaryText }}>
        <p>
          © {new Date().getFullYear()} QuickBihar. Local Fashion, Clothing &amp; Daily
          Essentials with Fast Doorstep Delivery across Buxar, Bihar.{" "}
          <Link to="/malls" className="text-indigo-600 underline">
            Explore Bihar malls
          </Link>{" "}
          ·{" "}
          <Link to="/jewelery" className="text-indigo-600 underline">
            Jewellery
          </Link>
        </p>
      </footer>
    </main>
  );
}
