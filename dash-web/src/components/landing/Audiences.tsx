import { Link } from "react-router-dom";
import { ArrowRight, Bike, CheckCircle2, ShoppingBag, Store, Smartphone, Sparkles } from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

const iconMap: Record<string, typeof ShoppingBag> = {
  ShoppingBag,
  Store,
  Bike,
};

export default function Audiences() {
  const { audiences } = landingData;

  return (
    <section id="partners" className="relative scroll-mt-16 border-t border-border py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {audiences.badge}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {audiences.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {audiences.subtitle}
          </p>
        </div>

        {/* 3 Audience Cards */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {audiences.items.map((aud) => {
            const Icon = iconMap[aud.icon] || ShoppingBag;
            const primaryHref = aud.primaryCta.usePlayStoreLink ? APP_LINKS.PLAY_STORE : aud.primaryCta.href || "#";
            const isExternal = aud.primaryCta.usePlayStoreLink;

            return (
              <div
                key={aud.tag}
                className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:bg-muted/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {aud.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-card-foreground">
                    {aud.title}
                  </h3>

                  <ul className="mt-4 space-y-2.5">
                    {aud.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-5 border-t border-border space-y-2.5">
                  {isExternal ? (
                    <a
                      href={primaryHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      <Smartphone className="h-4 w-4" />
                      {aud.primaryCta.label}
                    </a>
                  ) : (
                    <Link
                      to={primaryHref}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      {aud.primaryCta.label}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  <div className="text-center">
                    <Link
                      to={aud.secondaryCta.href}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {aud.secondaryCta.label}
                    </Link>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
