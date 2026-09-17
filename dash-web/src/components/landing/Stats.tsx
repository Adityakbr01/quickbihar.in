import { Package, Store, MapPin, Users } from "lucide-react";
import { landingData } from "@/constants/links";

const iconMap: Record<string, typeof Store> = {
  Store,
  Package,
  MapPin,
  Users,
};

export default function Stats() {
  const { stats } = landingData;

  return (
    <section className="relative border-y border-border bg-card" aria-label="QuickBihar in numbers">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = iconMap[stat.icon] || Store;
            return (
              <div
                key={stat.label}
                className={
                  "flex items-center gap-4 " +
                  (i > 0 ? "lg:border-l lg:border-border lg:pl-8" : "")
                }
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <dd className="font-display text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
                    {stat.value}
                  </dd>
                  <dt className="mt-0.5 text-xs font-semibold text-card-foreground">{stat.label}</dt>
                  <dd className="text-[11px] text-muted-foreground">{stat.sub}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
