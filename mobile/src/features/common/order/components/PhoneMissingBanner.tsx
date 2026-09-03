import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";

/**
 * Banner shown at the top of checkout when the user has no phone
 * on file. The seller needs a phone to confirm the order by call
 * (the new "no OTP" confirmation flow), so we ask for one before
 * allowing checkout to proceed.
 *
 * The phone is collected on the spot via a modal-ish input. On
 * submit we POST /users/profile so the canonical phone record on
 * the user document is updated — the address's phone field is
 * independent and continues to drive delivery calls.
 */
export const PhoneMissingBanner: React.FC = () => {
  const theme = useTheme() as any;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const cleaned = phone.trim();
    if (cleaned.length !== 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      const axios = (await import("@/src/api/axiosInstance")).default;
      await axios.patch("/users/profile", { phone: cleaned });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Refresh the user via the auth store so the rest of checkout
      // sees the new phone without a manual reload.
      const { useAuthStore } = await import(
        "@/src/features/common/auth/store/authStore"
      );
      const token = useAuthStore.getState().token;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (token) {
        const me = await axios.get("/users/me");
        const fresh = me?.data?.data;
        if (fresh) {
          await useAuthStore.getState().setAuth(fresh, token, refreshToken || "");
        }
      }
      setEditing(false);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          borderColor: "rgba(245, 158, 11, 0.45)",
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="call-outline" size={20} color="#f59e0b" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>
            Add a phone number
          </Text>
          <Text style={[styles.body, { color: theme.secondaryText }]}>
            Sellers call to confirm orders. Add a 10-digit mobile so they can
            reach you.
          </Text>
        </View>
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <View
            style={[
              styles.inputBox,
              { borderColor: "rgba(255,255,255,0.18)", backgroundColor: theme.cardBackground || "rgba(255,255,255,0.06)" },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={16}
              color={theme.secondaryText}
            />
            <Text style={{ color: theme.text, marginLeft: 6 }}>+91</Text>
            {/* Lightweight inline input via a plain TextInput import */}
            <PhoneInputInline value={phone} onChange={setPhone} theme={theme} />
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || phone.trim().length !== 10}
            style={[
              styles.saveBtn,
              {
                backgroundColor:
                  phone.trim().length === 10 ? theme.primary : "rgba(255,255,255,0.1)",
              },
            ]}
          >
            <Text style={styles.saveBtnText}>{saving ? "…" : "Save"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditing(true);
            }}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.primaryBtnText}>Add Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/account/profile-info" as any);
            }}
          >
            <Text
              style={{
                color: theme.secondaryText,
                fontSize: 12,
                textDecorationLine: "underline",
              }}
            >
              Update from profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Tiny inline input wrapper — kept here so the banner stays a single
// file (avoids dragging the full themed TextInput for one field).
const PhoneInputInline: React.FC<{
  value: string;
  onChange: (v: string) => void;
  theme: any;
}> = ({ value, onChange, theme }) => {
  const { TextInput } = require("@/src/theme/components/TextInput");
  return (
    <View style={{ flex: 1, marginLeft: 6 }}>
      <TextInput
        variant="glass"
        placeholder="10-digit mobile"
        keyboardType="phone-pad"
        maxLength={10}
        value={value}
        onChangeText={onChange}
        autoFocus
        editable
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 14, fontWeight: "700" },
  body: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryBtnText: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveBtnText: { color: "#0f172a", fontWeight: "700" },
});
