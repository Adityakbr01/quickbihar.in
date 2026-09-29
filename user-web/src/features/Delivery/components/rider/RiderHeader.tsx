import React from "react";
import { Text, TouchableOpacity, View } from "@/components/primitives";
import { Power, Radio } from "lucide-react";
import type { Theme } from "@/src/theme/Provider/ThemeProvider";
import type { RiderProfile } from "../../api/delivery.api";
import type { RiderStyles } from "../../types/rider.types";

export function RiderHeader({
  styles,
  theme,
  profile,
  isOnline,
  busy,
  onToggleOnline,
}: {
  styles: RiderStyles;
  theme: Theme;
  profile: RiderProfile | null;
  isOnline: boolean;
  busy: boolean;
  onToggleOnline: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.eyebrow}>QuickBihar Rider</Text>
        <Text style={styles.title}>Delivery Workspace</Text>
        <Text style={styles.muted} numberOfLines={1}>
          {profile?.fullName || "Delivery Partner"} - {profile?.isVerified ? "Verified" : "Verification pending"}
        </Text>
      </View>
      <TouchableOpacity style={[styles.statusButton, isOnline && styles.statusOnline]} onPress={onToggleOnline} disabled={busy}>
        {isOnline ? (
        <Radio size={17} color="#fff" />
      ) : (
        <Power size={17} color={theme.background} />
      )}
        <Text style={[styles.statusButtonText, isOnline && styles.statusOnlineText]}>
          {isOnline ? "Online" : "Go Online"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
