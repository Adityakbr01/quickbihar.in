import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAccountStyles } from "../styles/accountStyles";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { profileSchema, ProfileFormValues } from "../schema/account.schema";
import { useAccount } from "../hooks/useAccount";
import { useAccountStore } from "../store/accountStore";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import {
  Sheet,
  SheetHeader,
  useSheet,
} from "@/src/components/common/BottomSheet";
import PhoneOtpSheet from "@/src/features/common/address/components/PhoneOtpSheet";

const EditProfileModal = () => {
  const theme = useTheme();
  const styles = createAccountStyles(theme);
  const user = useAuthStore((state) => state.user);
  const isVisible = useAccountStore((state) => state.isEditModalVisible);
  const setVisible = useAccountStore((state) => state.setEditModalVisible);
  const sheet = useSheet();

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

  // Imperative present/dismiss from the store `isVisible` flag.
  useEffect(() => {
    if (isVisible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isVisible, sheet]);

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

    Keyboard.dismiss();
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
      <Sheet
        ref={sheet}
        onDidDismiss={() => setVisible(false)}
        backgroundColor={theme.background}
      >
        <SheetHeader
          title="Edit Profile"
          right={
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
            </TouchableOpacity>
          }
        />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10 }}
        >
          {/* Full Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.fullName && { borderColor: theme.error },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.tertiaryText}
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* Phone Field — read-only; user must tap Verify/Change to update via OTP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                style={[styles.input, { flex: 1 }, errors.phone && { borderColor: theme.error }]}
                value={currentPhone}
                placeholder="Tap 'Verify' to add"
                placeholderTextColor={theme.tertiaryText}
                editable={false}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                onPress={() => setOtpSheetVisible(true)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: theme.primary + "18",
                  borderWidth: 1,
                  borderColor: theme.primary + "44",
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>
                  {user?.isPhoneVerified && !phoneChanged ? "Change" : "Verify"}
                </Text>
              </TouchableOpacity>
            </View>
            {isPhoneVerified ? (
              <Text style={{ color: "#00C853", fontSize: 12, fontWeight: "700", marginTop: 4 }}>
                ✅ Verified
              </Text>
            ) : phoneChanged ? (
              <Text style={{ color: "#FF9800", fontSize: 12, marginTop: 4 }}>
                ⚠️ Please verify this number before saving
              </Text>
            ) : null}
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isUpdating && { opacity: 0.7 }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Sheet>

      <IOSAlertDialog
        visible={alertVisible}
        onClose={handleAlertClose}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: "OK", style: "default" }]}
      />

      {/* OTP Sheet for phone verification */}
      <PhoneOtpSheet
        visible={otpSheetVisible}
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
