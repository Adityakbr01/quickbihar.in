import { ShoppingBag, Store, Truck } from "lucide-react";
import { landingData } from "@/constants/links";
import SectionHeader from "@/components/landing/SectionHeader";

const iconMap: Record<string, typeof ShoppingBag> = {
  ShoppingBag,
  Store,
  Truck,
};

export default function HowItWorks() {
  const { howItWorks } = landingData;

  return (
    <section className="relative overflow-hidden border-t border-border bg-background py-20 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeader badge={howItWorks.badge} title={howItWorks.title} subtitle={howItWorks.subtitle} />

        {/* Steps with connector line */}
        <ol className="relative mt-14 grid gap-10 lg:grid-cols-3 lg:gap-6">
          {/* Connector (desktop only) */}
          <div
            className="absolute top-7 right-[16%] left-[16%] hidden border-t-2 border-dashed border-border lg:block"
            aria-hidden="true"
          />
          {howItWorks.steps.map((step) => {
            const Icon = iconMap[step.icon] || ShoppingBag;
            return (
              <li key={step.step} className="relative flex flex-col items-center text-center">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary shadow-md ring-1 ring-border">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-on-primary shadow-xs">
                    {step.step}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-bold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>

      </div>
    </section>
  );
}
