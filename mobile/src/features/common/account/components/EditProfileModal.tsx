import React, { useEffect } from "react";
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

const EditProfileModal = () => {
  const theme = useTheme();
  const styles = createAccountStyles(theme);
  const user = useAuthStore((state) => state.user);
  const isVisible = useAccountStore((state) => state.isEditModalVisible);
  const setVisible = useAccountStore((state) => state.setEditModalVisible);
  const sheet = useSheet();

  // Alert State
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState({
    title: "",
    message: "",
  });

  const { updateProfile, isUpdating } = useAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
    },
  });

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isVisible && user) {
      reset({
        fullName: user.fullName,
        phone: user.phone || "",
      });
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

  const onSubmit = (data: ProfileFormValues) => {
    console.log("[DEBUG_PROFILE] Modal Submit Button Pressed", data);

    // Edge Case: No Changes
    if (
      data.fullName === user?.fullName &&
      data.phone === (user?.phone || "")
    ) {
      console.log("[DEBUG_PROFILE] No changes detected, closing modal.");
      setVisible(false);
      return;
    }

    // Dismiss keyboard immediately to prevent layout shifts during transition
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    updateProfile.mutate(data, {
      onSuccess: () => {
        console.log("[DEBUG_PROFILE] Update successful, showing alert.");
        // Show success alert immediately WITHOUT dismissing modal
        setAlertConfig({
          title: "Profile Updated",
          message: "Your profile information has been saved successfully.",
        });
        setAlertVisible(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      },
      onError: (error: any) => {
        console.error("[DEBUG_PROFILE] Update failed in component:", error);
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
    // If it was a success alert, THEN close the drawer
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

          {/* Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.phone && { borderColor: theme.error },
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Enter your phone number"
                  placeholderTextColor={theme.tertiaryText}
                  keyboardType="phone-pad"
                />
              )}
            />
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
    </>
  );
};

export default EditProfileModal;
