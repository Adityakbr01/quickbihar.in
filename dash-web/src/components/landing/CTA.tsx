import { Link } from "react-router-dom";
import { Mail, Phone, Smartphone, Store, Bike, Sparkles } from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

export default function CTA() {
  const { cta } = landingData;

  return (
    <section id="contact" className="relative scroll-mt-16 py-20 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center sm:p-12 shadow-md">
          
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{cta.badge}</span>
            </span>

            <h2 className="mx-auto mt-4 max-w-3xl text-2xl font-extrabold tracking-tight text-card-foreground sm:text-4xl">
              {cta.title}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground sm:text-sm">
              {cta.subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {/* Play Store CTA */}
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-lg bg-primary px-6 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                <span>{cta.playStoreButtonText}</span>
              </a>

              {/* Partner Links */}
              <Link
                to="/seller/register"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-xs font-semibold text-card-foreground transition-colors hover:bg-muted"
              >
                <Store className="h-4 w-4 text-primary" />
                <span>{cta.sellerButtonText}</span>
              </Link>

              <Link
                to="/delivery/register"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-xs font-semibold text-card-foreground transition-colors hover:bg-muted"
              >
                <Bike className="h-4 w-4 text-primary" />
                <span>{cta.riderButtonText}</span>
              </Link>
            </div>

            {/* Contact Details */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 text-xs text-muted-foreground sm:flex-row sm:gap-6 border-t border-border pt-6">
              <a
                href={`mailto:${APP_LINKS.SUPPORT_EMAIL}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Mail className="h-3.5 w-3.5 text-primary" />
                {APP_LINKS.SUPPORT_EMAIL}
              </a>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <a
                href={`tel:${APP_LINKS.SUPPORT_PHONE}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                {APP_LINKS.SUPPORT_PHONE}
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
