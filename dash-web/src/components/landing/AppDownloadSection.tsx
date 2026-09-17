import {
  QrCode,
  CheckCircle2,
  Globe,
  MessageCircle,
  Star,
  Smartphone,
} from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

export default function AppDownloadSection() {
  const { appDownload } = landingData;

  return (
    <section id="download-app" className="relative scroll-mt-20 overflow-hidden border-t border-border bg-background py-20 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Gradient panel */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary-container via-card to-tertiary-container p-6 shadow-md sm:p-10 lg:p-12">
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border-[24px] border-primary/10" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid items-center gap-10 lg:grid-cols-12">

            {/* Left Info */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground shadow-xs">
                <Star className="h-3.5 w-3.5 fill-tertiary text-tertiary" />
                {appDownload.badge}
              </span>

              <h2 className="mt-4 max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
                {appDownload.title}
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                {appDownload.subtitle}
              </p>

              {/* Perks */}
              <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {appDownload.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-xs font-medium text-card-foreground sm:text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              {/* Web App Button & Highlights */}
              <div className="flex flex-wrap items-center gap-3 pt-6">
                <a
                  href={APP_LINKS.WEB_APP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl bg-foreground px-5 py-3 text-background shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <Globe className="h-6 w-6" aria-hidden="true" />
                  <span className="text-left">

                    <span className="block text-sm leading-tight font-bold">
                      {appDownload.playStoreButtonTitle}
                    </span>
                  </span>
                </a>

                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-xs text-muted-foreground shadow-xs">
                  <span className="font-bold text-foreground">{appDownload.ratingBadge}</span>
                  <span aria-hidden="true">•</span>
                  <span>{appDownload.usersBadge}</span>
                </div>
              </div>

            </div>

            {/* Right QR Box */}
            <div className="flex justify-center lg:col-span-5">
              <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 text-center shadow-lg">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  <span>{appDownload.qrBadge}</span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-foreground">
                  {appDownload.qrTitle}
                </h3>

                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {appDownload.qrSubtitle}
                </p>

                {/* Coming-soon card (replaces the store QR until launch) */}
                <div className="mx-auto my-4 flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted p-3 shadow-inner">
                  <Smartphone className="h-10 w-10 text-primary" aria-hidden="true" />
                  <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-wide text-primary-foreground uppercase">
                    Coming Soon
                  </span>
                  <span className="text-[11px] text-muted-foreground">Android App</span>
                </div>

                <a
                  href={APP_LINKS.WHATSAPP_LAUNCH}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {appDownload.directDownloadText}
                </a>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
