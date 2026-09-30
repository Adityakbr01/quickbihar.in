import React from "react";
import type { LucideIcon } from "lucide-react";
import { useTheme, type Theme } from "@/src/theme/Provider/ThemeProvider";
import { label, statusTone } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";
import { cn } from "@/src/lib/utils";

function pillColors(theme: Theme, tone: string) {
  switch (tone) {
    case "green":
      return { borderColor: `${theme.success}66`, backgroundColor: `${theme.success}12`, color: theme.success };
    case "red":
      return { borderColor: `${theme.error}66`, backgroundColor: `${theme.error}12`, color: theme.error };
    case "amber":
      return { borderColor: `${theme.warning}66`, backgroundColor: `${theme.warning}12`, color: theme.warning };
    case "blue":
      return { borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}12`, color: theme.primary };
    default:
      return { borderColor: theme.border, backgroundColor: theme.tertiaryBackground, color: theme.secondaryText };
  }
}

export function SectionTitle({ styles, title, meta }: { styles: RiderStyles; title: string; meta?: string }) {
  void styles;
  const theme = useTheme();
  return (
    <div className="mt-0.5 flex flex-row items-center justify-between gap-2.5">
      <h2 className="text-[17px] font-extrabold" style={{ color: theme.text }}>
        {title}
      </h2>
      {meta ? (
        <span className="text-xs font-extrabold" style={{ color: theme.secondaryText }}>
          {meta}
        </span>
      ) : null}
    </div>
  );
}

export function SummaryTile({ styles, label: tileLabel, value }: { styles: RiderStyles; label: string; value: string }) {
  void styles;
  const theme = useTheme();
  return (
    <div
      className="flex min-h-[72px] flex-1 flex-col justify-center rounded-[14px] border px-2.5 py-3"
      style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
    >
      <span className={cn("line-clamp-1 truncate text-base font-black")} style={{ color: theme.text }}>
        {value}
      </span>
      <span className="mt-1 text-[11px] font-bold" style={{ color: theme.secondaryText }}>
        {tileLabel}
      </span>
    </div>
  );
}

export function EmptyCard({
  styles,
  theme,
  icon: Icon,
  label: text,
}: {
  styles: RiderStyles;
  theme: Theme;
  icon: LucideIcon;
  label: string;
}) {
  void styles;
  return (
    <div
      className="flex flex-col items-center gap-2 rounded-2xl border p-[18px] text-center"
      style={{ backgroundColor: theme.secondaryBackground, borderColor: theme.border }}
    >
      <Icon size={24} color={theme.tertiaryText} />
      <span className="text-[13px] leading-[18px]" style={{ color: theme.secondaryText }}>
        {text}
      </span>
    </div>
  );
}

export function StatusPill({ styles, status }: { styles: RiderStyles; status?: string }) {
  void styles;
  const theme = useTheme();
  const tone = statusTone(status);
  const colors = pillColors(theme, tone);
  return (
    <div
      className="max-w-[142px] shrink-0 rounded-full border px-2.5 py-1"
      style={{ borderColor: colors.borderColor, backgroundColor: colors.backgroundColor }}
    >
      <span className="line-clamp-1 block truncate text-[10px] font-black" style={{ color: colors.color }}>
        {label(status)}
      </span>
    </div>
  );
}

export function ProofImages({
  styles,
  pickupPhoto,
  deliveryPhoto,
}: {
  styles: RiderStyles;
  pickupPhoto?: string;
  deliveryPhoto?: string;
}) {
  void styles;
  const theme = useTheme();
  const proofs = [
    { label: "Pickup Proof", uri: pickupPhoto },
    { label: "Delivery Proof", uri: deliveryPhoto },
  ].filter((proof): proof is { label: string; uri: string } => Boolean(proof.uri));

  if (proofs.length === 0) return null;

  return (
    <div className="mt-0.5 flex flex-row flex-wrap gap-2.5">
      {proofs.map((proof) => (
        <div key={proof.label} className="flex w-[126px] flex-col gap-1.5">
          <img
            src={proof.uri}
            alt={`${proof.label} - delivery proof photo`}
            title={`${proof.label} | QuickBihar delivery`}
            className="aspect-square w-full rounded-xl border object-cover"
            style={{ borderColor: theme.border, backgroundColor: theme.tertiaryBackground }}
            loading="lazy"
            decoding="async"
          />
          <span className="text-[11px] font-extrabold" style={{ color: theme.secondaryText }}>
            {proof.label}
          </span>
        </div>
      ))}
    </div>
  );
}
