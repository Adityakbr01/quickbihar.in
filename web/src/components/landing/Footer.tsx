import Link from "next/link";
import { Mail, MapPin, Phone, ShoppingBag, Smartphone, ShieldCheck, Store, Bike } from "lucide-react";
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
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  QuickBihar<span className="text-primary">.in</span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground -mt-0.5">
                  {footer.tagline}
                </span>
              </div>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {footer.description}
            </p>

            {/* Play Store Download Pill */}
            <div className="pt-1">
              <a
                href={APP_LINKS.PLAY_STORE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/80 transition-colors"
              >
                <Smartphone className="h-4 w-4 text-primary" />
                <span>{footer.playStoreButtonText}</span>
              </a>
            </div>

            {/* Contact Info */}
            <div className="space-y-1.5 pt-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <span>{APP_LINKS.OFFICE_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                <a href={`mailto:${APP_LINKS.SUPPORT_EMAIL}`} className="hover:text-foreground transition-colors">
                  {APP_LINKS.SUPPORT_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                <a href={`tel:${APP_LINKS.SUPPORT_PHONE}`} className="hover:text-foreground transition-colors">
                  {APP_LINKS.SUPPORT_PHONE}
                </a>
              </div>
            </div>
          </div>

          {/* 4 Portals Columns */}
          {footer.columns.map((col) => {
            const Icon = iconMap[col.icon] || Store;
            return (
              <div key={col.title} className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{col.title}</span>
                </div>
                <ul className="space-y-2">
                  {col.links.map((link) => {
                    const href = link.href === "PLAY_STORE" ? APP_LINKS.PLAY_STORE : link.href;
                    return (
                      <li key={link.label}>
                        {link.external ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs transition-colors ${
                              link.highlight
                                ? "font-semibold text-primary hover:underline"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            href={href}
                            className={`text-xs transition-colors ${
                              link.highlight
                                ? "font-semibold text-primary hover:underline"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
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
      <div className="border-t border-border bg-background py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {app.domain}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {footer.bottomLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={link.primary ? "text-primary hover:underline" : "hover:text-foreground transition-colors"}
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
