import { Sparkles } from "lucide-react";

type SectionHeaderProps = {
  badge: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
};

export default function SectionHeader({ badge, title, subtitle, align = "center" }: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-card-foreground shadow-xs">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {badge}
      </span>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p> : null}
    </div>
  );
}
