import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useRouter } from "expo-router";
import { getAppConfigRequest, updateAppConfigRequest } from "../api/appConfig.api";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";

const ShippingSettingsScreen = () => {
  const theme = useTheme() as any;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [threshold, setThreshold] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await getAppConfigRequest();
      const currentConfig = response.data.data;
      setConfig(currentConfig);
      
      const shipping = currentConfig.shipping || { freeShippingThreshold: 2000, shippingFee: 99 };
      setThreshold(shipping.freeShippingThreshold.toString());
      setFee(shipping.shippingFee.toString());
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load shipping settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!threshold || !fee) {
      Toast.show({
        type: "error",
        text1: "Required",
        text2: "Please fill all fields",
      });
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      await updateAppConfigRequest({
        shipping: {
          freeShippingThreshold: Number(threshold),
          shippingFee: Number(fee),
        },
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Shipping rules updated successfully",
      });
      
      router.back();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message || "Could not save shipping settings",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeViewWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Shipping Fees</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.infoCard, { backgroundColor: theme.primary + "10" }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Configure global shipping rules. These settings will affect the Cart and Checkout experience for all users.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>FREE SHIPPING THRESHOLD</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencyPrefix, { color: theme.secondaryText }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={threshold}
                onChangeText={setThreshold}
                keyboardType="numeric"
                placeholder="e.g. 2000"
                placeholderTextColor={theme.secondaryText}
              />
            </View>
            <Text style={[styles.helperText, { color: theme.secondaryText }]}>
              Orders above this amount will get free shipping.
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>FLAT SHIPPING FEE</Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.currencyPrefix, { color: theme.secondaryText }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={fee}
                onChangeText={setFee}
                keyboardType="numeric"
                placeholder="e.g. 99"
                placeholderTextColor={theme.secondaryText}
              />
            </View>
            <Text style={[styles.helperText, { color: theme.secondaryText }]}>
              The standard fee applied to orders below the threshold.
            </Text>
          </View>

          <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.previewTitle, { color: theme.text }]}>Logic Preview</Text>
            <View style={styles.previewRow}>
              <Text style={{ color: theme.secondaryText }}>Amount &lt; ₹{threshold || "0"}</Text>
              <Text style={{ color: theme.primary, fontWeight: "bold" }}>+₹{fee || "0"} Shipping</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={{ color: theme.secondaryText }}>Amount ≥ ₹{threshold || "0"}</Text>
              <Text style={{ color: "#4CD964", fontWeight: "bold" }}>FREE Shipping</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  formSection: {
    marginBottom: 25,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "500",
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: "italic",
    opacity: 0.7,
  },
  previewCard: {
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 15,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 10 : 20,
  },
  saveBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ShippingSettingsScreen;
