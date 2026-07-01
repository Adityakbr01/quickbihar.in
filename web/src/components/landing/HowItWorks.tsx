import { PackageCheck, Rocket, Store } from "lucide-react";

/**
 * HowItWorks.tsx
 * A three-step onboarding narrative that turns "sign up" into a concrete,
 * low-friction path for new sellers.
 */
const steps = [
  {
    icon: Store,
    step: "01",
    title: "Create your account",
    description:
      "Sign up in minutes with your shop details. No setup fees, no commitments.",
  },
  {
    icon: PackageCheck,
    step: "02",
    title: "List your products",
    description:
      "Add products, set prices, and manage inventory from a simple dashboard.",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Start selling",
    description:
      "Go live instantly. We handle delivery and payments while you focus on growth.",
  },
];

export default function HowItWorks() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 py-24">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            How it works
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start selling in three steps
          </h2>
          <p className="mt-4 text-base text-gray-400">
            From sign-up to your first sale — we&apos;ve made it as simple as it
            gets.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 lg:grid-cols-3">
          {/* Connector line (desktop) */}
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-[#0a0a0a] text-cyan-400 shadow-lg shadow-cyan-500/10">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="mt-5 text-xs font-bold tracking-widest text-cyan-400/60">
                  STEP {step.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
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
