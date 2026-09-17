import { Star } from "lucide-react";
import { landingData } from "@/constants/links";
import SectionHeader from "@/components/landing/SectionHeader";

export default function Testimonials() {
  const { testimonials } = landingData;

  return (
    <section className="relative border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <SectionHeader badge={testimonials.badge} title={testimonials.title} />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-tertiary" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t.tag}
                  </span>
                </div>

                <blockquote className="mt-4 font-serif-accent text-[15px] leading-relaxed text-card-foreground italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-card-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

      </div>
    </section>
  );
}
