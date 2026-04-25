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

const SectionHeader = ({ title, icon, theme }: any) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={20} color={theme.primary} style={{ marginRight: 8 }} />
    <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
  </View>
);

const FormField = ({ label, value, onChange, placeholder, theme, multiline = false, keyboardType = "default" }: any) => (
  <View style={styles.formGroup}>
    <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          height: multiline ? 100 : 50,
          textAlignVertical: multiline ? "top" : "center"
        }
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.secondaryText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

const AppSettingsScreen = () => {
  const theme = useTheme() as any;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);

  // Form State
  const [form, setForm] = useState({
    seo: { metaTitle: "", metaDescription: "", keywords: "" },
    contact: { email: "", phone: "", whatsapp: "", address: "" },
    socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "" },
    policies: { privacyPolicy: "", termsAndConditions: "", returnPolicy: "", shippingPolicy: "" },
    shipping: { freeShippingThreshold: "", shippingFee: "" },
    appearance: { logoUrl: "", faviconUrl: "" }
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await getAppConfigRequest();
      const data = response.data.data;
      setConfig(data);

      setForm({
        seo: {
          metaTitle: data.seo?.metaTitle || "",
          metaDescription: data.seo?.metaDescription || "",
          keywords: data.seo?.keywords?.join(", ") || "",
        },
        contact: data.contact || { email: "", phone: "", whatsapp: "", address: "" },
        socialLinks: data.socialLinks || { facebook: "", instagram: "", twitter: "", youtube: "" },
        policies: data.policies || { privacyPolicy: "", termsAndConditions: "", returnPolicy: "", shippingPolicy: "" },
        shipping: {
          freeShippingThreshold: data.shipping?.freeShippingThreshold?.toString() || "2000",
          shippingFee: data.shipping?.shippingFee?.toString() || "99",
        },
        appearance: data.appearance || { logoUrl: "", faviconUrl: "" }
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load configuration" });
    } finally {
      setLoading(false);
    }
  };

  const updateSubForm = (section: string, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section as keyof typeof prev] as any, [field]: value }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const payload = {
        ...form,
        seo: {
          ...form.seo,
          keywords: form.seo.keywords.split(",").map(k => k.trim()).filter(k => k !== ""),
        },
        shipping: {
          freeShippingThreshold: Number(form.shipping.freeShippingThreshold),
          shippingFee: Number(form.shipping.shippingFee),
        }
      };

      await updateAppConfigRequest(payload);
      Toast.show({ type: "success", text1: "Success", text2: "Configuration updated successfully" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Update Failed", text2: error.message });
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Store Configuration</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={theme.primary} /> : <Text style={{ color: theme.primary, fontWeight: "700" }}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SEO SECTION */}
          <SectionHeader title="🌍 General & SEO" icon="globe-outline" theme={theme} />
          <FormField label="Meta Title" value={form.seo.metaTitle} onChange={(v: string) => updateSubForm("seo", "metaTitle", v)} theme={theme} />
          <FormField label="Meta Description" value={form.seo.metaDescription} onChange={(v: string) => updateSubForm("seo", "metaDescription", v)} theme={theme} multiline />
          <FormField label="Keywords (Comma separated)" value={form.seo.keywords} onChange={(v: string) => updateSubForm("seo", "keywords", v)} theme={theme} />

          {/* SHIPPING SECTION */}
          <SectionHeader title="📦 Shipping Rules" icon="bus-outline" theme={theme} />
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <FormField label="Free Threshold" value={form.shipping.freeShippingThreshold} onChange={(v: string) => updateSubForm("shipping", "freeShippingThreshold", v)} theme={theme} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Shipping Fee" value={form.shipping.shippingFee} onChange={(v: string) => updateSubForm("shipping", "shippingFee", v)} theme={theme} keyboardType="numeric" />
            </View>
          </View>

          {/* CONTACT SECTION */}
          <SectionHeader title="📞 Contact Information" icon="call-outline" theme={theme} />
          <FormField label="Public Email" value={form.contact.email} onChange={(v: string) => updateSubForm("contact", "email", v)} theme={theme} keyboardType="email-address" />
          <FormField label="Support Phone" value={form.contact.phone} onChange={(v: string) => updateSubForm("contact", "phone", v)} theme={theme} keyboardType="phone-pad" />
          <FormField label="WhatsApp Number" value={form.contact.whatsapp} onChange={(v: string) => updateSubForm("contact", "whatsapp", v)} theme={theme} keyboardType="phone-pad" />
          <FormField label="Office Address" value={form.contact.address} onChange={(v: string) => updateSubForm("contact", "address", v)} theme={theme} multiline />

          {/* SOCIAL LINKS */}
          <SectionHeader title="🔗 Social Presence" icon="share-social-outline" theme={theme} />
          <FormField label="Instagram URL" value={form.socialLinks.instagram} onChange={(v: string) => updateSubForm("socialLinks", "instagram", v)} theme={theme} />
          <FormField label="Facebook URL" value={form.socialLinks.facebook} onChange={(v: string) => updateSubForm("socialLinks", "facebook", v)} theme={theme} />

          {/* POLICIES */}
          <SectionHeader title="📄 Legal & Policies" icon="document-text-outline" theme={theme} />
          <FormField label="Privacy Policy" value={form.policies.privacyPolicy} onChange={(v: string) => updateSubForm("policies", "privacyPolicy", v)} theme={theme} multiline />
          <FormField label="Terms & Conditions" value={form.policies.termsAndConditions} onChange={(v: string) => updateSubForm("policies", "termsAndConditions", v)} theme={theme} multiline />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 8, letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, fontSize: 14 },
  row: { flexDirection: "row" },
});

export default AppSettingsScreen;
