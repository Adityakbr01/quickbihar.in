import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { 
  Home01Icon, 
  Briefcase01Icon, 
  Location01Icon, 
  Edit02Icon, 
  Delete02Icon,
  CheckmarkCircle02Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { AddressType, IAddress } from "../schema/address.schema";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface AddressCardProps {
  address: IAddress;
  theme: Theme;
  styles: any;
  onEdit: (address: IAddress) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  theme,
  styles,
  onEdit,
  onDelete,
  onSetDefault,
}) => {
  const getTypeIcon = () => {
    switch (address.addressType) {
      case AddressType.HOME:
        return Home01Icon;
      case AddressType.WORK:
        return Briefcase01Icon;
      default:
        return Location01Icon;
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onEdit(address)}
      style={[
        styles.addressCard,
        address.isDefault && styles.activeAddressCard
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{address.addressType}</Text>
        </View>
        
        {address.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>DEFAULT</Text>
          </View>
        )}

        {address.latitude !== undefined && address.latitude !== 0 && (
          <View style={styles.pinBadge}>
            <HugeiconsIcon icon={Location01Icon} size={12} color={theme.primary} />
            <Text style={styles.pinText}>PINNED</Text>
          </View>
        )}
      </View>

      <Text style={styles.nameText}>{address.fullName}</Text>
      <Text style={styles.phoneText}>{address.phone}</Text>
      
      <Text style={styles.addressText} numberOfLines={3}>
        {address.street}, {address.landmark ? `${address.landmark}, ` : ""}{address.city}, {address.state} - {address.pincode}
      </Text>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onEdit(address)}
        >
          <HugeiconsIcon icon={Edit02Icon} size={18} color={theme.text} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => onDelete(address._id)}
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} color="#FF3B30" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>

        {!address.isDefault && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onSetDefault(address._id)}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>Set Default</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AddressCard;
