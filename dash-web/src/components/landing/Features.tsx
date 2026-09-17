import {
  Truck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Banknote,
  Headphones,
} from "lucide-react";
import { landingData } from "@/constants/links";
import SectionHeader from "@/components/landing/SectionHeader";

const iconMap: Record<string, typeof Truck> = {
  Truck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Banknote,
  Headphones,
};

const tileTints = [
  "bg-primary/10 text-primary",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
];

export default function Features() {
  const { features } = landingData;

  return (
    <section id="features" className="relative scroll-mt-16 bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeader badge={features.badge} title={features.title} subtitle={features.subtitle} />

        {/* Bento Grid — lead card spans two columns */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Truck;
            const tint = tileTints[i % tileTints.length];
            const lead = i === 0;
            return (
              <article
                key={feature.title}
                className={
                  "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg " +
                  (lead ? "sm:col-span-2 lg:col-span-2 lg:p-8" : "")
                }
              >
                {/* Hover glow */}
                <div
                  className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {feature.badge}
                  </span>
                </div>

                <h3 className={`relative mt-5 font-bold text-card-foreground ${lead ? "text-xl sm:text-2xl" : "text-base"}`}>
                  {feature.title}
                </h3>

                <p className={`relative mt-2 leading-relaxed text-muted-foreground ${lead ? "max-w-xl text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}
