import { Link } from "react-router-dom";
import {
  Sparkles,
  QrCode,
  Truck,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

const trustIcons: Record<string, typeof Truck> = {
  Truck,
  RotateCcw,
  ShieldCheck,
};

export default function Hero() {
  const { hero } = landingData;

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Warm ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-96 w-[60rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-40 -left-40 h-80 w-80 rounded-full bg-tertiary/10 blur-3xl" />
        <div className="absolute top-64 -right-32 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8 lg:pt-16 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">

          {/* Left Column: Value Proposition & CTAs */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 text-xs font-medium text-card-foreground shadow-xs">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-on-primary">
                New
              </span>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{hero.pillBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              {hero.headlinePart1}{" "}
              <span className="font-serif-accent font-normal text-primary italic">
                {hero.headlineHighlight}
              </span>{" "}
              {hero.headlinePart2}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {/* Google Play Button */}
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-foreground px-6 py-3 text-background shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.368-.382-.61-.954-.61-1.686V3.5c0-.732.242-1.304.609-1.686zM15.207 13.414l2.586 2.586-12.793 7.38a1.986 1.986 0 01-1.12.336l11.327-10.302zm0-2.828L3.88 0.286A1.986 1.986 0 015 0.622l12.793 7.378-2.586 2.586zm1.414 1.414l3.771-2.176c1.066-.615 1.066-1.619 0-2.234l-3.771-2.176-2.828 2.828 2.828 2.828z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-medium tracking-wider uppercase opacity-70">
                    {hero.ctaPlayStore.subText}
                  </div>
                  <div className="text-base leading-tight font-bold">
                    {hero.ctaPlayStore.mainText}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>

              {/* QR Code Anchor */}
              <a
                href="#download-app"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold text-card-foreground shadow-xs transition-colors hover:bg-muted"
              >
                <QrCode className="h-4 w-4 text-primary" />
                <span>{hero.ctaQrText}</span>
              </a>
            </div>

            {/* Quick Partner Links */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:justify-start">
              <span>Partner with us:</span>
              <Link
                to={hero.partnerLinks.sellerHref}
                className="font-semibold text-primary hover:underline"
              >
                {hero.partnerLinks.sellerText}
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                to={hero.partnerLinks.riderHref}
                className="font-semibold text-foreground hover:underline"
              >
                {hero.partnerLinks.riderText}
              </Link>
            </div>

            {/* Trust Points */}
            <dl className="mt-10 grid w-full max-w-lg grid-cols-3 gap-4 border-t border-border pt-6 text-left">
              {hero.trustPoints.map((tp) => {
                const Icon = trustIcons[tp.icon] || Truck;
                return (
                  <div key={tp.title} className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <dt className="block truncate text-xs font-bold text-foreground">{tp.title}</dt>
                      <dd className="truncate text-[11px] text-muted-foreground">{tp.subtitle}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>

          </div>

          {/* Right Column: Realistic Smartphone Mockup with Real App Screenshot inside */}
          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[270px] sm:max-w-[295px]">

              {/* Ambient Glow behind phone */}
              <div className="absolute -inset-6 rounded-[60px] bg-gradient-to-tr from-primary/25 via-tertiary/15 to-secondary/20 opacity-80 blur-2xl" aria-hidden="true" />

              {/* Smartphone Chassis Frame */}
              <div className="relative mx-auto rounded-[46px] bg-[#181A20] p-[10px] shadow-lg ring-1 ring-border select-none sm:rounded-[50px]">

                {/* Physical Buttons - Left Side */}
                <div className="absolute top-[70px] -left-[3px] h-6 w-[3px] rounded-l-xs bg-zinc-600" />
                <div className="absolute top-[106px] -left-[3px] h-10 w-[3px] rounded-l-xs bg-zinc-600" />
                <div className="absolute top-[156px] -left-[3px] h-10 w-[3px] rounded-l-xs bg-zinc-600" />

                {/* Physical Button - Right Side (Power) */}
                <div className="absolute top-[118px] -right-[3px] h-14 w-[3px] rounded-r-xs bg-zinc-600" />

                {/* Inner Screen Bezel */}
                <div className="relative overflow-hidden rounded-[36px] bg-black shadow-inner ring-1 ring-white/10 sm:rounded-[40px]">

                  {/* Status Bar */}
                  <div className="relative z-30 flex w-full items-center justify-between bg-black px-4 pt-2.5 pb-1 text-[10.5px] font-semibold tracking-tight text-white">
                    {/* Time */}
                    <span className="font-medium text-white/90">{hero.phoneMockup.time}</span>

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-2 left-1/2 flex h-[15px] w-[68px] -translate-x-1/2 items-center justify-end gap-1.5 rounded-full bg-[#0c0d10] px-2 shadow-inner ring-1 ring-white/10">
                      <div className="h-2 w-2 rounded-full bg-[#080d16] ring-1 ring-blue-500/25" />
                      <div className="h-1 w-1 rounded-full bg-[#181818]" />
                    </div>

                    {/* Status Icons */}
                    <div className="flex items-center gap-1.5 text-white/90">
                      {/* Cellular Bars */}
                      <svg className="h-2.5 w-3" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
                        <rect x="0" y="9" width="2.5" height="3" rx="0.5" />
                        <rect x="4" y="6" width="2.5" height="6" rx="0.5" />
                        <rect x="8" y="3" width="2.5" height="9" rx="0.5" />
                        <rect x="12" y="0" width="2.5" height="12" rx="0.5" />
                      </svg>
                      {/* 5G Badge */}
                      <span className="text-[8.5px] font-bold tracking-tighter">5G</span>
                      {/* Battery */}
                      <svg className="h-2.5 w-3.5" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                        <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" />
                        <rect x="2" y="2" width="13" height="7" rx="1" fill="currentColor" />
                        <path d="M20 3.5V7.5" stroke="currentColor" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="relative">
                    <img
                      src="/images/app-screen-clean.webp"
                      alt="QuickBihar Mobile App"
                      width={581}
                      height={1212}
                      className="block h-auto w-full select-none"
                    />

                    {/* Glass Reflection Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07]" />
                  </div>

                  {/* Home Indicator Bar */}
                  <div className="absolute bottom-1 left-1/2 z-30 h-1 w-20 -translate-x-1/2 rounded-full bg-white/40" />
                </div>

              </div>

              {/* Floating Trust Badge */}
              <div className="absolute -bottom-2 -left-3 z-30 hidden items-center gap-2.5 rounded-2xl border border-border bg-card/95 p-2.5 pr-4 shadow-lg backdrop-blur-md sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-on-primary shadow-xs">
                  {hero.phoneMockup.rating}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-card-foreground">{hero.phoneMockup.ratingTitle}</div>
                  <div className="text-[10px] text-muted-foreground">{hero.phoneMockup.ratingSubtitle}</div>
                </div>
              </div>

              {/* Floating Express Tag */}
              <div className="absolute -top-3 -right-2 z-30 hidden items-center gap-1.5 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg backdrop-blur-md sm:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-card-foreground">{hero.phoneMockup.badgeExpress}</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
