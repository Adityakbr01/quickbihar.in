import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AccountMain from "@/src/features/common/account/screens/AccountMain";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
  theme: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AccountErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AccountErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const theme = this.props.theme;
      return (
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.errorIconBadge, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
            <Ionicons name="alert-circle-outline" size={36} color="#ef4444" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Unable to load account</Text>
          <Text style={[styles.errorSubtitle, { color: theme.secondaryText }]}>
            Something went wrong while displaying your profile.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset();
            }}
          >
            <Text style={styles.actionBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const AccountScreen = () => {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const theme = useTheme() as any;
  const router = useRouter();

  // If auth is already initialized and user is NOT logged in, show clean sign-in prompt
  if (isInitialized && !isAuthenticated) {
    return (
      <SafeViewWrapper>
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.errorIconBadge, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
            <Ionicons name="person-circle-outline" size={48} color="#3b82f6" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Sign In Required</Text>
          <Text style={[styles.errorSubtitle, { color: theme.secondaryText }]}>
            Sign in with Google to view your orders, addresses, and profile details.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.text }]}
            onPress={() => router.push("/auth")}
          >
            <Text style={[styles.actionBtnText, { color: theme.background }]}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </SafeViewWrapper>
    );
  }

  return (
    <SafeViewWrapper>
      <AccountErrorBoundary theme={theme} onReset={() => router.replace("/(tabs)/clothing/home")}>
        <AccountMain />
      </AccountErrorBoundary>
    </SafeViewWrapper>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  errorIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});

