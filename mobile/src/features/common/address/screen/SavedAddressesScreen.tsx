import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AppIcon } from "@/src/components/common/AppIcon";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAddressStyles } from "../style/addressStyles";
import { useAddresses, useAddressActions } from "../hooks/useAddress";
import AddressCard from "../components/AddressCard";
import { AddressCardSkeleton } from "../components/AddressCardSkeleton";
import { IAddress } from "../schema/address.schema";
import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import { useState } from "react";

const SavedAddressesScreen = () => {
  const theme = useTheme();
  const styles = createAddressStyles(theme);
  const router = useRouter();

  const { data: addresses, isLoading, refetch } = useAddresses();
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
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to set default address.",
        buttons: [{ text: "OK" }]
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/clothing/home");
  };

  const renderSkeletons = () => (
    <View>
      {[0, 1, 2].map((i) => (
        <AddressCardSkeleton key={i} />
      ))}
    </View>
  );

  return (
    <SafeViewWrapper>
    <View style={styles.container}>
      {/* Top app bar (same language as Notifications) */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.appBarTitleWrap}>
          <Text style={styles.appBarTitle}>Saved Addresses</Text>
          <Text style={styles.appBarSubtitle}>
            {addresses && addresses.length > 0
              ? `${addresses.length} address${addresses.length === 1 ? "" : "es"} saved`
              : "Manage your delivery addresses"}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={theme.primary}
            />
          }
        >
          {isLoading ? (
            renderSkeletons()
          ) : addresses && addresses.length > 0 ? (
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
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: theme.primary + "15" },
                ]}
              >
                <Ionicons name="location-outline" size={52} color={theme.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Saved Addresses</Text>
              <Text style={styles.emptySubtitle}>
                Add your delivery address to enjoy a faster checkout experience.
              </Text>
              <TouchableOpacity
                style={[styles.submitButton, { width: 220, marginTop: 20, height: 50 }]}
                onPress={handleAddAddress}
                activeOpacity={0.85}
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
          <AppIcon name="add-circle-outline" size={32} color="#fff" />
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
    </SafeViewWrapper>
  );
};

export default SavedAddressesScreen;
