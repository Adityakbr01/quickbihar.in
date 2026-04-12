import { StyleSheet, Platform } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

export const createAccountStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    ...(Platform.OS === "web" && {
      alignItems: "center",
    }),
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 800,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header Styles
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.primary,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 4,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.background,
  },
  // Option Row Styles
  section: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.tertiaryText,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 24,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: theme.background,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.tertiaryBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabel: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "600",
    color: theme.text,
  },
  chevron: {
    opacity: 0.3,
  },
  // Sub Option Styles (Nested)
  subItemsContainer: {
    overflow: "hidden",
    backgroundColor: theme.tertiaryBackground,
  },
  subOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    paddingLeft: 44, // Indent
  },
  subIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
  },
  subOptionLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
    color: theme.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 82, // Align with text
    opacity: 0.5,
  },
  subDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 88,
    opacity: 0.3,
  },
  logoutRow: {
    marginTop: 32,
    marginBottom: 60,
  },
  logoutText: {
    color: "#FF3B30",
  },
});
