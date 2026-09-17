import { Link } from "react-router-dom";
import { Mail, Phone, Smartphone, Store, Bike, ArrowRight } from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

export default function CTA() {
  const { cta } = landingData;

  return (
    <section id="contact" className="relative scroll-mt-16 border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Bold brand panel */}
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-on-primary shadow-lg sm:px-12 sm:py-16">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-20 -bottom-28 h-80 w-80 rounded-full bg-black/10 blur-2xl" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "22px 22px" }}
            aria-hidden="true"
          />

          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
              </span>
              <span>{cta.badge}</span>
            </span>

            <h2 className="mx-auto mt-4 max-w-3xl font-display text-2xl font-bold tracking-tight text-balance text-on-primary sm:text-4xl">
              {cta.title}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed opacity-85 sm:text-sm">
              {cta.subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {/* Play Store CTA */}
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-3 text-xs font-bold text-stone-900 shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Smartphone className="h-4 w-4" />
                <span>{cta.playStoreButtonText}</span>
              </a>

              {/* Partner Links */}
              <Link
                to="/seller/register"
                className="group inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-semibold transition-colors hover:bg-white/10"
              >
                <Store className="h-4 w-4" />
                <span>{cta.sellerButtonText}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                to="/delivery/register"
                className="group inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-semibold transition-colors hover:bg-white/10"
              >
                <Bike className="h-4 w-4" />
                <span>{cta.riderButtonText}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Contact Details */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 border-t border-white/20 pt-6 text-xs sm:flex-row sm:gap-6">
              <a
                href={`mailto:${APP_LINKS.SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100"
              >
                <Mail className="h-3.5 w-3.5" />
                {APP_LINKS.SUPPORT_EMAIL}
              </a>
              <span className="hidden h-3 w-px bg-white/30 sm:block" aria-hidden="true" />
              <a
                href={`tel:${APP_LINKS.SUPPORT_PHONE}`}
                className="inline-flex items-center gap-1.5 opacity-90 transition-opacity hover:opacity-100"
              >
                <Phone className="h-3.5 w-3.5" />
                {APP_LINKS.SUPPORT_PHONE}
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
