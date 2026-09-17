import { ShoppingBag, Sparkles, Store, Truck } from "lucide-react";
import { landingData } from "@/constants/links";

const iconMap: Record<string, typeof ShoppingBag> = {
  ShoppingBag,
  Store,
  Truck,
};

export default function HowItWorks() {
  const { howItWorks } = landingData;

  return (
    <section className="relative overflow-hidden border-t border-border py-20 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {howItWorks.badge}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {howItWorks.title}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            {howItWorks.subtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative mt-12 grid gap-6 lg:grid-cols-3">
          {howItWorks.steps.map((step) => {
            const Icon = iconMap[step.icon] || ShoppingBag;
            return (
              <div
                key={step.step}
                className="flex flex-col items-center text-center rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:bg-muted/40"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
                  <Icon className="h-6 w-6" />
                </div>
                
                <span className="mt-4 rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                  STEP {step.step}
                </span>

                <h3 className="mt-3 text-base font-bold text-card-foreground">
                  {step.title}
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
