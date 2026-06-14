import { spacing } from "@/src/theme/spacing";
import { StyleSheet } from "react-native";
import { Theme } from "@/src/theme/colors";

export const createAuthStyles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.text,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)",
    marginBottom: 20,
    gap: 10,
  },
  errorBannerText: {
    color: theme.error,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  form: {
    marginBottom: 40,
    gap: 20,
  },
  inputWrapper: {
    gap: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    backgroundColor: theme.secondaryBackground,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputBoxFocused: {
    borderColor: theme.primary,
  },
  inputBoxError: {
    borderColor: theme.error,
  },
  input: {
    flex: 1,
    height: "100%",
    color: theme.text,
    fontSize: 16,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
  },
  inlineErrorText: {
    color: theme.error,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  continueBtn: {
    height: 60,
    backgroundColor: theme.text,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    color: theme.background,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
