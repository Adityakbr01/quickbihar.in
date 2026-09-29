import React from "react";
import * as ImagePicker from "@/src/lib/photoPicker";
import * as Haptics from "@/lib/haptics";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Camera } from "lucide-react";
import defaultAvatar from "@/assets/images/default-avatar.svg";
import { useTheme, type Theme } from "@/src/theme/Provider/ThemeProvider";
import { cn } from "@/src/lib/utils";

interface ProfileAvatarProps {
  avatarUrl?: string;
  onUpdateAvatar: (formData: FormData) => Promise<void>;
  isUpdating: boolean;
  showAlert: (title: string, message?: string) => void;
  theme?: Theme;
  styles?: any;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  onUpdateAvatar,
  isUpdating,
  showAlert,
  theme: themeProp,
}) => {
  const hookTheme = useTheme();
  const theme = (themeProp ?? hookTheme) as Theme;

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Denied", "We need your permission to access your gallery to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const asset = result.assets[0];
        const uri = asset.uri;
        const filename = asset.fileName || uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = asset.type || (match ? `image/${match[1]}` : `image`);

        const formData = new FormData();
        if (asset.file) {
          formData.append("avatar", asset.file, filename);
        } else {
          formData.append("avatar", {
            uri,
            name: filename,
            type,
          } as any);
        }

        await onUpdateAvatar(formData);
      }
    } catch (error) {
      console.error("Image Pick Error:", error);
      showAlert("Error", "Could not select image. Please try again.");
    }
  };

  return (
    <div className="relative">
      <img
        src={avatarUrl || defaultAvatar}
        alt="Profile avatar"
        className={cn("h-[120px] w-[120px] rounded-full object-cover")}
        style={{
          borderWidth: 4,
          borderStyle: "solid",
          borderColor: theme.background,
          ...(isUpdating ? { opacity: 0.6 } : null),
        }}
      />
      {isUpdating && (
        <div
          className="absolute inset-0 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-black/20"
          aria-hidden
        >
          <span
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/30"
            style={{ borderTopColor: theme.primary }}
          />
        </div>
      )}
      <button
        type="button"
        onClick={handlePickImage}
        disabled={isUpdating}
        aria-label="Change profile picture"
        className="absolute right-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-50"
        style={{
          backgroundColor: theme.primary,
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: theme.background,
        }}
      >
        <AppIcon icon={Camera} size={16} color="#fff" />
      </button>
    </div>
  );
};

export default ProfileAvatar;
