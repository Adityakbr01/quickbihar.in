import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";

/**
 * CTA.tsx
 * Closing conversion band (#contact) — a bold final push to register plus
 * quick contact channels for anyone who still has questions.
 */
export default function CTA() {
  return (
    <section id="contact" className="relative scroll-mt-16 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/[0.02] to-emerald-500/10 px-6 py-16 text-center sm:px-16">
          <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[100px]" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to grow your business with QuickBihar?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-gray-300">
              Join hundreds of sellers already reaching customers across Bihar.
              Setup is free and takes less than a day.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/seller/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-black shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/seller/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Seller Login
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 text-sm text-gray-400 sm:flex-row sm:gap-8">
              <a
                href="mailto:support@quickbihar.in"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-cyan-400" />
                support@quickbihar.in
              </a>
              <span className="hidden h-4 w-px bg-white/10 sm:block" />
              <a
                href="tel:+911234567890"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-cyan-400" />
                +91 12345 67890
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
