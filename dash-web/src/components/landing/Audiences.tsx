import { Link } from "react-router-dom";
import { ArrowRight, Bike, CheckCircle2, ShoppingBag, Store, Smartphone } from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";
import SectionHeader from "@/components/landing/SectionHeader";

const iconMap: Record<string, typeof ShoppingBag> = {
  ShoppingBag,
  Store,
  Bike,
};

export default function Audiences() {
  const { audiences } = landingData;

  return (
    <section id="partners" className="relative scroll-mt-16 border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeader badge={audiences.badge} title={audiences.title} subtitle={audiences.subtitle} />

        {/* 3 Audience Cards */}
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {audiences.items.map((aud) => {
            const Icon = iconMap[aud.icon] || ShoppingBag;
            const primaryHref = aud.primaryCta.usePlayStoreLink ? APP_LINKS.PLAY_STORE : aud.primaryCta.href || "#";
            const isExternal = aud.primaryCta.usePlayStoreLink;

            return (
              <article
                key={aud.tag}
                className="group flex flex-col rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      {aud.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-card-foreground">
                    {aud.title}
                  </h3>

                  <ul className="mt-4 space-y-2.5">
                    {aud.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs text-muted-foreground sm:text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 space-y-2.5 border-t border-border pt-5">
                    {isExternal ? (
                      <a
                        href={primaryHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary/90"
                      >
                        <Smartphone className="h-4 w-4" />
                        {aud.primaryCta.label}
                      </a>
                    ) : (
                      <Link
                        to={primaryHref}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-xs font-semibold text-on-primary shadow-xs transition-colors hover:bg-primary/90"
                      >
                        {aud.primaryCta.label}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}

                    <div className="text-center">
                      <Link
                        to={aud.secondaryCta.href}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {aud.secondaryCta.label} →
                      </Link>
                    </div>
                  </div>
                </div>

              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
