import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View
} from "react-native";
import { useAuthStore } from "../../auth/store/authStore";
import { useProfile } from "../hooks/useProfile";
import { ProfileFormValues, profileSchema } from "../schema/profile.schema";
import { createProfileStyles } from "../styles/profileStyles";

import ProfileAvatar from "../components/ProfileAvatar";
import ProfileDetailsView from "../components/ProfileDetailsView";
import ProfileEditForm from "../components/ProfileEditForm";

const ProfileInfoScreen = () => {
  const theme = useTheme();
  const styles = createProfileStyles(theme);
  const { profile, isLoading, updateProfile, updateAvatar, isUpdating } = useProfile();
  const userFromStore = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const displayUser = profile || userFromStore;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: displayUser?.fullName || "",
      phone: displayUser?.phone || "",
    },
  });

  useEffect(() => {
    if (displayUser) {
      reset({
        fullName: displayUser.fullName,
        phone: displayUser.phone || "",
      });
    }
  }, [displayUser, reset]);

  const showAlert = (title: string, message?: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const onSave = async (data: ProfileFormValues) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await updateProfile.mutateAsync(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
      showAlert("Profile Updated", "Your changes have been saved successfully.");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Update Failed", err.message || "Something went wrong. Please try again.");
    }
  };

  const handleUpdateAvatar = async (formData: FormData) => {
    try {
      await updateAvatar.mutateAsync(formData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert("Upload Failed", err.message || "Could not update your profile picture.");
    }
  };

  if (isLoading && !userFromStore) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <ProfileAvatar
              avatarUrl={displayUser?.avatar?.url}
              onUpdateAvatar={handleUpdateAvatar}
              isUpdating={updateAvatar.isPending}
              showAlert={showAlert}
              theme={theme}
              styles={styles}
            />

            <View style={styles.nameContainer}>
              <Text style={styles.fullName}>{displayUser?.fullName}</Text>
              <Text style={styles.username}>@{displayUser?.username}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{displayUser?.role}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {isEditing ? (
            <ProfileEditForm
              control={control}
              errors={errors}
              onSubmit={handleSubmit(onSave)}
              onCancel={() => setIsEditing(false)}
              isLoading={isUpdating}
              theme={theme}
              styles={styles}
            />
          ) : (
            <ProfileDetailsView
              email={displayUser?.email || ""}
              phone={displayUser?.phone || ""}
              role={displayUser?.role || ""}
              createdAt={displayUser?.createdAt || ""}
              onEdit={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditing(true);
              }}
              theme={theme}
              styles={styles}
            />
          )}

          <Text style={styles.memberSince}>
            QuickBihar ID: {displayUser?._id}
          </Text>
        </View>
      </ScrollView>

      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        buttons={[{ text: "OK", style: "default" }]}
      />
    </KeyboardAvoidingView>
  );
};

export default ProfileInfoScreen;
