import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useAddressActions, useAddresses } from "@/src/features/common/address/hooks/useAddress";
import { AddressType, IAddress } from "@/src/features/common/address/schema/address.schema";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";

export default function JeweleryAddressesScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();

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
    router.push({
      pathname: "/jewelery/address-form" as any,
      params: returnTo ? { returnTo } : {},
    });
  };

  const handleEditAddress = (address: IAddress) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/jewelery/address-form" as any,
      params: {
        id: address._id,
        data: JSON.stringify(address),
        ...(returnTo ? { returnTo } : {}),
      },
    });
  };

  const handleDeleteAddress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAlertConfig({
      visible: true,
      title: "Remove Address",
      message: "Are you sure you want to remove this delivery address?",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAddress.mutateAsync(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              setAlertConfig({
                visible: true,
                title: "Error",
                message: "Failed to remove address. Please try again.",
                buttons: [{ text: "OK" }],
              });
            }
          },
        },
      ],
    });
  };

  const handleSetDefault = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await setDefaultAddress.mutateAsync(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setAlertConfig({
        visible: true,
        title: "Error",
        message: "Failed to set default address.",
        buttons: [{ text: "OK" }],
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (returnTo) {
      router.replace(returnTo as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/jewelery/(tabs)/profile" as any);
    }
  };

  const getTypeIcon = (type: AddressType) => {
    switch (type) {
      case AddressType.HOME:
        return "home";
      case AddressType.WORK:
        return "briefcase";
      default:
        return "map-pin";
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.ivory }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: colors.ivory,
            borderBottomColor: colors.midGray,
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} color={colors.ink} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.ink,
                fontFamily: "CormorantGaramond_600SemiBold",
              },
            ]}
          >
            SAVED ADDRESSES
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
            ]}
          >
            {addresses && addresses.length > 0
              ? `${addresses.length} address${addresses.length === 1 ? "" : "es"} on file`
              : "Manage delivery addresses"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.headerAddBtn, { borderColor: colors.gold }]}
          onPress={handleAddAddress}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={14} color={colors.gold} />
          <Text
            style={[
              styles.headerAddBtnText,
              { color: colors.gold, fontFamily: "DMSans_500Medium" },
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPad + 70 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.gold}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text
              style={[
                styles.loadingText,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Loading addresses...
            </Text>
          </View>
        ) : addresses && addresses.length > 0 ? (
          <View style={styles.addressList}>
            {addresses.map((address) => {
              const isPinned =
                address.latitude !== undefined &&
                address.latitude !== 0 &&
                Number.isFinite(Number(address.latitude));

              return (
                <View
                  key={address._id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: address.isDefault ? colors.gold : colors.border,
                      borderWidth: address.isDefault ? 1.5 : 1,
                    },
                  ]}
                >
                  {/* Card Header Badges */}
                  <View style={styles.cardHeader}>
                    <View style={styles.badgesLeft}>
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: colors.champagne,
                            borderColor: colors.gold,
                          },
                        ]}
                      >
                        <Feather
                          name={getTypeIcon(address.addressType) as any}
                          size={10}
                          color={colors.gold}
                        />
                        <Text
                          style={[
                            styles.badgeText,
                            { color: colors.gold, fontFamily: "DMSans_500Medium" },
                          ]}
                        >
                          {address.addressType}
                        </Text>
                      </View>

                      {address.isDefault && (
                        <View
                          style={[
                            styles.badge,
                            { backgroundColor: colors.gold },
                          ]}
                        >
                          <Feather name="check" size={10} color={colors.onBrand} />
                          <Text
                            style={[
                              styles.badgeText,
                              { color: colors.onBrand, fontFamily: "DMSans_700Bold" },
                            ]}
                          >
                            DEFAULT
                          </Text>
                        </View>
                      )}

                      {isPinned && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.pearl,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Ionicons
                            name="location-sharp"
                            size={10}
                            color={colors.gold}
                          />
                          <Text
                            style={[
                              styles.badgeText,
                              { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                            ]}
                          >
                            PINNED
                          </Text>
                        </View>
                      )}

                      {address.isPhoneVerified && (
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: colors.champagne,
                              borderColor: colors.gold,
                            },
                          ]}
                        >
                          <Ionicons
                            name="shield-checkmark"
                            size={10}
                            color={colors.gold}
                          />
                          <Text
                            style={[
                              styles.badgeText,
                              { color: colors.gold, fontFamily: "DMSans_500Medium" },
                            ]}
                          >
                            VERIFIED
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Address Details */}
                  <Text
                    style={[
                      styles.cardName,
                      {
                        color: colors.ink,
                        fontFamily: "CormorantGaramond_600SemiBold",
                      },
                    ]}
                  >
                    {address.fullName}
                  </Text>

                  <View style={styles.phoneRow}>
                    <Feather name="phone" size={11} color={colors.warmGray} />
                    <Text
                      style={[
                        styles.cardPhone,
                        { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                      ]}
                    >
                      {address.phone}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.cardAddress,
                      { color: colors.ink, fontFamily: "DMSans_400Regular" },
                    ]}
                  >
                    {address.street}
                    {address.landmark ? `, Near ${address.landmark}` : ""}
                    {"\n"}
                    {address.city}, {address.state} — {address.pincode}
                  </Text>

                  {/* Actions Divider */}
                  <View
                    style={[
                      styles.cardDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleEditAddress(address)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={13} color={colors.ink} />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: colors.ink, fontFamily: "DMSans_500Medium" },
                        ]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDeleteAddress(address._id)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={13} color="#b91c1c" />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: "#b91c1c", fontFamily: "DMSans_500Medium" },
                        ]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>

                    {!address.isDefault && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.setDefaultBtn]}
                        onPress={() => handleSetDefault(address._id)}
                        activeOpacity={0.7}
                      >
                        <Feather
                          name="check-circle"
                          size={13}
                          color={colors.gold}
                        />
                        <Text
                          style={[
                            styles.actionBtnText,
                            { color: colors.gold, fontFamily: "DMSans_500Medium" },
                          ]}
                        >
                          Set Default
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyIconWrap,
                {
                  backgroundColor: colors.champagne,
                  borderColor: colors.gold,
                },
              ]}
            >
              <Feather name="map-pin" size={32} color={colors.gold} />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                {
                  color: colors.ink,
                  fontFamily: "CormorantGaramond_600SemiBold",
                },
              ]}
            >
              No Addresses Saved
            </Text>
            <Text
              style={[
                styles.emptySub,
                { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
              ]}
            >
              Save your delivery addresses for an effortless, seamless shopping experience.
            </Text>
            <TouchableOpacity
              style={[styles.addFirstBtn, { backgroundColor: colors.gold }]}
              onPress={handleAddAddress}
              activeOpacity={0.88}
            >
              <Feather name="plus" size={15} color={colors.onBrand} />
              <Text
                style={[
                  styles.addFirstBtnText,
                  { color: colors.onBrand, fontFamily: "DMSans_600SemiBold" },
                ]}
              >
                ADD DELIVERY ADDRESS
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button when addresses exist */}
      {addresses && addresses.length > 0 && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.gold,
              bottom: bottomPad + 16,
            },
          ]}
          onPress={handleAddAddress}
          activeOpacity={0.88}
        >
          <Feather name="plus" size={22} color={colors.onBrand} />
        </TouchableOpacity>
      )}

      {/* Alert Dialog */}
      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 2,
  },
  headerAddBtnText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  addressList: {
    gap: 14,
  },
  card: {
    borderRadius: 3,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badgesLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  badgeText: {
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  cardName: {
    fontSize: 17,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  cardPhone: {
    fontSize: 12,
  },
  cardAddress: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  cardDivider: {
    height: 0.5,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },
  setDefaultBtn: {
    marginLeft: "auto",
  },
  actionBtnText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 70,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  addFirstBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addFirstBtnText: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});
