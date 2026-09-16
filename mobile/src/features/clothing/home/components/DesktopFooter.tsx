import React from "react";
import { Platform, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { BREAKPOINTS, DESKTOP } from "@/src/utils/responsive";

/**
 * Desktop-only footer for the clothing catalog. Null everywhere else,
 * so the mobile app is pixel-identical.
 */
export const DesktopFooter = () => {
  const { width } = useWindowDimensions();
  const theme = useTheme() as any;

  if (Platform.OS !== "web" || width < BREAKPOINTS.desktopMin) return null;

  const cols: { title: string; links: string[] }[] = [
    { title: "Shop", links: ["Men's Wear", "Women's Wear", "Kids", "Sarees & Ethnic", "Top Selling"] },
    { title: "Malls in Bihar", links: ["Patna", "Gaya", "Muzaffarpur", "Buxar", "Explore all malls"] },
    { title: "Help", links: ["Track order", "Shipping & delivery", "Returns", "Contact support"] },
    { title: "Quick Bihar", links: ["About us", "Sell on QuickBihar", "Become a rider", "Terms & privacy"] },
  ];

  return (
    <View style={[styles.shell, { backgroundColor: theme.secondaryBackground, borderTopColor: theme.border }]}>
      <View style={styles.inner}>
        <View style={styles.brandCol}>
          <Text style={[styles.brandName, { color: theme.text }]}>Quick Bihar</Text>
          <Text style={[styles.brandTag, { color: theme.secondaryText }]}>
            Bihar's own fashion mall — sarees, kurtas, jeans & more with super-fast doorstep delivery.
          </Text>
          <View style={[styles.trustPill, { borderColor: theme.border }]}>
            <Text style={[styles.trustText, { color: theme.secondaryText }]}>
              ✓ COD available  •  ✓ Easy returns  •  ✓ Local stores
            </Text>
          </View>
        </View>
        {cols.map((c) => (
          <View key={c.title} style={styles.col}>
            <Text style={[styles.colTitle, { color: theme.text }]}>{c.title}</Text>
            {c.links.map((l) => (
              <Text key={l} style={[styles.link, { color: theme.secondaryText }]}>
                {l}
              </Text>
            ))}
          </View>
        ))}
      </View>
      <View style={[styles.bottom, { borderTopColor: theme.border }]}>
        <Text style={[styles.bottomText, { color: theme.tertiaryText }]}>
          © 2026 QuickBihar • Made for Bihar • Fastest fashion delivery
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: { width: "100%", borderTopWidth: 1, marginTop: 40 },
  inner: {
    width: "100%",
    maxWidth: DESKTOP.maxWidth,
    alignSelf: "center",
    marginHorizontal: "auto" as any,
    paddingHorizontal: DESKTOP.gutter,
    paddingVertical: 36,
    flexDirection: "row",
    gap: 32,
  },
  brandCol: { flex: 1.4, gap: 10 },
  brandName: { fontSize: 20, fontWeight: "900", letterSpacing: -0.4 },
  brandTag: { fontSize: 13, lineHeight: 20 },
  trustPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start", marginTop: 6 },
  trustText: { fontSize: 12, fontWeight: "600" },
  col: { flex: 1, gap: 9 },
  colTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
  link: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
  bottom: { borderTopWidth: 1, paddingVertical: 16, alignItems: "center" },
  bottomText: { fontSize: 12, fontWeight: "500" },
});

export default DesktopFooter;
