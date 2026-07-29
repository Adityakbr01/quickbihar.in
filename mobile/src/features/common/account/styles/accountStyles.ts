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
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  drawerHandle: {
    width: 40,
    height: 5,
    backgroundColor: theme.tertiaryText,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
  modalContent: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.text,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.secondaryText,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  errorText: {
    color: theme.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
});
