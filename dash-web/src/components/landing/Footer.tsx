import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Smartphone, ShieldCheck, Store, Bike, Globe } from "lucide-react";
import { APP_LINKS, landingData } from "@/constants/links";

const iconMap: Record<string, typeof Store> = {
  Store,
  Bike,
  ShieldCheck,
  Smartphone,
};

export default function Footer() {
  const { footer, app } = landingData;

  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

        {/* 5-Column Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">

          {/* Brand Info (2 Columns) */}
          <div className="space-y-4 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5" aria-label="QuickBihar.in home">
              <img
                src="/logo.png"
                alt="QuickBihar.in logo"
                width={36}
                height={36}
                loading="lazy"
                className="h-9 w-9 rounded-xl object-contain shadow-xs ring-1 ring-border"
              />
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-foreground">
                  QuickBihar<span className="text-primary">.in</span>
                </span>
                <span className="-mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground">
                  {footer.tagline}
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {footer.description}
            </p>

            {/* Web App Pill */}
            <div className="pt-1">
              <a
                href={APP_LINKS.WEB_APP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <Globe className="h-4 w-4 text-primary" />
                <span>{footer.playStoreButtonText}</span>
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{APP_LINKS.OFFICE_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <a href={`mailto:${APP_LINKS.SUPPORT_EMAIL}`} className="transition-colors hover:text-foreground">
                  {APP_LINKS.SUPPORT_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                <a href={APP_LINKS.WHATSAPP} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
                  {APP_LINKS.SUPPORT_PHONE} (WhatsApp)
                </a>
              </div>
            </div>
          </div>

          {/* 4 Portals Columns */}
          {footer.columns.map((col) => {
            const Icon = iconMap[col.icon] || Store;
            return (
              <div key={col.title} className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-foreground uppercase">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{col.title}</span>
                </div>
                <ul className="space-y-2">
                  {col.links.map((link: { label: string; href: string; highlight?: boolean; external?: boolean }) => {
                    const href = link.href === "PLAY_STORE" ? APP_LINKS.WEB_APP : link.href;
                    const isExternal = Boolean(link.external);
                    const isHighlight = Boolean(link.highlight);
                    const linkClass = `text-xs transition-colors ${
                      isHighlight
                        ? "font-semibold text-primary hover:underline"
                        : "text-muted-foreground hover:text-foreground"
                    }`;
                    return (
                      <li key={link.label}>
                        {isExternal ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClass}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            to={href}
                            className={linkClass}
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

        </div>

      </div>

      {/* Sub-footer */}
      <div className="border-t border-border bg-background/60 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {app.domain}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {footer.bottomLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={link.primary ? "font-medium text-primary hover:underline" : "transition-colors hover:text-foreground"}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
