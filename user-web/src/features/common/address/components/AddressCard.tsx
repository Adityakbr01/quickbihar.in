import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { AppIcon } from "@/src/components/common/AppIcon";
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
        return "home-outline";
      case AddressType.WORK:
        return "briefcase-outline";
      default:
        return "location-outline";
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
            <AppIcon name="location-outline" size={12} color={theme.primary} />
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
          <AppIcon name="create-outline" size={18} color={theme.text} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteAction]}
          onPress={() => onDelete(address._id)}
        >
          <AppIcon name="trash-outline" size={18} color="#FF3B30" />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>

        {!address.isDefault && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onSetDefault(address._id)}
          >
            <AppIcon name="checkmark-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.actionText, { color: theme.primary }]}>Set Default</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AddressCard;
