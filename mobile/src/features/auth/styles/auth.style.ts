import { spacing } from "@/src/theme/spacing";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020617",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 38,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 24,
    fontWeight: "400",
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
    color: "#fca5a5",
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
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  inputBoxFocused: {
    borderColor: "rgba(255, 255, 255, 0.6)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  inputBoxError: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  eyeBtn: {
    padding: 4,
  },
  inlineErrorText: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 4,
  },
  continueBtn: {
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtnText: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "700",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    textAlign: "center",
  },
});
