import { Quote, Star } from "lucide-react";

/**
 * Testimonials.tsx
 * Social proof from sellers and customers across Bihar to reinforce trust
 * before the final call-to-action.
 */
const testimonials = [
  {
    quote:
      "I moved my kirana store online with QuickBihar and doubled my orders in two months. The payouts are always on time.",
    name: "Ramesh Kumar",
    role: "Seller, Patna",
    initials: "RK",
  },
  {
    quote:
      "Delivery is genuinely same-day in my area. I now shop for groceries and electronics without leaving home.",
    name: "Anjali Singh",
    role: "Customer, Gaya",
    initials: "AS",
  },
  {
    quote:
      "Flexible hours let me deliver around my college schedule. The app is simple and payments are instant.",
    name: "Vikash Yadav",
    role: "Delivery Partner, Muzaffarpur",
    initials: "VY",
  },
];

export default function Testimonials() {
  return (
    <section className="relative border-t border-white/10 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Loved across Bihar
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Don&apos;t just take our word for it
          </h2>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-7"
            >
              <Quote className="h-8 w-8 text-cyan-400/30" />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-gray-300">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-5 flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 text-sm font-semibold text-cyan-300">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
