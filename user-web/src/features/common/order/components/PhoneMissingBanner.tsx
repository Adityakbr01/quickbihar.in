import { Phone } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React, { useState } from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { TextInput } from "@/src/theme/components/TextInput";
import { cn } from "@/src/lib/utils";

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
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAuthenticated || user?.phone) return null;

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
    <div
      className="mb-4 flex flex-col gap-3 rounded-xl border p-3.5"
      style={{
        backgroundColor: "rgba(245, 158, 11, 0.12)",
        borderColor: "rgba(245, 158, 11, 0.45)",
      }}
    >
      <div className="flex flex-row items-start gap-2.5">
        <Phone size={20} color="#f59e0b" className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <p
            className="text-sm font-bold"
            style={{ color: theme.text }}
          >
            Add a phone number
          </p>
          <p
            className="mt-0.5 text-xs leading-[17px]"
            style={{ color: theme.secondaryText }}
          >
            Sellers call to confirm orders. Add a 10-digit mobile so they can
            reach you.
          </p>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-row items-center gap-2">
          <div
            className="flex h-[42px] flex-1 flex-row items-center rounded-[10px] border px-2.5"
            style={{
              borderColor: "rgba(255,255,255,0.18)",
              backgroundColor:
                theme.cardBackground || "rgba(255,255,255,0.06)",
            }}
          >
            <Phone size={16} color={theme.secondaryText} className="shrink-0" />
            <span
              className="ml-1.5 text-sm"
              style={{ color: theme.text }}
            >
              +91
            </span>
            {/* Lightweight inline input via a plain TextInput import */}
            <PhoneInputInline value={phone} onChange={setPhone} theme={theme} />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || phone.trim().length !== 10}
            className={cn("rounded-lg px-3.5 py-2.5")}
            style={{
              backgroundColor:
                phone.trim().length === 10
                  ? theme.primary
                  : "rgba(255,255,255,0.1)",
              opacity: saving || phone.trim().length !== 10 ? 0.6 : 1,
              cursor:
                saving || phone.trim().length !== 10
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            <span className="font-bold" style={{ color: "#0f172a" }}>
              {saving ? "…" : "Save"}
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-3.5">
          <button
            type="button"
            onClick={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditing(true);
            }}
            className="rounded-lg px-3.5 py-2"
            style={{ backgroundColor: theme.primary }}
          >
            <span className="text-[13px] font-bold" style={{ color: "#0f172a" }}>
              Add Phone
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              goTo(navigate, "/account/profile-info" as any);
            }}
            className="bg-transparent"
          >
            <span
              className="text-xs underline"
              style={{ color: theme.secondaryText }}
            >
              Update from profile
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

// Tiny inline input wrapper — kept here so the banner stays a single
// file (avoids dragging the full themed TextInput for one field).
const PhoneInputInline: React.FC<{
  value: string;
  onChange: (v: string) => void;
  theme: any;
}> = ({ value, onChange, theme }) => {
  return (
    <div className="ml-1.5 flex-1">
      <TextInput variant="glass"
        placeholder="10-digit mobile"
        keyboardType="phone-pad"
        maxLength={10}
        value={value}
        onChangeText={onChange}
        autoFocus
        editable
      />
    </div>
  );
};
