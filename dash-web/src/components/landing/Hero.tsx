import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  QrCode,
  Truck,
  ShieldCheck,
  RotateCcw,
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
    <section className="relative overflow-hidden pt-8 pb-20 lg:pb-28 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Value Proposition & CTAs */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-card-foreground shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{hero.pillBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.1]">
              {hero.headlinePart1} <br className="hidden sm:block" />
              <span className="text-primary">{hero.headlineHighlight}</span> {hero.headlinePart2}
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {/* Google Play Button */}
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg bg-primary px-6 py-3.5 text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186c-.368-.382-.61-.954-.61-1.686V3.5c0-.732.242-1.304.609-1.686zM15.207 13.414l2.586 2.586-12.793 7.38a1.986 1.986 0 01-1.12.336l11.327-10.302zm0-2.828L3.88 0.286A1.986 1.986 0 015 0.622l12.793 7.378-2.586 2.586zm1.414 1.414l3.771-2.176c1.066-.615 1.066-1.619 0-2.234l-3.771-2.176-2.828 2.828 2.828 2.828z" />
                </svg>
                <div className="text-left">
                  <div className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
                    {hero.ctaPlayStore.subText}
                  </div>
                  <div className="text-base font-bold leading-none">
                    {hero.ctaPlayStore.mainText}
                  </div>
                </div>
              </a>

              {/* QR Code Anchor */}
              <a
                href="#download-app"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3.5 text-sm font-semibold text-card-foreground shadow-xs transition-colors hover:bg-muted"
              >
                <QrCode className="h-4 w-4 text-primary" />
                <span>{hero.ctaQrText}</span>
              </a>
            </div>

            {/* Quick Partner Links */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground lg:justify-start">
              <span>Partner with us:</span>
              <Link
                href={hero.partnerLinks.sellerHref}
                className="font-medium text-primary hover:underline"
              >
                {hero.partnerLinks.sellerText}
              </Link>
              <span>•</span>
              <Link
                href={hero.partnerLinks.riderHref}
                className="font-medium text-foreground hover:underline"
              >
                {hero.partnerLinks.riderText}
              </Link>
            </div>

            {/* Trust Points */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 text-left w-full max-w-lg">
              {hero.trustPoints.map((tp) => {
                const Icon = trustIcons[tp.icon] || Truck;
                return (
                  <div key={tp.title} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground text-xs block">{tp.title}</span>
                      <span className="text-[11px] text-muted-foreground">{tp.subtitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Realistic Smartphone Mockup with Real App Screenshot inside */}
          <div className="relative flex justify-center lg:col-span-5">
            <div className="relative w-full max-w-[270px] sm:max-w-[295px]">
              
              {/* Ambient Glow behind phone */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-transparent to-amber-500/25 rounded-[55px] blur-2xl -z-10 opacity-70" />

              {/* Smartphone Chassis Frame */}
              <div className="relative mx-auto bg-[#181A20] rounded-[46px] sm:rounded-[50px] p-[10px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.12),0_0_35px_rgba(234,179,8,0.12)] select-none">
                
                {/* Physical Buttons - Left Side */}
                <div className="absolute -left-[3px] top-[70px] w-[3px] h-6 bg-zinc-600 rounded-l-xs" />
                <div className="absolute -left-[3px] top-[106px] w-[3px] h-10 bg-zinc-600 rounded-l-xs" />
                <div className="absolute -left-[3px] top-[156px] w-[3px] h-10 bg-zinc-600 rounded-l-xs" />
                
                {/* Physical Button - Right Side (Power) */}
                <div className="absolute -right-[3px] top-[118px] w-[3px] h-14 bg-zinc-600 rounded-r-xs" />

                {/* Inner Screen Bezel */}
                <div className="relative rounded-[36px] sm:rounded-[40px] overflow-hidden bg-black ring-1 ring-white/10 shadow-inner">
                  
                  {/* Status Bar */}
                  <div className="relative z-30 w-full pt-2.5 pb-1 px-4 flex items-center justify-between bg-black text-white text-[10.5px] font-semibold tracking-tight">
                    {/* Time */}
                    <span className="font-medium text-white/90">{hero.phoneMockup.time}</span>

                    {/* Dynamic Island Notch */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-2 h-[15px] w-[68px] bg-[#0c0d10] rounded-full flex items-center justify-end px-2 gap-1.5 ring-1 ring-white/10 shadow-inner">
                      <div className="w-2 h-2 rounded-full bg-[#080d16] ring-1 ring-blue-500/25" />
                      <div className="w-1 h-1 rounded-full bg-[#181818]" />
                    </div>

                    {/* Status Icons */}
                    <div className="flex items-center gap-1.5 text-white/90">
                      {/* Cellular Bars */}
                      <svg className="w-3 h-2.5" viewBox="0 0 17 12" fill="currentColor">
                        <rect x="0" y="9" width="2.5" height="3" rx="0.5" />
                        <rect x="4" y="6" width="2.5" height="6" rx="0.5" />
                        <rect x="8" y="3" width="2.5" height="9" rx="0.5" />
                        <rect x="12" y="0" width="2.5" height="12" rx="0.5" />
                      </svg>
                      {/* 5G Badge */}
                      <span className="text-[8.5px] font-bold tracking-tighter">5G</span>
                      {/* Battery */}
                      <svg className="w-3.5 h-2.5" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="0.5" y="0.5" width="18" height="10" rx="2" stroke="currentColor" />
                        <rect x="2" y="2" width="13" height="7" rx="1" fill="currentColor" />
                        <path d="M20 3.5V7.5" stroke="currentColor" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>

                  {/* App Screen Content */}
                  <div className="relative">
                    <Image
                      src="/images/app-screen-clean.webp"
                      alt="QuickBihar Mobile App"
                      width={581}
                      height={1212}
                      className="w-full h-auto block select-none"
                      priority
                    />

                    {/* Glass Reflection Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.07]" />
                  </div>

                  {/* Home Indicator Bar */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/40 rounded-full z-30" />
                </div>

              </div>

              {/* Floating Trust Badge */}
              <div className="absolute -bottom-2 -left-3 z-30 hidden sm:flex items-center gap-2.5 rounded-xl border border-border bg-card/95 backdrop-blur-md p-2.5 shadow-xl">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
                  {hero.phoneMockup.rating}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-card-foreground">{hero.phoneMockup.ratingTitle}</div>
                  <div className="text-[10px] text-muted-foreground">{hero.phoneMockup.ratingSubtitle}</div>
                </div>
              </div>

              {/* Floating Express Tag */}
              <div className="absolute -top-3 -right-2 z-30 hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-card/95 backdrop-blur-md px-3 py-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
