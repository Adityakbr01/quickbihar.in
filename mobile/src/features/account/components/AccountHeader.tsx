import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { User02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface AccountHeaderProps {
  theme: Theme;
  styles: any;
  name: string;
  email: string;
}

const AccountHeader = ({ theme, styles, name, email }: AccountHeaderProps) => {
  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Future Edit logic
  };

  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <HugeiconsIcon
          icon={User02Icon}
          size={40}
          color={theme.primary}
          strokeWidth={1.5}
        />
        <TouchableOpacity
          style={styles.editBadge}
          onPress={handleEditProfile}
          activeOpacity={0.8}
        >
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            size={12}
            color="#fff"
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{name}</Text>
        <Text style={styles.userEmail}>{email}</Text>
      </View>
    </View>
  );
};

export default AccountHeader;
