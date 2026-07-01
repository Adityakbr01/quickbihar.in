import Link from "next/link";
import { ArrowRight, Sparkles, Star, Zap } from "lucide-react";

/**
 * Hero.tsx
 * Landing hero for the QuickBihar homepage — headline, primary CTAs,
 * ambient glow/grid backdrop, and a lightweight trust strip.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid mask-fade-edges" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px] animate-float-glow" />
      <div className="pointer-events-none absolute right-[10%] top-40 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6 lg:px-8 lg:py-36">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
          <Sparkles className="h-3.5 w-3.5" />
          Now live across 20+ districts in Bihar
        </span>

        <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
          Bihar&apos;s{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Fastest Growing
          </span>{" "}
          E-Commerce Platform
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Empowering local sellers, delighting customers. Shop from thousands of
          products with lightning-fast delivery — built for Bihar, powered by its
          people.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/seller/register"
            className="group inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/30"
          >
            Start Selling Today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <Zap className="h-4 w-4 text-cyan-400" />
            Explore Features
          </Link>
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-col items-center gap-3 text-sm text-gray-500 sm:flex-row sm:gap-6">
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <span className="text-gray-400">4.8/5</span>
            <span>from 2,000+ reviews</span>
          </div>
          <span className="hidden h-4 w-px bg-white/10 sm:block" />
          <span>Trusted by 500+ local sellers</span>
        </div>
      </div>
    </section>
  );
}
