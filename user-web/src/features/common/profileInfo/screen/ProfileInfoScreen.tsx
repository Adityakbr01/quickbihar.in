import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "@/lib/haptics";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/src/lib/utils";

import { useProfile } from "../hooks/useProfile";
import { ProfileFormValues, profileSchema } from "../schema/profile.schema";

import ProfileAvatar from "../components/ProfileAvatar";
import ProfileDetailsView from "../components/ProfileDetailsView";
import ProfileEditForm from "../components/ProfileEditForm";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import PhoneOtpSheet from "@/src/features/common/address/components/PhoneOtpSheet";

const ProfileInfoScreen = () => {
  const theme = useTheme();
  const { profile, isLoading, updateProfile, updateAvatar, isUpdating } = useProfile();
  const userFromStore = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);

  // Track verified phone in this editing session
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(
    userFromStore?.isPhoneVerified ? (userFromStore.phone ?? null) : null
  );

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

  // ponytail: role may arrive as a populated object {_id, name, description},
  // a plain string, or (raw profile payloads) as `roleId` — guard all shapes here, once.
  const roleLabel: string = (() => {
    const r = (displayUser as any)?.role ?? (displayUser as any)?.roleId;
    if (!r) return "";
    if (typeof r === "string") return r;
    return r?.name ?? "";
  })();

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
      fullName: displayUser?.fullName || "",
      phone: displayUser?.phone || "",
    },
  });

  const currentPhone = watch("phone");
  const originalPhone = displayUser?.phone || "";
  const phoneChanged = currentPhone !== originalPhone;
  const isPhoneVerified = verifiedPhone !== null && verifiedPhone === currentPhone;

  useEffect(() => {
    if (displayUser) {
      reset({
        fullName: displayUser.fullName,
        phone: displayUser.phone || "",
      });
      setVerifiedPhone(
        userFromStore?.isPhoneVerified ? (userFromStore.phone ?? null) : null
      );
    }
  }, [displayUser, reset]);

  const showAlert = (title: string, message?: string) => {
    setAlertConfig({ visible: true, title, message });
  };

  const onSave = async (data: ProfileFormValues) => {
    // Block if phone changed but not verified
    if (phoneChanged && !isPhoneVerified) {
      showAlert(
        "Phone Not Verified",
        "Please verify your new phone number via WhatsApp OTP before saving."
      );
      return;
    }

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
      <div
        className={cn("flex min-h-[40vh] flex-1 items-center justify-center")}
        style={{ backgroundColor: theme.background }}
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-black/10"
          style={{ borderTopColor: theme.primary }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn("min-h-full flex-1")}
      style={{ backgroundColor: theme.background }}
    >
      <div className="overflow-auto">
        <div className="overflow-hidden rounded-b-[30px] pb-10">
          <div className="flex flex-col items-center pt-2.5">
            <ProfileAvatar
              avatarUrl={displayUser?.avatar?.url}
              onUpdateAvatar={handleUpdateAvatar}
              isUpdating={updateAvatar.isPending}
              showAlert={showAlert}
              theme={theme}
            />

            <div className="mt-[15px] flex flex-col items-center">
              <span
                className="text-2xl font-extrabold"
                style={{ color: theme.text }}
              >
                {displayUser?.fullName}
              </span>
              <span
                className="mt-1 text-base"
                style={{ color: theme.secondaryText }}
              >
                @{displayUser?.username}
              </span>
              <div
                className="mt-2.5 rounded-full px-3 py-1"
                style={{ backgroundColor: theme.primary + "20" }}
              >
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: theme.primary }}
                >
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[-30px] flex-1 p-5">
          {isEditing ? (
            <ProfileEditForm
              control={control}
              errors={errors}
              onSubmit={handleSubmit(onSave)}
              onCancel={() => setIsEditing(false)}
              isLoading={isUpdating}
              theme={theme}
              // Phone OTP props passed down
              currentPhone={currentPhone}
              isPhoneVerified={isPhoneVerified}
              phoneChanged={phoneChanged}
              onRequestPhoneVerify={() => setOtpSheetVisible(true)}
            />
          ) : (
            <ProfileDetailsView
              email={displayUser?.email || ""}
              phone={displayUser?.phone || ""}
              role={roleLabel}
              createdAt={displayUser?.createdAt || ""}
              onEdit={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditing(true);
              }}
              theme={theme}
            />
          )}

          <p
            className="mt-[30px] text-center text-xs"
            style={{ color: theme.tertiaryText }}
          >
            QuickBihar ID: {displayUser?._id}
          </p>
        </div>
      </div>

      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
        buttons={[{ text: "OK", style: "default" }]}
      />

      {/* OTP sheet for phone verification in profile edit */}
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
    </div>
  );
};

export default ProfileInfoScreen;
