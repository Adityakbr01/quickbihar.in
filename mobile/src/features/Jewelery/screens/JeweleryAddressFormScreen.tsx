import { Feather, Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { reverseGeocodeRequest } from "@/src/features/common/address/api/address.api";
import PhoneOtpSheet from "@/src/features/common/address/components/PhoneOtpSheet";
import { useAddressActions } from "@/src/features/common/address/hooks/useAddress";
import {
  AddressFormValues,
  addressSchema,
  AddressType,
} from "@/src/features/common/address/schema/address.schema";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";

export default function JeweleryAddressFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : Math.max(insets.bottom, 20);

  const { id, data, returnTo } = useLocalSearchParams<{
    id?: string;
    data?: string;
    returnTo?: string;
  }>();
  const isEditing = Boolean(id);

  const storeUser = useAuthStore((s) => s.user);
  const { createAddress, updateAddress } = useAddressActions();

  const [isLocating, setIsLocating] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    storeUser?.isPhoneVerified ?? false
  );
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);

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

  const showAlert = (
    title: string,
    message?: string,
    buttons: AlertButton[] = [{ text: "OK" }]
  ) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: "",
      phone: storeUser?.phone || "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      addressType: AddressType.HOME,
      isDefault: false,
      latitude: 0,
      longitude: 0,
    },
  });

  const addressType = useWatch({ control, name: "addressType" });
  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  const phoneValue = useWatch({ control, name: "phone" });
  const isDefault = useWatch({ control, name: "isDefault" });

  const hasLocationPin =
    Number.isFinite(Number(latitude)) &&
    Number.isFinite(Number(longitude)) &&
    !(Number(latitude) === 0 && Number(longitude) === 0);

  // Prefill when editing
  useEffect(() => {
    if (isEditing && data) {
      try {
        const addressData = JSON.parse(data);
        reset({
          fullName: addressData.fullName || "",
          phone: addressData.phone || "",
          street: addressData.street || "",
          city: addressData.city || "",
          state: addressData.state || "",
          pincode: addressData.pincode || "",
          landmark: addressData.landmark || "",
          addressType: addressData.addressType || AddressType.HOME,
          isDefault: addressData.isDefault || false,
          latitude: addressData.latitude || 0,
          longitude: addressData.longitude || 0,
        });

        const cleanAddrPhone = (addressData.phone || "").replace(/\D/g, "").slice(-10);
        const cleanUserPhone = (storeUser?.phone || "").replace(/\D/g, "").slice(-10);
        const isAddrVerified = Boolean(
          addressData.isPhoneVerified ||
            (storeUser?.isPhoneVerified && cleanUserPhone && cleanAddrPhone === cleanUserPhone)
        );
        setIsPhoneVerified(isAddrVerified);
      } catch (e) {
        console.error("Failed to parse address data:", e);
      }
    } else if (!isEditing && storeUser?.phone) {
      setValue("phone", storeUser.phone);
      setIsPhoneVerified(Boolean(storeUser.isPhoneVerified));
    }
  }, [isEditing, data, reset, setValue, storeUser]);

  // Auto request location on mount for new address
  useEffect(() => {
    if (!isEditing) {
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === "granted") {
          handleFetchLocation();
        }
      });
    }
  }, []);

  const handleFetchLocation = async () => {
    try {
      setIsLocating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        showAlert(
          "Location Disabled",
          "Location services are turned off. Please enable them in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              style: "default",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "QuickBihar needs location access to pinpoint your delivery address accurately.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              style: "default",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return;
      }

      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
      } catch {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        throw new Error("Current location is unavailable. Make sure GPS is enabled.");
      }

      const { latitude: lat, longitude: lng } = location.coords;
      setValue("latitude", lat, { shouldValidate: true, shouldDirty: true });
      setValue("longitude", lng, { shouldValidate: true, shouldDirty: true });

      let street: string | undefined;
      let city: string | undefined;
      let state: string | undefined;
      let pincode: string | undefined;

      if (Platform.OS !== "web") {
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });
          if (address) {
            const streetParts = [address.name, address.street].filter(Boolean);
            street =
              streetParts.length > 0
                ? Array.from(new Set(streetParts)).join(", ")
                : address.subregion || address.district || undefined;
            city = address.city || address.district || address.subregion || undefined;
            state = address.region || undefined;
            pincode = address.postalCode || undefined;
          }
        } catch {}
      }

      if (!city || !state || !street || !pincode) {
        try {
          const apiAddress = await reverseGeocodeRequest(lat, lng);
          if (apiAddress) {
            if (!street && apiAddress.street) street = apiAddress.street;
            if (!city && apiAddress.city) city = apiAddress.city;
            if (!state && apiAddress.state) state = apiAddress.state;
            if (!pincode && apiAddress.pincode) pincode = apiAddress.pincode;
          }
        } catch {}
      }

      if (street) setValue("street", street, { shouldValidate: true, shouldDirty: true });
      if (city) setValue("city", city, { shouldValidate: true, shouldDirty: true });
      if (state) setValue("state", state, { shouldValidate: true, shouldDirty: true });
      if (pincode && /^\d{6}$/.test(pincode)) {
        setValue("pincode", pincode, { shouldValidate: true, shouldDirty: true });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Could not fetch current location.";
      showAlert("Location Error", msg);
    } finally {
      setIsLocating(false);
    }
  };

  const onSubmit = async (formData: AddressFormValues) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const hasPin =
        Number.isFinite(Number(formData.latitude)) &&
        Number.isFinite(Number(formData.longitude)) &&
        !(Number(formData.latitude) === 0 && Number(formData.longitude) === 0);

      if (!hasPin) {
        showAlert(
          "Location Pin Required",
          "Please tap 'Use My Current Location' before saving. Delivery riders require this GPS pin for exact delivery.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      if (!isPhoneVerified) {
        showAlert(
          "Mobile Verification Required",
          "Please verify your mobile number via WhatsApp OTP before saving this address.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Verify Now",
              style: "default",
              onPress: () => setOtpSheetVisible(true),
            },
          ]
        );
        return;
      }

      if (isEditing && id) {
        await updateAddress.mutateAsync({ id, data: formData });
      } else {
        await createAddress.mutateAsync(formData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (returnTo) {
        router.replace(returnTo as any);
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/jewelery/addresses" as any);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to save address";
      showAlert("Save Failed", msg);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (returnTo) {
      router.replace(returnTo as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/jewelery/addresses" as any);
    }
  };

  const isSaving = createAddress.isPending || updateAddress.isPending;

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

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.ink,
              fontFamily: "CormorantGaramond_600SemiBold",
            },
          ]}
        >
          {isEditing ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
        </Text>

        <Feather name="shield" size={16} color={colors.gold} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPad + 90 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* GPS Location Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.locationBtn,
                {
                  backgroundColor: colors.champagne,
                  borderColor: colors.gold,
                  opacity: isLocating ? 0.7 : 1,
                },
              ]}
              onPress={handleFetchLocation}
              disabled={isLocating}
              activeOpacity={0.85}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.gold} />
              ) : (
                <Feather name="navigation" size={16} color={colors.gold} />
              )}
              <Text
                style={[
                  styles.locationBtnText,
                  { color: colors.gold, fontFamily: "DMSans_500Medium" },
                ]}
              >
                {isLocating
                  ? "Detecting Location..."
                  : hasLocationPin
                  ? "Location Pinned — Tap to Refresh"
                  : "Use My Current Location"}
              </Text>
            </TouchableOpacity>

            {hasLocationPin && (
              <View style={styles.coordsRow}>
                <Ionicons name="location-sharp" size={12} color={colors.gold} />
                <Text
                  style={[
                    styles.coordsText,
                    { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                  ]}
                >
                  GPS: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                </Text>
              </View>
            )}
          </View>

          {/* Address Type Selector */}
          <View style={styles.section}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
              ]}
            >
              ADDRESS TYPE
            </Text>
            <View style={styles.typeRow}>
              {[AddressType.HOME, AddressType.WORK, AddressType.OTHER].map((type) => {
                const selected = addressType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor: selected ? colors.champagne : colors.cardBg,
                        borderColor: selected ? colors.gold : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setValue("addressType", type, { shouldValidate: true });
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather
                      name={
                        type === AddressType.HOME
                          ? "home"
                          : type === AddressType.WORK
                          ? "briefcase"
                          : "map-pin"
                      }
                      size={12}
                      color={selected ? colors.gold : colors.warmGray}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color: selected ? colors.gold : colors.ink,
                          fontFamily: selected
                            ? "DMSans_700Bold"
                            : "DMSans_400Regular",
                        },
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
              ]}
            >
              FULL NAME *
            </Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: errors.fullName ? "#dc2626" : colors.border,
                      color: colors.ink,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                  placeholder="e.g. Aditya Kumar"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* Mobile Number & Verification */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithBadge}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
                ]}
              >
                PHONE NUMBER *
              </Text>
              {isPhoneVerified ? (
                <View
                  style={[
                    styles.verifiedBadge,
                    {
                      backgroundColor: colors.champagne,
                      borderColor: colors.gold,
                    },
                  ]}
                >
                  <Ionicons name="shield-checkmark" size={10} color={colors.gold} />
                  <Text
                    style={[
                      styles.verifiedBadgeText,
                      { color: colors.gold, fontFamily: "DMSans_500Medium" },
                    ]}
                  >
                    Verified
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setOtpSheetVisible(true)}
                  style={[
                    styles.verifiedBadge,
                    {
                      backgroundColor: colors.pearl,
                      borderColor: colors.gold,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.verifiedBadgeText,
                      { color: colors.gold, fontFamily: "DMSans_500Medium" },
                    ]}
                  >
                    Verify via OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: errors.phone ? "#dc2626" : colors.border,
                      color: colors.ink,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.warmGray}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    onChange(val);
                    if (isPhoneVerified) setIsPhoneVerified(false);
                  }}
                  value={value}
                />
              )}
            />
            {errors.phone && (
              <Text style={styles.errorText}>{errors.phone.message}</Text>
            )}
          </View>

          {/* House / Flat / Street */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
              ]}
            >
              HOUSE / FLAT / STREET ADDRESS *
            </Text>
            <Controller
              control={control}
              name="street"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: errors.street ? "#dc2626" : colors.border,
                      color: colors.ink,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                  placeholder="Flat / House no, Building name, Street, Area"
                  placeholderTextColor={colors.warmGray}
                  multiline
                  numberOfLines={2}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.street && (
              <Text style={styles.errorText}>{errors.street.message}</Text>
            )}
          </View>

          {/* Landmark */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
              ]}
            >
              LANDMARK (OPTIONAL)
            </Text>
            <Controller
              control={control}
              name="landmark"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.border,
                      color: colors.ink,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                  placeholder="Near temple, school, or landmark"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ""}
                />
              )}
            />
          </View>

          {/* City and State */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
                ]}
              >
                CITY *
              </Text>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: errors.city ? "#dc2626" : colors.border,
                        color: colors.ink,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                    placeholder="e.g. Patna"
                    placeholderTextColor={colors.warmGray}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.city && (
                <Text style={styles.errorText}>{errors.city.message}</Text>
              )}
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
                ]}
              >
                STATE *
              </Text>
              <Controller
                control={control}
                name="state"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: errors.state ? "#dc2626" : colors.border,
                        color: colors.ink,
                        fontFamily: "DMSans_400Regular",
                      },
                    ]}
                    placeholder="e.g. Bihar"
                    placeholderTextColor={colors.warmGray}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.state && (
                <Text style={styles.errorText}>{errors.state.message}</Text>
              )}
            </View>
          </View>

          {/* Pincode */}
          <View style={styles.fieldGroup}>
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.warmGray, fontFamily: "DMSans_500Medium" },
              ]}
            >
              PIN CODE *
            </Text>
            <Controller
              control={control}
              name="pincode"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: errors.pincode ? "#dc2626" : colors.border,
                      color: colors.ink,
                      fontFamily: "DMSans_400Regular",
                    },
                  ]}
                  placeholder="6-digit postal code"
                  placeholderTextColor={colors.warmGray}
                  keyboardType="numeric"
                  maxLength={6}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.pincode && (
              <Text style={styles.errorText}>{errors.pincode.message}</Text>
            )}
          </View>

          {/* Default Address Toggle */}
          <View
            style={[
              styles.defaultRow,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={[
                  styles.defaultRowTitle,
                  {
                    color: colors.ink,
                    fontFamily: "DMSans_500Medium",
                  },
                ]}
              >
                Set as Default Address
              </Text>
              <Text
                style={[
                  styles.defaultRowSub,
                  { color: colors.warmGray, fontFamily: "DMSans_400Regular" },
                ]}
              >
                Automatically selected during checkout
              </Text>
            </View>
            <Switch
              value={Boolean(isDefault)}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setValue("isDefault", val);
              }}
              trackColor={{ false: colors.midGray, true: colors.champagne }}
              thumbColor={isDefault ? colors.gold : colors.ivory}
            />
          </View>
        </ScrollView>

        {/* Footer CTA */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.ivory,
              borderTopColor: colors.midGray,
              paddingBottom: bottomPad,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.gold,
                opacity: isSaving ? 0.7 : 1,
              },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.ivory} size="small" />
            ) : (
              <View style={styles.submitBtnContent}>
                <Text
                  style={[
                    styles.submitBtnText,
                    {
                      color: colors.ivory,
                      fontFamily: "DMSans_600SemiBold",
                    },
                  ]}
                >
                  {isEditing ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
                </Text>
                <Feather name="arrow-right" size={14} color={colors.ivory} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Phone OTP Sheet */}
      <PhoneOtpSheet
        visible={otpSheetVisible}
        initialPhone={phoneValue || storeUser?.phone || ""}
        onVerified={(verifiedPhone) => {
          setIsPhoneVerified(true);
          setValue("phone", verifiedPhone, { shouldValidate: true });
          setOtpSheetVisible(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        onClose={() => setOtpSheetVisible(false)}
      />

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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    letterSpacing: 1.5,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 2,
    borderWidth: 1,
  },
  locationBtnText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  coordsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  coordsText: {
    fontSize: 11,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  labelWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 2,
    borderWidth: 0.5,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 2,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  multilineInput: {
    height: 72,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11,
    marginTop: 4,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 2,
    borderWidth: 1,
    marginTop: 8,
  },
  defaultRowTitle: {
    fontSize: 14,
  },
  defaultRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  submitBtn: {
    height: 50,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    fontSize: 12,
    letterSpacing: 1.5,
  },
});
