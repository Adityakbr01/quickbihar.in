import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Calendar, CircleUser, Mail, Phone, SquarePen } from "lucide-react";
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
        icon={Mail}
        label="Email Address"
        value={email}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={Phone}
        label="Phone Number"
        value={phone}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={CircleUser}
        label="Account Type"
        value={role?.toUpperCase() || ""}
        theme={theme}
        styles={styles}
      />
      <ProfileInfoRow
        icon={Calendar}
        label="Member Since"
        value={dayjs(createdAt).format("MMM DD, YYYY")}
        theme={theme}
        styles={styles}
      />

      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <AppIcon icon={SquarePen} size={20} color="#fff" />
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
