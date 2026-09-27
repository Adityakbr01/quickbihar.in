import React from "react";
import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import { label, statusTone } from "../../theme/riderTheme";
import type { RiderStyles } from "../../types/rider.types";

export function SectionTitle({ styles, title, meta }: { styles: RiderStyles; title: string; meta?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

export function SummaryTile({ styles, label: tileLabel, value }: { styles: RiderStyles; label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{tileLabel}</Text>
    </View>
  );
}

export function EmptyCard({
  styles,
  theme,
  icon,
  label: text,
}: {
  styles: RiderStyles;
  theme: Theme;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={24} color={theme.tertiaryText} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

export function StatusPill({ styles, status }: { styles: RiderStyles; status?: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.statusPill, styles[`${tone}Pill`]]}>
      <Text style={[styles.statusPillText, styles[`${tone}PillText`]]} numberOfLines={1}>
        {label(status)}
      </Text>
    </View>
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
  const proofs = [
    { label: "Pickup Proof", uri: pickupPhoto },
    { label: "Delivery Proof", uri: deliveryPhoto },
  ].filter((proof): proof is { label: string; uri: string } => Boolean(proof.uri));

  if (proofs.length === 0) return null;

  return (
    <View style={styles.proofGrid}>
      {proofs.map((proof) => (
        <View key={proof.label} style={styles.proofItem}>
          <Image source={{ uri: proof.uri }} style={styles.proofImage} resizeMode="cover" />
          <Text style={styles.proofLabel}>{proof.label}</Text>
        </View>
      ))}
    </View>
  );
}
