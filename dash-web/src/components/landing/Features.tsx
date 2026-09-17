import {
  Truck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Sparkles,
  Banknote,
  Headphones,
} from "lucide-react";
import { landingData } from "@/constants/links";

const iconMap: Record<string, typeof Truck> = {
  Truck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Banknote,
  Headphones,
};

export default function Features() {
  const { features } = landingData;

  return (
    <section id="features" className="relative scroll-mt-16 py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {features.badge}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {features.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {features.subtitle}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((feature) => {
            const Icon = iconMap[feature.icon] || Truck;
            return (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:bg-muted/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-md bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {feature.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-card-foreground">
                  {feature.title}
                </h3>
                
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
