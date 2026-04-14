import React from "react";
import { View, Text } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface ProfileInfoRowProps {
  icon: any;
  label: string;
  value: string;
  theme: Theme;
  styles: any;
}

const ProfileInfoRow: React.FC<ProfileInfoRowProps> = ({
  icon,
  label,
  value,
  theme,
  styles,
}) => {
  return (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <HugeiconsIcon icon={icon} size={20} color={theme.primary} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "Not provided"}</Text>
      </View>
    </View>
  );
};

export default ProfileInfoRow;
