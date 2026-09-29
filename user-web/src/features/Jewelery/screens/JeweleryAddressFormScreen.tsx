import { ArrowLeft, ArrowRight, Briefcase, House, MapPin, Navigation as NavigationIcon, Shield, ShieldCheck } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "@/lib/haptics";
import * as Location from "@/src/lib/location";
import { useNavigate } from "react-router-dom";
import { goBack, replaceTo, useRouteParams } from "@/src/utils/navigation";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

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
import { TextInput } from "@/src/theme/components/TextInput";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { useTopPad } from "@/src/hooks/useTopPad";
import { useSafeAreaInsets } from "@/src/hooks/useSafeAreaInsets";
import { useStickyBarBottomOffset } from "@/src/utils/responsive";

export default function JeweleryAddressFormScreen() {
  const colors = useColors();
  const navigate = useNavigate();
  const topPad = useTopPad();
  const insets = useSafeAreaInsets();
  const bottomPad = 34;
  const stickyBarOffset = useStickyBarBottomOffset();

  const { id, data, returnTo } = useRouteParams<{
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              onPress: () => window.open(window.location.href, "_blank"),
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
              onPress: () => window.open(window.location.href, "_blank"),
            },
          ]
        );
        return;
      }

      let location: any = null;
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

      // Web: expo-location reverse geocoding is unsupported — use the API directly.
      try {
        const apiAddress = await reverseGeocodeRequest(lat, lng);
        if (apiAddress) {
          if (!street && apiAddress.street) street = apiAddress.street;
          if (!city && apiAddress.city) city = apiAddress.city;
          if (!state && apiAddress.state) state = apiAddress.state;
          if (!pincode && apiAddress.pincode) pincode = apiAddress.pincode;
        }
      } catch {}

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
        replaceTo(navigate, returnTo as any);
      } else {
        goBack(navigate, "/jewelery/addresses");
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to save address";
      showAlert("Save Failed", msg);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (returnTo) {
      replaceTo(navigate, returnTo as any);
    } else {
      goBack(navigate, "/jewelery/addresses");
    }
  };

  const isSaving = createAddress.isPending || updateAddress.isPending;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: colors.ivory }}>
      {/* Header */}
      <div
        className="flex flex-row items-center justify-between px-5 pb-[14px]"
        style={{
          paddingTop: topPad + 12,
          backgroundColor: colors.ivory,
          borderBottomColor: colors.midGray,
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-9 w-9 cursor-pointer items-center justify-center"
        >
          <ArrowLeft size={18} color={colors.ink} />
        </button>

        <h1
          className="text-[17px] tracking-[1.5px]"
          style={{
            color: colors.ink,
            fontFamily: "CormorantGaramond_600SemiBold",
          }}
        >
          {isEditing ? "EDIT ADDRESS" : "ADD NEW ADDRESS"}
        </h1>

        <Shield size={16} color={colors.gold} />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="overflow-auto p-5" style={{ paddingBottom: bottomPad + 90 }}>
          {/* GPS Location Button */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleFetchLocation}
              disabled={isLocating}
              className="flex w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-[2px] border py-[14px] disabled:opacity-70"
              style={{
                backgroundColor: colors.champagne,
                borderColor: colors.gold,
              }}
            >
              {isLocating ? (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2"
                  style={{ borderColor: `${colors.gold}30`, borderTopColor: colors.gold }}
                />
              ) : (
                <NavigationIcon size={16} color={colors.gold} />
              )}
              <span
                className="text-[13px] tracking-[0.5px]"
                style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
              >
                {isLocating
                  ? "Detecting Location..."
                  : hasLocationPin
                  ? "Location Pinned — Tap to Refresh"
                  : "Use My Current Location"}
              </span>
            </button>

            {hasLocationPin && (
              <div className="mt-2 flex flex-row items-center justify-center gap-[5px]">
                <MapPin size={12} color={colors.gold} />
                <span
                  className="text-[11px]"
                  style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
                >
                  GPS: {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
                </span>
              </div>
            )}
          </div>

          {/* Address Type Selector */}
          <div className="mb-5">
            <p
              className="mb-[7px] text-[10.5px] tracking-[0.8px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
            >
              ADDRESS TYPE
            </p>
            <div className="flex flex-row gap-[10px]">
              {[AddressType.HOME, AddressType.WORK, AddressType.OTHER].map((type) => {
                const selected = addressType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setValue("addressType", type, { shouldValidate: true });
                    }}
                    className="flex flex-1 cursor-pointer flex-row items-center justify-center gap-1.5 rounded-[2px] border py-[10px]"
                    style={{
                      backgroundColor: selected ? colors.champagne : colors.cardBg,
                      borderColor: selected ? colors.gold : colors.border,
                    }}
                  >
                    {type === AddressType.HOME ? (
                      <House size={12} color={selected ? colors.gold : colors.warmGray} />
                    ) : type === AddressType.WORK ? (
                      <Briefcase size={12} color={selected ? colors.gold : colors.warmGray} />
                    ) : (
                      <MapPin size={12} color={selected ? colors.gold : colors.warmGray} />
                    )}
                    <span
                      className="text-[12px] tracking-[0.5px]"
                      style={{
                        color: selected ? colors.gold : colors.ink,
                        fontFamily: selected
                          ? "DMSans_700Bold"
                          : "DMSans_400Regular",
                      }}
                    >
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <p
              className="mb-[7px] text-[10.5px] tracking-[0.8px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
            >
              FULL NAME *
            </p>
            <Controller control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="e.g. Aditya Kumar"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.fullName?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
          </div>

          {/* Mobile Number & Verification */}
          <div className="mb-4">
            <div className="mb-[7px] flex flex-row items-center justify-between">
              <p
                className="text-[10.5px] tracking-[0.8px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
              >
                PHONE NUMBER *
              </p>
              {isPhoneVerified ? (
                <div
                  className="flex flex-row items-center gap-1 rounded-[2px] border px-[7px] py-[2.5px]"
                  style={{
                    backgroundColor: colors.champagne,
                    borderColor: colors.gold,
                    borderWidth: 1,
                  }}
                >
                  <ShieldCheck size={10} color={colors.gold} />
                  <span
                    className="text-[9.5px]"
                    style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                  >
                    Verified
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOtpSheetVisible(true)}
                  className="cursor-pointer rounded-[2px] border px-[7px] py-[2.5px]"
                  style={{
                    backgroundColor: colors.pearl,
                    borderColor: colors.gold,
                    borderWidth: 1,
                  }}
                >
                  <span
                    className="text-[9.5px]"
                    style={{ color: colors.gold, fontFamily: "DMSans_500Medium" }}
                  >
                    Verify via OTP
                  </span>
                </button>
              )}
            </div>
            <Controller control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="10-digit mobile number"
                  placeholderTextColor={colors.warmGray}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    onChange(val);
                    if (isPhoneVerified) setIsPhoneVerified(false);
                  }}
                  value={value}
                  error={errors.phone?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
          </div>

          {/* House / Flat / Street */}
          <div className="mb-4">
            <p
              className="mb-[7px] text-[10.5px] tracking-[0.8px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
            >
              HOUSE / FLAT / STREET ADDRESS *
            </p>
            <Controller control={control}
              name="street"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="Flat / House no, Building name, Street, Area"
                  placeholderTextColor={colors.warmGray}
                  multiline
                  numberOfLines={2}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.street?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 72,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                    textAlignVertical: "top",
                  }}
                />
              )}
            />
          </div>

          {/* Landmark */}
          <div className="mb-4">
            <p
              className="mb-[7px] text-[10.5px] tracking-[0.8px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
            >
              LANDMARK (OPTIONAL)
            </p>
            <Controller control={control}
              name="landmark"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="Near temple, school, or landmark"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ""}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
          </div>

          {/* City and State */}
          <div className="flex flex-row gap-3">
            <div className="mb-4 min-w-0 flex-1">
              <p
                className="mb-[7px] text-[10.5px] tracking-[0.8px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
              >
                CITY *
              </p>
              <Controller control={control}
                name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="e.g. Patna"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.city?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
            </div>

            <div className="mb-4 min-w-0 flex-1">
              <p
                className="mb-[7px] text-[10.5px] tracking-[0.8px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
              >
                STATE *
              </p>
              <Controller control={control}
                name="state"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="e.g. Bihar"
                  placeholderTextColor={colors.warmGray}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.state?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
            </div>
          </div>

          {/* Pincode */}
          <div className="mb-4">
            <p
              className="mb-[7px] text-[10.5px] tracking-[0.8px]"
              style={{ color: colors.warmGray, fontFamily: "DMSans_500Medium" }}
            >
              PIN CODE *
            </p>
            <Controller control={control}
              name="pincode"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput placeholder="6-digit postal code"
                  placeholderTextColor={colors.warmGray}
                  keyboardType="numeric"
                  maxLength={6}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.pincode?.message}
                  focusBorderColor={colors.gold}
                  containerStyle={{ marginBottom: 0 }}
                  inputContainerStyle={{
                    backgroundColor: colors.cardBg,
                    borderRadius: 2,
                    height: 48,
                    paddingHorizontal: 14,
                  }}
                  style={{
                    fontSize: 14,
                    color: colors.ink,
                    fontFamily: "DMSans_400Regular",
                  }}
                />
              )}
            />
          </div>

          {/* Default Address Toggle */}
          <div
            className="mt-2 flex flex-row items-center rounded-[2px] border p-4"
            style={{
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
            }}
          >
            <div className="flex flex-1 flex-col gap-[2px]">
              <span
                className="text-[14px]"
                style={{
                  color: colors.ink,
                  fontFamily: "DMSans_500Medium",
                }}
              >
                Set as Default Address
              </span>
              <span
                className="mt-[2px] text-[11px]"
                style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
              >
                Automatically selected during checkout
              </span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(isDefault)}
              onChange={(e) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setValue("isDefault", e.target.checked);
              }}
              aria-label="Set as default address"
              className="h-6 w-11 cursor-pointer appearance-none rounded-full transition-colors"
              style={{
                backgroundColor: isDefault ? colors.gold : colors.midGray,
                position: "relative",
              }}
            />
          </div>
          <div style={{ height: 16 }} />
        </div>

        {/* Footer CTA — viewport-fixed above the tab bar */}
        <div
          className="fixed right-0 left-0 z-[60] px-5 pt-3"
          style={{
            bottom: stickyBarOffset + 12 + (insets?.bottom ?? 0),
            backgroundColor: colors.ivory,
            borderTopColor: colors.midGray,
            borderTopWidth: 1,
            borderTopStyle: "solid",
            paddingBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSaving}
            className="flex h-[50px] w-full cursor-pointer items-center justify-center rounded-[2px] shadow-md disabled:opacity-70"
            style={{
              backgroundColor: colors.gold,
            }}
          >
            {isSaving ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <span className="flex flex-row items-center gap-2">
                <span
                  className="text-[12px] tracking-[1.5px]"
                  style={{
                    color: colors.onBrand,
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  {isEditing ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
                </span>
                <ArrowRight size={14} color={colors.onBrand} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Phone OTP Sheet */}
      <PhoneOtpSheet visible={otpSheetVisible}
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
      <IOSAlertDialog visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((p) => ({ ...p, visible: false }))}
      />
    </div>
  );
}
