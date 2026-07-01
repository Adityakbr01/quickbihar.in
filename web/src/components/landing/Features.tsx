import {
  BarChart3,
  Clock,
  Headphones,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

/**
 * Features.tsx
 * The core value-proposition grid (#features). Highlights the platform
 * capabilities that matter to sellers, delivery partners, and buyers alike.
 */
const features = [
  {
    icon: Truck,
    title: "Lightning-Fast Delivery",
    description:
      "Optimised local routing gets orders to customers the same day across supported districts.",
  },
  {
    icon: Wallet,
    title: "Low, Transparent Fees",
    description:
      "Keep more of what you earn. No hidden charges, weekly settlements straight to your bank.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track sales, inventory, and payouts from one clean dashboard built for fast decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description:
      "Every transaction is protected end-to-end with verified buyers and fraud monitoring.",
  },
  {
    icon: Clock,
    title: "24-Hour Onboarding",
    description:
      "Register, list your products, and start selling in a single day — no paperwork maze.",
  },
  {
    icon: Headphones,
    title: "Local Language Support",
    description:
      "A support team that speaks your language and understands the Bihar market, 7 days a week.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Why QuickBihar
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to grow
          </h2>
          <p className="mt-4 text-base text-gray-400">
            One platform that connects sellers, delivery partners, and customers
            — with the tools to make commerce effortless.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[0.04]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-400 transition-colors group-hover:bg-cyan-400/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
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
