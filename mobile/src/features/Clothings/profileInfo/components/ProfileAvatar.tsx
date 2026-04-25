import React from "react";
import { View, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProfileAvatarProps {
  avatarUrl?: string;
  onUpdateAvatar: (formData: FormData) => Promise<void>;
  isUpdating: boolean;
  showAlert: (title: string, message?: string) => void;
  theme: Theme;
  styles: any;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  onUpdateAvatar,
  isUpdating,
  showAlert,
  theme,
  styles,
}) => {
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
        const uri = result.assets[0].uri;
        const filename = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename || "");
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append("avatar", {
          uri,
          name: filename,
          type,
        } as any);

        await onUpdateAvatar(formData);
      }
    } catch (error) {
      console.error("Image Pick Error:", error);
      showAlert("Error", "Could not select image. Please try again.");
    }
  };

  return (
    <View style={styles.avatarContainer}>
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require("@/assets/images/default-avatar.svg")
        }
        style={[styles.avatar, isUpdating && { opacity: 0.6 }]}
      />
      {isUpdating && (
        <View style={[styles.avatar, { position: "absolute", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)" }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}
      <TouchableOpacity
        style={styles.editAvatarButton}
        onPress={handlePickImage}
        disabled={isUpdating}
      >
        <HugeiconsIcon icon={Camera01Icon} size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileAvatar;
