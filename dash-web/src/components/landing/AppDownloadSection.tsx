import {
  QrCode,
  CheckCircle2,
  Star,
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

              {/* Play Store Button & Rating */}
              <div className="flex flex-wrap items-center gap-3 pt-6">
                <a
                  href={APP_LINKS.PLAY_STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-2xl bg-foreground px-5 py-3 text-background shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186c-.368-.382-.61-.954-.61-1.686V3.5c0-.732.242-1.304.609-1.686zM15.207 13.414l2.586 2.586-12.793 7.38a1.986 1.986 0 01-1.12.336l11.327-10.302zm0-2.828L3.88 0.286A1.986 1.986 0 015 0.622l12.793 7.378-2.586 2.586zm1.414 1.414l3.771-2.176c1.066-.615 1.066-1.619 0-2.234l-3.771-2.176-2.828 2.828 2.828 2.828z" />
                  </svg>
                  <span className="text-left">
                    <span className="block text-[9px] font-medium tracking-wider uppercase opacity-70">
                      {appDownload.playStoreButtonLabel}
                    </span>
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

                {/* QR Code */}
                <div className="mx-auto my-4 flex h-44 w-44 items-center justify-center rounded-xl border border-border bg-white p-3 shadow-inner">
                  <svg className="h-full w-full text-black" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                    <rect x="8" y="8" width="26" height="26" rx="3" fill="#000" />
                    <rect x="12" y="12" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="16" y="16" width="10" height="10" rx="1" fill="#000" />

                    <rect x="66" y="8" width="26" height="26" rx="3" fill="#000" />
                    <rect x="70" y="12" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="74" y="16" width="10" height="10" rx="1" fill="#000" />

                    <rect x="8" y="66" width="26" height="26" rx="3" fill="#000" />
                    <rect x="12" y="70" width="18" height="18" rx="2" fill="#fff" />
                    <rect x="16" y="74" width="10" height="10" rx="1" fill="#000" />

                    <rect x="40" y="10" width="6" height="6" />
                    <rect x="52" y="10" width="6" height="6" />
                    <rect x="40" y="22" width="6" height="6" />
                    <rect x="48" y="18" width="8" height="8" />
                    <rect x="42" y="32" width="6" height="6" />
                    <rect x="54" y="32" width="8" height="6" />
                    <rect x="10" y="42" width="6" height="6" />
                    <rect x="22" y="42" width="8" height="6" />
                    <rect x="36" y="46" width="8" height="8" />
                    <rect x="48" y="46" width="6" height="6" />
                    <rect x="60" y="44" width="8" height="6" />
                    <rect x="72" y="42" width="6" height="6" />
                    <rect x="84" y="42" width="6" height="6" />
                    <rect x="10" y="54" width="6" height="6" />
                    <rect x="22" y="52" width="6" height="8" />
                    <rect x="34" y="58" width="6" height="6" />
                    <rect x="44" y="58" width="8" height="6" />
                    <rect x="56" y="56" width="6" height="8" />
                    <rect x="68" y="54" width="8" height="6" />
                    <rect x="80" y="54" width="8" height="8" />
                    <rect x="42" y="70" width="6" height="6" />
                    <rect x="52" y="68" width="8" height="8" />
                    <rect x="64" y="72" width="6" height="6" />
                    <rect x="74" y="70" width="8" height="6" />
                    <rect x="42" y="82" width="8" height="6" />
                    <rect x="56" y="82" width="6" height="6" />
                    <rect x="68" y="82" width="8" height="6" />
                    <rect x="80" y="80" width="6" height="8" />
                  </svg>
                </div>

                <a
                  href={APP_LINKS.PLAY_STORE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
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
