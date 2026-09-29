import React from "react";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Calendar, CircleUser, Mail, Phone, SquarePen } from "lucide-react";
import { useTheme, type Theme } from "@/src/theme/Provider/ThemeProvider";
import ProfileInfoRow from "./ProfileInfoRow";
import { useAccountStore } from "@/src/features/common/account/store/accountStore";
import dayjs from "dayjs";
import { cn } from "@/src/lib/utils";

interface ProfileDetailsViewProps {
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  onEdit: () => void;
  theme?: Theme;
  styles?: any;
}

const ProfileDetailsView: React.FC<ProfileDetailsViewProps> = ({
  email,
  phone,
  role,
  createdAt,
  onEdit,
  theme: themeProp,
}) => {
  const hookTheme = useTheme();
  const theme = (themeProp ?? hookTheme) as Theme;
  const setPasswordSheetVisible = useAccountStore(
    (state) => state.setPasswordSheetVisible,
  );

  return (
    <div
      className={cn("rounded-[20px] p-5 shadow-lg")}
      style={{ backgroundColor: theme.background }}
    >
      <ProfileInfoRow
        icon={Mail}
        label="Email Address"
        value={email}
        theme={theme}
      />
      <ProfileInfoRow
        icon={Phone}
        label="Phone Number"
        value={phone}
        theme={theme}
      />
      <ProfileInfoRow
        icon={CircleUser}
        label="Account Type"
        value={role?.toUpperCase() || ""}
        theme={theme}
      />
      <ProfileInfoRow
        icon={Calendar}
        label="Member Since"
        value={dayjs(createdAt).format("MMM DD, YYYY")}
        theme={theme}
      />

      <button
        type="button"
        onClick={onEdit}
        className="mt-[30px] flex h-14 w-full flex-row items-center justify-center gap-2.5 rounded-2xl"
        style={{ backgroundColor: theme.primary }}
      >
        <AppIcon icon={SquarePen} size={20} color="#fff" />
        <span className="text-base font-bold text-white">Edit Personal Details</span>
      </button>

      <button
        type="button"
        onClick={() => setPasswordSheetVisible(true)}
        className="mt-2.5 flex h-14 w-full flex-row items-center justify-center gap-2.5 rounded-2xl"
        style={{ backgroundColor: "#1e293b" }}
      >
        <span className="text-base font-bold text-white">🔐 Password & Email Setup</span>
      </button>
    </div>
  );
};

export default ProfileDetailsView;
