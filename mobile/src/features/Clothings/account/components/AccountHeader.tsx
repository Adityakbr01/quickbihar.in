import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { User02Icon, PencilEdit01Icon, Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { useAccount } from "../hooks/useAccount";
import { useAccountStore } from "../store/accountStore";

interface AccountHeaderProps {
  theme: Theme;
  styles: any;
  name: string;
  email: string;
  avatarUrl?: string;
}

const AccountHeader = ({ theme, styles, name, email, avatarUrl }: AccountHeaderProps) => {
  const { updateAvatar, isUpdating } = useAccount();
  const setEditModalVisible = useAccountStore((state) => state.setEditModalVisible);

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
      formData.append("avatar", {
        uri: selectedImage.uri,
        name: `avatar_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

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
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.avatarContainer} 
        onPress={handlePickImage}
        disabled={isUpdating}
        activeOpacity={0.7}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: "100%", height: "100%", borderRadius: 40 }}
            contentFit="cover"
            transition={500}
          />
        ) : (
          <HugeiconsIcon
            icon={User02Icon}
            size={40}
            color={theme.primary}
            strokeWidth={1.5}
          />
        )}
        
        {isUpdating && (
          <View style={[styles.avatarContainer, { position: "absolute", backgroundColor: "rgba(0,0,0,0.3)", borderWidth: 0 }]}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        <View style={[styles.editBadge, { backgroundColor: theme.secondaryBackground, right: -4, bottom: -4 }]}>
           <HugeiconsIcon
            icon={Camera01Icon}
            size={12}
            color={theme.primary}
            strokeWidth={2}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.profileInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
                <Text style={styles.userName}>{name}</Text>
                <Text style={styles.userEmail}>{email}</Text>
            </View>
            <TouchableOpacity
                style={{ backgroundColor: theme.tertiaryBackground, padding: 8, borderRadius: 10 }}
                onPress={handleEditProfile}
            >
                <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={theme.primary} />
            </TouchableOpacity>
        </View>
      </View>

      <IOSAlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={[{ text: "OK", style: "default" }]}
      />
    </View>
  );
};

export default AccountHeader;
