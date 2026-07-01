import { IndianRupee, Package, Store, Truck } from "lucide-react";

/**
 * Stats.tsx
 * Key-metric band shown just below the hero to build instant credibility.
 */
const stats = [
  { icon: Store, value: "500+", label: "Active Sellers" },
  { icon: Package, value: "50k+", label: "Products Listed" },
  { icon: Truck, value: "20+", label: "Districts Covered" },
  { icon: IndianRupee, value: "₹2Cr+", label: "Seller Earnings" },
];

export default function Stats() {
  return (
    <section className="relative border-y border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-bold text-white sm:text-4xl">
                  {stat.value}
                </span>
                <span className="text-sm text-gray-500">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
