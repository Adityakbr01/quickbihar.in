import { StyleSheet } from "react-native";
import { layout, spacing, radius } from "@/src/theme/spacing";

export const homeStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPadding,
    height: layout.headerHeight + 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },

  /* ── Search button (animates width) ── */
  searchBtn: {
    height: 38,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  searchTouchable: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  expandedInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    paddingVertical: 0,
    paddingRight: spacing.m,
  },

  /* ── Notification button (fixed size) ── */
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.m,
    justifyContent: "center",
    alignItems: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    backgroundColor: "#FF3B30",
    borderRadius: 4,
    borderWidth: 1.5,
  },
});
