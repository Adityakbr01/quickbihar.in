import Link from "next/link";
import { ArrowRight, Bike, CheckCircle2, ShoppingBag, Store } from "lucide-react";

/**
 * Audiences.tsx
 * Role-oriented panels mapping to the platform's three participants
 * (sellers, delivery partners, customers), each with its own CTA.
 */
const audiences = [
  {
    icon: Store,
    tag: "For Sellers",
    title: "Turn your shop into an online store",
    points: [
      "List unlimited products for free",
      "Weekly payouts to your bank",
      "Reach customers across Bihar",
    ],
    cta: { label: "Become a Seller", href: "/seller/register" },
    accent: "cyan",
  },
  {
    icon: Bike,
    tag: "For Delivery Partners",
    title: "Earn on your own schedule",
    points: [
      "Flexible hours, local routes",
      "Transparent per-delivery payouts",
      "Instant order notifications",
    ],
    cta: { label: "Partner With Us", href: "/delivery/register" },
    accent: "emerald",
  },
  {
    icon: ShoppingBag,
    tag: "For Customers",
    title: "Shop local, delivered fast",
    points: [
      "Thousands of products near you",
      "Same-day delivery in most areas",
      "Secure payments & easy returns",
    ],
    cta: { label: "Start Shopping", href: "#" },
    accent: "cyan",
  },
];

const accentMap: Record<string, { ring: string; icon: string; link: string }> = {
  cyan: {
    ring: "hover:border-cyan-400/40",
    icon: "border-cyan-400/20 bg-cyan-400/10 text-cyan-400",
    link: "text-cyan-400 hover:text-cyan-300",
  },
  emerald: {
    ring: "hover:border-emerald-400/40",
    icon: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
    link: "text-emerald-400 hover:text-emerald-300",
  },
};

export default function Audiences() {
  return (
    <section id="about" className="relative scroll-mt-16 border-t border-white/10 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            One platform, three ways to win
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for everyone in the chain
          </h2>
          <p className="mt-4 text-base text-gray-400">
            Whether you sell, deliver, or shop — QuickBihar gives you a reason to
            be here.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {audiences.map((aud) => {
            const Icon = aud.icon;
            const accent = accentMap[aud.accent];
            return (
              <div
                key={aud.tag}
                className={`flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-8 transition-all ${accent.ring}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${accent.icon}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {aud.tag}
                </span>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {aud.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {aud.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={aud.cta.href}
                  className={`group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold ${accent.link}`}
                >
                  {aud.cta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
