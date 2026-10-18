import axiosInstance from "@/src/api/axiosInstance";
import * as Haptics from "@/lib/haptics";
import React from "react";
import { cn } from "@/src/lib/utils";
import { TextInput } from "@/src/theme/components/TextInput";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { Spinner } from "../components/Spinner";

/**
 * Jewellery newsletter email signup form with loading/done/error states.
 * Extracted from JeweleryHomeScreen (`NewsletterSection`).
 * Preserves the API payload, validation, haptics, and all state transitions.
 */
export function NewsletterSection() {
  const colors = useColors();
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [message, setMessage] = React.useState("");
  const [focused, setFocused] = React.useState(false);

  const subscribe = async () => {
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus("loading");
    setMessage("");
    try {
      const res = await axiosInstance.post("/newsletter/subscribe", {
        email: value,
        vertical: "JEWELERY",
        source: "jewelery-home-newsletter",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus("done");
      setMessage(
        res?.data?.message || "You're on the list. Welcome to the Circle!",
      );
      setEmail("");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStatus("error");
      setMessage(
        err?.response?.data?.message ||
          "Couldn't subscribe right now. Please try again.",
      );
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-4 p-5"
      style={{ backgroundColor: colors.ivory }}
    >
      <h2
        className="text-center text-[30px] leading-[36px]"
        style={{
          color: colors.ink,
          fontFamily: "CormorantGaramond_400Regular_Italic",
        }}
      >
        Be the first to know.
      </h2>
      <p
        className="max-w-[280px] text-center text-[13px] leading-5"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        New collections. Artisan stories. Early access. Festive drops.
      </p>
      {status === "done" ? (
        <div
          className="mt-3 flex w-full flex-col items-center rounded-[2px] border p-4"
          style={{
            borderColor: colors.gold,
            borderWidth: 1,
            backgroundColor: colors.champagne,
          }}
        >
          <span
            className="text-center text-sm leading-5"
            style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
          >
            {message || "You're on the list. Welcome to the Circle!"}
          </span>
        </div>
      ) : (
        <>
          <div
            className="mt-3 flex w-full flex-row items-center overflow-hidden rounded-[2px] border"
            style={{
              borderColor:
                status === "error"
                  ? "#dc2626"
                  : focused
                    ? colors.gold
                    : colors.midGray,
              borderWidth: 1,
            }}
          >
            <TextInput
              value={email}
              bare
              onChangeText={(t) => {
                setEmail(t);
                if (status === "error") setStatus("idle");
              }}
              placeholder="Your email"
              placeholderTextColor={colors.warmGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={subscribe}
              editable={status !== "loading"}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              focusBorderColor={colors.gold}
              containerStyle={{ marginBottom: 0, flex: 1 }}
              inputContainerStyle={{
                borderWidth: 0,
                backgroundColor: "transparent",
                paddingHorizontal: 14,
                paddingVertical: 0,
                borderRadius: 0,
              }}
              style={{
                fontSize: 14,
                color: colors.ink,
                fontFamily: "DMSans_400Regular",
                minHeight: 48,
              }}
            />
            <button
              type="button"
              className={cn(
                "cursor-pointer px-4 py-3",
                status === "loading" && "opacity-70",
              )}
              style={{ backgroundColor: colors.gold }}
              onClick={subscribe}
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <Spinner size={14} color={colors.onBrand} />
              ) : (
                <span
                  className="text-[11px] tracking-[0.5px]"
                  style={{
                    color: colors.onBrand,
                    fontFamily: "DMSans_500Medium",
                  }}
                >
                  Join the Circle
                </span>
              )}
            </button>
          </div>
          {status === "error" && message ? (
            <span
              className="mt-2 text-xs"
              style={{ color: "#dc2626", fontFamily: "DMSans_400Regular" }}
            >
              {message}
            </span>
          ) : null}
        </>
      )}
      <span
        className="text-[10px] tracking-[0.5px]"
        style={{ color: colors.warmGray, fontFamily: "DMSans_300Light" }}
      >
        No spam. Only gold.
      </span>
    </div>
  );
}

export default NewsletterSection;
