import { Feather } from "@expo/vector-icons";
import { reloadAppAsync } from "expo";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

// Neutral palette — no dependency on any vertical's useColors().
const neutral = {
  bg: "#FFFFFF",
  card: "#F5F5F5",
  border: "#E0E0E0",
  text: "#1A1A1A",
  subtext: "#6B6B6B",
  primary: "#1A1A1A",
  danger: "#D32F2F",
};

/**
 * Generic error fallback UI with restart + try-again actions.
 *
 * ponytail: moved from Jewelery/components/ErrorFallback.tsx and made
 * theme-agnostic so any vertical can use it without pulling in Jewelery's
 * useColors() hook. Pass a custom FallbackComponent to ErrorBoundary if you
 * need themed colours.
 */
export function CommonErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleRestart = async () => {
    try {
      await reloadAppAsync();
    } catch {
      resetError();
    }
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: neutral.bg,
          paddingTop: topPad,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: neutral.card }]}>
          <Feather name="alert-triangle" size={32} color={neutral.danger} />
        </View>
      </View>

      <Text style={[styles.title, { color: neutral.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: neutral.subtext }]}>
        {error.message || "An unexpected error occurred."}
      </Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: neutral.primary }]}
          onPress={handleRestart}
        >
          <Feather name="refresh-cw" size={14} color="#fff" />
          <Text style={styles.primaryBtnText}>Restart App</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, { borderColor: neutral.border }]}
          onPress={resetError}
        >
          <Text style={[styles.secondaryBtnText, { color: neutral.text }]}>
            Try Again
          </Text>
        </Pressable>

        <Pressable onPress={() => setIsModalVisible(true)}>
          <Text style={[styles.detailsLink, { color: neutral.subtext }]}>
            View error details
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: neutral.bg }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: neutral.text }]}>
              Error Details
            </Text>
            <Pressable onPress={() => setIsModalVisible(false)} hitSlop={8}>
              <Feather name="x" size={22} color={neutral.text} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            <Text
              style={[
                styles.errorDetails,
                {
                  color: neutral.subtext,
                  backgroundColor: neutral.card,
                  borderColor: neutral.border,
                },
              ]}
            >
              {formatErrorDetails()}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  actions: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailsLink: {
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  modal: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    flex: 1,
  },
  errorDetails: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 11,
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});
