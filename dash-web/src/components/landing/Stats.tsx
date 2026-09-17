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
    <section className="relative border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = iconMap[stat.icon] || Store;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center p-4 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2.5">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
                  {stat.value}
                </span>
                <span className="mt-1 text-xs font-semibold text-card-foreground">{stat.label}</span>
                <span className="text-[10px] text-muted-foreground">{stat.sub}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
