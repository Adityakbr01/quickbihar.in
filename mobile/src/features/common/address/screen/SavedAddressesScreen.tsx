import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { MapPinPlusIcon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAddressStyles } from "../style/addressStyles";
import { useAddresses, useAddressActions } from "../hooks/useAddress";
import AddressCard from "../components/AddressCard";
import { IAddress } from "../schema/address.schema";
import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useState } from "react";

const SavedAddressesScreen = () => {
  const theme = useTheme();
  const styles = createAddressStyles(theme);
  const router = useRouter();

  const { data: addresses, isLoading, error } = useAddresses();
  const { deleteAddress, setDefaultAddress } = useAddressActions();

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: "",
    buttons: [],
  });

  const handleAddAddress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/account/address-form");
  };

  const handleEditAddress = (address: IAddress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/account/address-form",
      params: { id: address._id, data: JSON.stringify(address) }
    });
  };

  const handleDeleteAddress = (id: string) => {
    setAlertConfig({
      visible: true,
      title: "Delete Address",
      message: "Are you sure you want to delete this address? This action cannot be undone.",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (err) {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to delete address. Please try again.",
                buttons: [{ text: "OK" }]
              });
            }
          }
        }
      ]
    });
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert("Error", "Failed to set default address");
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {addresses && addresses.length > 0 ? (
            addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                theme={theme}
                styles={styles}
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefault}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <HugeiconsIcon icon={Location01Icon} size={80} color={theme.tertiaryText} />
              <Text style={styles.emptyTitle}>No Saved Addresses</Text>
              <Text style={styles.emptySubtitle}>
                Add your delivery address to enjoy faster checkout experience.
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, { width: 200, marginTop: 30 }]}
                onPress={handleAddAddress}
              >
                <Text style={styles.submitButtonText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {addresses && addresses.length > 0 && (
        <TouchableOpacity
          style={styles.addButtonFloating}
          onPress={handleAddAddress}
        >
          <HugeiconsIcon icon={MapPinPlusIcon} size={32} color="#fff" />
        </TouchableOpacity>
      )}

      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

export default SavedAddressesScreen;
