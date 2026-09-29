import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, ShieldCheck } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { profileSchema, ProfileFormValues } from "../schema/account.schema";
import { useAccount } from "../hooks/useAccount";
import { useAccountStore } from "../store/accountStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import PhoneOtpSheet from "@/src/features/common/address/components/PhoneOtpSheet";
import { TextInput } from "@/src/theme/components/TextInput";
import { AppSheet } from "@/src/components/common/AppSheet";

const EditProfileModal = () => {
  const theme = useTheme() as any;
  const user = useAuthStore((state) => state.user);
  const isVisible = useAccountStore((state) => state.isEditModalVisible);
  const setVisible = useAccountStore((state) => state.setEditModalVisible);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "" });

  // Track whether the current phone value was OTP-verified in this session
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(
    user?.isPhoneVerified ? (user.phone ?? null) : null
  );
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);

  const { updateProfile, isUpdating } = useAccount();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    },
  });

  const currentPhone = watch("phone");

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isVisible && user) {
      reset({
        fullName: user.fullName,
        phone: user.phone || "",
      });
      setVerifiedPhone(user.isPhoneVerified ? (user.phone ?? null) : null);
    }
  }, [isVisible, user, reset]);

  const phoneChanged = currentPhone !== (user?.phone || "");
  const isPhoneVerified = verifiedPhone !== null && verifiedPhone === currentPhone;

  const onSubmit = (data: ProfileFormValues) => {
    // Block save if phone was changed but not OTP-verified
    if (phoneChanged && !isPhoneVerified) {
      setAlertConfig({
        title: "Phone Not Verified",
        message: "Please verify your new phone number via WhatsApp OTP before saving.",
      });
      setAlertVisible(true);
      return;
    }

    if (data.fullName === user?.fullName && !phoneChanged) {
      setVisible(false);
      return;
    }

    (document.activeElement as HTMLElement | null)?.blur?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    updateProfile.mutate(data, {
      onSuccess: () => {
        setAlertConfig({
          title: "Profile Updated",
          message: "Your profile information has been saved successfully.",
        });
        setAlertVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (error: any) => {
        const message =
          error.response?.data?.message ||
          "Could not update profile. Please try again.";
        setAlertConfig({ title: "Update Failed", message });
        setAlertVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  };

  const handleAlertClose = () => {
    setAlertVisible(false);
    if (alertConfig.title === "Profile Updated") {
      setVisible(false);
    }
  };

  return (
    <>
      <AppSheet
        visible={isVisible}
        onClose={() => setVisible(false)}
        title="Edit Profile"
        label="Edit Profile"
        footer={
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
            className="flex h-14 w-full flex-row items-center justify-center rounded-2xl text-base font-bold text-white transition active:opacity-90 disabled:opacity-70"
            style={{
              backgroundColor: theme.primary,
              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
              opacity: isUpdating ? 0.7 : 1,
            }}
          >
            {isUpdating ? (
              <span
                role="status"
                aria-label="Saving profile"
                className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
              />
            ) : (
              "Save Changes"
            )}
          </button>
        }
      >
        <div className="flex flex-col px-4 pb-4">
              {/* Full Name Field */}
              <div className="mb-5">
                <p
                  className="mb-2 text-sm font-semibold"
                  style={{ color: theme.secondaryText }}
                >
                  Full Name
                </p>
                <Controller control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="Enter your full name"
                      placeholderTextColor={theme.tertiaryText}
                      error={errors.fullName?.message}
                      containerStyle={{ marginBottom: 0 }}
                      style={{ color: theme.text }}
                    />
                  )}
                />
              </div>

              {/* Phone Field — read-only; user must tap Verify/Change to update via OTP */}
              <div className="mb-5">
                <p
                  className="mb-2 text-sm font-semibold"
                  style={{ color: theme.secondaryText }}
                >
                  Phone Number
                </p>
                <div className="flex flex-row items-center gap-2">
                  <TextInput value={currentPhone}
                    placeholder="Tap 'Verify' to add"
                    placeholderTextColor={theme.tertiaryText}
                    editable={false}
                    keyboardType="phone-pad"
                    error={errors.phone?.message}
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                    style={{ color: theme.text }}
                  />
                  <button
                    type="button"
                    onClick={() => setOtpSheetVisible(true)}
                    className="rounded-[10px] border px-3.5 py-2.5 text-[13px] font-bold transition active:opacity-70"
                    style={{
                      backgroundColor: theme.primary + "18",
                      borderColor: theme.primary + "44",
                      color: theme.primary,
                    }}
                  >
                    {user?.isPhoneVerified && !phoneChanged ? "Change" : "Verify"}
                  </button>
                </div>
                {isPhoneVerified ? (
                  <div className="mt-1.5 flex flex-row items-center gap-1.5">
                    <ShieldCheck size={14} color="#16a34a" />
                    <span className="text-xs font-bold" style={{ color: "#16a34a" }}>
                      Verified
                    </span>
                  </div>
                ) : phoneChanged ? (
                  <div className="mt-1.5 flex flex-row items-center gap-1">
                    <CircleAlert size={14} color="#ea580c" />
                    <span className="text-xs font-semibold" style={{ color: "#ea580c" }}>
                      Please verify this number before saving
                    </span>
                  </div>
                ) : null}
              </div>
        </div>
      </AppSheet>

      <IOSAlertDialog visible={alertVisible}
        onClose={handleAlertClose}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: "OK", style: "default" }]}
      />

      {/* OTP Sheet for phone verification */}
      <PhoneOtpSheet visible={otpSheetVisible}
        initialPhone={currentPhone || ""}
        onVerified={(phone) => {
          setValue("phone", phone);
          setVerifiedPhone(phone);
          setOtpSheetVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setOtpSheetVisible(false)}
      />
    </>
  );
};

export default EditProfileModal;
