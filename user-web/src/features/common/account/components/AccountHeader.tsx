import React from "react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Camera, Pencil } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import * as ImagePicker from "@/src/lib/photoPicker";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useAccount } from "../hooks/useAccount";
import { useAccountStore } from "../store/accountStore";

interface AccountHeaderProps {
  theme: Theme;
  styles?: any;
  name: string;
  email: string;
  avatarUrl?: string;
}

const AccountHeader = ({ theme, name, email, avatarUrl }: AccountHeaderProps) => {
  const { updateAvatar, isUpdating } = useAccount();
  const setEditModalVisible = useAccountStore((state) => state.setEditModalVisible);

  // Derive initials for the fallback avatar safely
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "Guest";
  const initials =
    safeName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => (w && w[0] ? w[0].toUpperCase() : ""))
      .join("") || "?";

  // Alert State
  const [alertVisible, setAlertVisible] = React.useState(false);
  const [alertConfig, setAlertConfig] = React.useState({ title: "", message: "" });

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditModalVisible(true);
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedImage = result.assets[0];

      // Edge Case: Check for large images (optional but good for UX)
      if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          setAlertConfig({ title: "Image Too Large", message: "Please select an image smaller than 5MB." });
          setAlertVisible(true);
          return;
      }

      const formData = new FormData();
      // @ts-ignore
      if (selectedImage.file) {
        formData.append(
          "avatar",
          selectedImage.file,
          selectedImage.fileName || `avatar_${Date.now()}.jpg`
        );
      } else {
        formData.append("avatar", {
          uri: selectedImage.uri,
          name: `avatar_${Date.now()}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      updateAvatar.mutate(formData, {
        onSuccess: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // No delay needed here as there's no modal to hide
            setAlertConfig({ title: "Avatar Updated", message: "Your profile picture has been changed." });
            setAlertVisible(true);
        },
        onError: (error: any) => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const message = error.response?.data?.message || "Could not upload image. Please try again.";
            setAlertConfig({ title: "Upload Failed", message });
            setAlertVisible(true);
        }
      });
    }
  };

  return (
    <div
      className="flex flex-row items-center px-6 pb-[30px] pt-5"
    >
      <button
        type="button"
        onClick={handlePickImage}
        disabled={isUpdating}
        aria-label="Change profile picture"
        className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 transition active:opacity-70 disabled:opacity-70"
        style={{
          backgroundColor: (theme as any).tertiaryBackground,
          borderColor: (theme as any).primary,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={safeName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          // Initials fallback — works on all platforms, no SVG transformer needed
          <div
            className="flex h-full w-full items-center justify-center rounded-full"
            style={{ backgroundColor: (theme as any).primary }}
          >
            <span
              className="text-[26px] font-extrabold tracking-[1px] text-white"
            >
              {initials}
            </span>
          </div>
        )}

        {isUpdating && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
            <span
              role="status"
              aria-label="Uploading avatar"
              className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
            />
          </div>
        )}

        <div
          className="absolute -bottom-1 -right-1 rounded-xl border-2 p-1.5"
          style={{
            backgroundColor: (theme as any).secondaryBackground,
            borderColor: (theme as any).background,
          }}
        >
           <AppIcon
            icon={Camera}
            size={12}
            color={(theme as any).primary}
          />
        </div>
      </button>

      <div className="ml-4 flex-1">
        <div className="flex flex-row items-center justify-between">
            <div className="min-w-0">
                <p
                  className="truncate text-2xl font-extrabold"
                  style={{ color: (theme as any).text }}
                >
                  {name}
                </p>
                <p
                  className="mt-1 truncate text-sm"
                  style={{ color: (theme as any).secondaryText }}
                >
                  {email}
                </p>
            </div>
            <button
                type="button"
                onClick={handleEditProfile}
                aria-label="Edit profile"
                className="ml-3 shrink-0 rounded-[10px] p-2 transition active:opacity-70"
                style={{ backgroundColor: (theme as any).tertiaryBackground }}
            >
                <AppIcon icon={Pencil} size={18} color={(theme as any).primary} />
            </button>
        </div>
      </div>

      <IOSAlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: "OK", style: "default" }]}
      />
    </div>
  );
};

export default AccountHeader;
