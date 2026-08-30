import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import {
  Mail01Icon,
  CallIcon,
  UserCircleIcon,
  Calendar03Icon,
  Edit02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import ProfileInfoRow from "./ProfileInfoRow";
import { useAccountStore } from "@/src/features/common/account/store/accountStore";
import dayjs from "dayjs";

interface ProfileDetailsViewProps {
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  onEdit: () => void;
  theme: Theme;
  styles: any;
}

const ProfileDetailsView: React.FC<ProfileDetailsViewProps> = ({
  email,
  phone,
  role,
  createdAt,
  onEdit,
  theme,
  styles,
}) => {
  const setPasswordSheetVisible = useAccountStore(
    (state) => state.setPasswordSheetVisible,
  );

  return (
    <View style={styles.infoCard}>
      <ProfileInfoRow
        icon={Mail01Icon}
        label="Email Address"
        value={email}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={CallIcon}
        label="Phone Number"
        value={phone}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={UserCircleIcon}
        label="Account Type"
        value={role?.toUpperCase() || ""}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={Calendar03Icon}
        label="Member Since"
        value={dayjs(createdAt).format("MMM DD, YYYY")}
        theme={theme}
        styles={styles}
      />

      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <HugeiconsIcon icon={Edit02Icon} size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Personal Details</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.editButton, { marginTop: 10, backgroundColor: "#1e293b" }]}
        onPress={() => setPasswordSheetVisible(true)}
      >
        <Text style={styles.editButtonText}>🔐 Password & Email Setup</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileDetailsView;
