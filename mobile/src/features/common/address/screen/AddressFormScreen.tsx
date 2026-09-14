import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Bookmark02Icon,
  CallIcon,
  Location01Icon,
  MapPinCheckIcon,
  UserIcon
} from "@hugeicons/core-free-icons";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AddressInput from "../components/AddressInput";
import AddressTypeSelector from "../components/AddressTypeSelector";
import LocationFetchButton from "../components/LocationFetchButton";
import PhoneOtpSheet from "../components/PhoneOtpSheet";
import { useAddressActions } from "../hooks/useAddress";
import { reverseGeocodeRequest } from "../api/address.api";
import { AddressFormValues, addressSchema, AddressType } from "../schema/address.schema";
import { createAddressStyles } from "../style/addressStyles";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const AddressFormScreen = () => {
  const theme = useTheme();
  const [isLocating, setIsLocating] = useState(false);
  const styles = createAddressStyles(theme);
  const router = useRouter();
  const storeUser = useAuthStore((s) => s.user);

  // Phone verification state — seeded from the auth store so re-visits don't re-verify
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    storeUser?.isPhoneVerified ?? false
  );
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);
  const { id, data } = useLocalSearchParams<{ id?: string, data?: string }>();
  const isEditing = !!id;
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

  const showAlert = (title: string, message?: string, buttons: AlertButton[] = [{ text: "OK" }]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  const { createAddress, updateAddress } = useAddressActions();

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

  const addressType = useWatch({
    control,
    name: "addressType",
  });

  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  // ponytail: useWatch at component level (not inside JSX) to satisfy rules-of-hooks
  const phoneValue = useWatch({ control, name: "phone" });

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
            { text: "Open Settings", style: "default", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "QuickBihar needs location access to auto-fill your address. Please allow location in app settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", style: "default", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
      } catch (err) {
        console.log("getCurrentPositionAsync failed, trying fallback...", err);
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        throw new Error("Current location is unavailable. Make sure that location services are enabled and you have a clear GPS signal.");
      }

      const { latitude, longitude } = location.coords;
      setValue("latitude", latitude, { shouldValidate: true, shouldDirty: true });
      setValue("longitude", longitude, { shouldValidate: true, shouldDirty: true });

      let street: string | undefined;
      let city: string | undefined;
      let state: string | undefined;
      let pincode: string | undefined;

      // On native mobile (iOS/Android), attempt native reverse geocoding first
      if (Platform.OS !== "web") {
        try {
          const [address] = await Location.reverseGeocodeAsync({
            latitude,
            longitude,
          });

          if (address) {
            const streetParts = [address.name, address.street].filter(Boolean);
            street = streetParts.length > 0
              ? Array.from(new Set(streetParts)).join(", ")
              : (address.subregion || address.district || undefined);
            city = address.city || address.district || address.subregion || undefined;
            state = address.region || undefined;
            pincode = address.postalCode || undefined;
          }
        } catch (nativeGeocodeErr: unknown) {
          console.log("Native reverse geocoding failed, trying API fallback...", nativeGeocodeErr);
        }
      }

      // On web (where expo-location reverse geocoding is unsupported) or if native geocoding is incomplete:
      if (!city || !state || !street || !pincode) {
        try {
          const apiAddress = await reverseGeocodeRequest(latitude, longitude);
          if (apiAddress) {
            if (!street && apiAddress.street) street = apiAddress.street;
            if (!city && apiAddress.city) city = apiAddress.city;
            if (!state && apiAddress.state) state = apiAddress.state;
            if (!pincode && apiAddress.pincode) pincode = apiAddress.pincode;
          }
        } catch (apiErr: unknown) {
          console.log("API reverse geocode failed:", apiErr);
        }
      }

      if (street) {
        setValue("street", street, { shouldValidate: true, shouldDirty: true });
      }
      if (city) {
        setValue("city", city, { shouldValidate: true, shouldDirty: true });
      }
      if (state) {
        setValue("state", state, { shouldValidate: true, shouldDirty: true });
      }
      if (pincode && /^\d{6}$/.test(pincode)) {
        setValue("pincode", pincode, { shouldValidate: true, shouldDirty: true });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: unknown) {
      console.error("Location Error:", error);
      const message = error instanceof Error ? error.message : "Could not fetch your real-time location.";
      showAlert("Location Error", message);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (isEditing && data) {
      try {
        const addressData = JSON.parse(data);
        reset({
          fullName: addressData.fullName,
          phone: addressData.phone,
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          pincode: addressData.pincode,
          landmark: addressData.landmark || "",
          addressType: addressData.addressType,
          isDefault: addressData.isDefault,
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
      } catch (err) {
        console.error("Failed to parse address data", err);
      }
    } else if (!isEditing && storeUser?.phone) {
      setValue("phone", storeUser.phone);
      setIsPhoneVerified(Boolean(storeUser.isPhoneVerified));
    }
  }, [isEditing, data, reset, setValue, storeUser]);

  // Auto-request location when adding a new address so the user is prompted
  // immediately rather than needing to tap the button manually.
  useEffect(() => {
    if (!isEditing) {
      Location.requestForegroundPermissionsAsync().then(({ status }) => {
        if (status === "granted") {
          handleFetchLocation();
        }
        // If denied: user can tap the button later; no alert spam on mount.
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // ponytail: empty deps — run once on mount only

  const onSubmit = async (formData: AddressFormValues) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const hasLocationPin = Number.isFinite(Number(formData.latitude))
        && Number.isFinite(Number(formData.longitude))
        && !(Number(formData.latitude) === 0 && Number(formData.longitude) === 0);

      if (!hasLocationPin) {
        showAlert(
          "Location Pin Required",
          "Please tap Use My Current Location before saving this address. Delivery riders use this pin for pickup and delivery verification.",
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
            { text: "Verify Now", style: "default", onPress: () => setOtpSheetVisible(true) },
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
      router.back();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save address";
      showAlert("Save Failed", message);
    }
  };


  const onInvalidSubmit = (formErrors: Record<string, unknown>) => {
    if (formErrors.latitude || formErrors.longitude) {
      showAlert(
        "Location Pin Required",
        "Please tap Use My Current Location before saving this address. Delivery riders use this pin for delivery verification.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/account/addresses" as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top app bar (same style as Notifications & Saved Addresses) */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.appBarTitleWrap}>
          <Text style={styles.appBarTitle}>
            {isEditing ? "Edit Address" : "Add Address"}
          </Text>
          <Text style={styles.appBarSubtitle}>
            {isEditing
              ? "Update your delivery location details"
              : "Add a new pin & delivery location"}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.mainWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

        <AddressInput
          control={control}
          name="fullName"
          label="Full Name"
          icon={UserIcon}
          placeholder="e.g. Aditya Kumar"
          errors={errors}
          theme={theme}
          styles={styles}
        />

        {/* ── Phone Number field with OTP verification ─────────────── */}
        <AddressInput
          control={control}
          name="phone"
          label="Phone Number"
          icon={CallIcon}
          placeholder="e.g. 9876543210"
          errors={errors}
          theme={theme}
          styles={styles}
          options={{
            keyboardType: "phone-pad",
            // Always editable — typing a new number clears verification
            onChangeText: (v: string) => {
              const cleanV = v.replace(/\D/g, "").slice(-10);
              const cleanUser = (storeUser?.phone || "").replace(/\D/g, "").slice(-10);
              const isMatch = Boolean(storeUser?.isPhoneVerified && cleanUser && cleanV === cleanUser);
              setIsPhoneVerified(isMatch);
            },
          }}
        />
        {isPhoneVerified ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
              <Text style={styles.verifiedBadgeText}>Number Verified</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setIsPhoneVerified(false);
                setOtpSheetVisible(true);
              }}
            >
              <Text style={{ fontSize: 12, color: theme.primary, fontWeight: "600" }}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => setOtpSheetVisible(true)}
          >
            <Ionicons name="logo-whatsapp" size={15} color={theme.primary} />
            <Text style={styles.verifyButtonText}>Verify via WhatsApp</Text>
          </TouchableOpacity>
        )}

        <LocationFetchButton
          isLocating={isLocating}
          onFetch={handleFetchLocation}
          latitude={latitude}
          longitude={longitude}
          theme={theme}
          styles={styles}
        />

        <AddressTypeSelector
          selectedType={addressType}
          onSelect={(type) => setValue("addressType", type)}
          theme={theme}
          styles={styles}
        />

        <AddressInput
          control={control}
          name="street"
          label="Street Address"
          icon={Location01Icon}
          placeholder="House No, Street name..."
          errors={errors}
          theme={theme}
          styles={styles}
          options={{ multiline: true, numberOfLines: 3 }}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <AddressInput
              control={control}
              name="city"
              label="City"
              icon={Location01Icon}
              placeholder="e.g. Patna"
              errors={errors}
              theme={theme}
              styles={styles}
            />
          </View>
          <View style={styles.half}>
            <AddressInput
              control={control}
              name="state"
              label="State"
              icon={Bookmark02Icon}
              placeholder="e.g. Bihar"
              errors={errors}
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <AddressInput
              control={control}
              name="pincode"
              label="Pincode"
              icon={Bookmark02Icon}
              placeholder="6 digits"
              errors={errors}
              theme={theme}
              styles={styles}
              options={{ keyboardType: "numeric", maxLength: 6 }}
            />
          </View>
          <View style={styles.half}>
            <AddressInput
              control={control}
              name="landmark"
              label="Landmark (Opt)"
              icon={MapPinCheckIcon}
              placeholder="Near..."
              errors={errors}
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit(onSubmit, onInvalidSubmit)}
          disabled={createAddress.isPending || updateAddress.isPending}
        >
          {createAddress.isPending || updateAddress.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditing ? "Update Address" : "Save Address"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

    <IOSAlertDialog
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
    />

    {/* Phone OTP verification sheet */}
    <PhoneOtpSheet
      visible={otpSheetVisible}
      initialPhone={phoneValue || storeUser?.phone || ""}
      onVerified={(verifiedPhone) => {
        setValue("phone", verifiedPhone);
        setIsPhoneVerified(true);
        setOtpSheetVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
      onClose={() => setOtpSheetVisible(false)}
    />
  </View>
  );
};

export default AddressFormScreen;
