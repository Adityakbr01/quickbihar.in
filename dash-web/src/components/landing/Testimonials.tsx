import { Star, Sparkles } from "lucide-react";
import { landingData } from "@/constants/links";

export default function Testimonials() {
  const { testimonials } = landingData;

  return (
    <section className="relative border-t border-border py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {testimonials.badge}
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {testimonials.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.items.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs transition-all hover:bg-muted/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex text-primary gap-0.5 text-xs">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {t.tag}
                  </span>
                </div>

                <blockquote className="mt-4 text-xs leading-relaxed text-card-foreground sm:text-sm">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  {t.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-card-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

      </div>
    </section>
  );
}
