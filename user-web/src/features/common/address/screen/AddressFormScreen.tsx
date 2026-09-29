import IOSAlertDialog, { AlertButton } from "@/src/components/ui/IOSAlertDialog";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppIcon } from "@/src/components/common/AppIcon";
import { Bookmark, ChevronLeft, MapPin, Navigation, Phone, ShieldCheck, User } from "lucide-react";
import { WhatsappIcon } from "@/src/components/common/BrandIcons";
import * as Haptics from "@/lib/haptics";
import * as Location from "@/src/lib/location";
import { useNavigate } from "react-router-dom";
import { goBack, useRouteParams } from "@/src/utils/navigation";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import AddressInput from "../components/AddressInput";
import AddressTypeSelector from "../components/AddressTypeSelector";
import LocationFetchButton from "../components/LocationFetchButton";
import PhoneOtpSheet from "../components/PhoneOtpSheet";
import { useAddressActions } from "../hooks/useAddress";
import { reverseGeocodeRequest } from "../api/address.api";
import { AddressFormValues, addressSchema, AddressType } from "../schema/address.schema";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const AddressFormScreen = () => {
  const theme = useTheme() as any;
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  const storeUser = useAuthStore((s) => s.user);

  // Phone verification state — seeded from the auth store so re-visits don't re-verify
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    storeUser?.isPhoneVerified ?? false
  );
  const [otpSheetVisible, setOtpSheetVisible] = useState(false);
  const { id, data } = useRouteParams<{ id?: string, data?: string }>();
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
            { text: "Open Settings", style: "default", onPress: () => window.open(window.location.href, "_blank") },
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
            { text: "Open Settings", style: "default", onPress: () => window.open(window.location.href, "_blank") },
          ]
        );
        return;
      }

      let location: any = null;
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

      // Web: expo-location reverse geocoding is unsupported — use the API directly.
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
      goBack(navigate, "/account/addresses");
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
    goBack(navigate, "/account/addresses");
  };

  const isSaving = createAddress.isPending || updateAddress.isPending;

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center pb-[30px]"
      style={{ backgroundColor: theme.background }}
    >
      {/* Top app bar (same style as Notifications & Saved Addresses) */}
      <div className="flex w-full max-w-[800px] flex-row items-center gap-2 px-3 pt-2 pb-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: theme.secondaryBackground }}
        >
          <ChevronLeft size={22} color={theme.text} />
        </button>

        <div className="flex-1 px-1">
          <p
            className="text-[22px] font-extrabold tracking-[-0.4px]"
            style={{ color: theme.text }}
          >
            {isEditing ? "Edit Address" : "Add Address"}
          </p>
          <p
            className="mt-0.5 text-xs font-medium"
            style={{ color: theme.secondaryText }}
          >
            {isEditing
              ? "Update your delivery location details"
              : "Add a new pin & delivery location"}
          </p>
        </div>

        <div className="w-10" />
      </div>

      <div className="flex w-full max-w-[800px] flex-1 flex-col">
        <div className="overflow-auto px-4 pt-2 pb-10">

        <AddressInput
          control={control}
          name="fullName"
          label="Full Name"
          icon={User}
          placeholder="e.g. Aditya Kumar"
          errors={errors}
          theme={theme}
        />

        {/* ── Phone Number field with OTP verification ─────────────── */}
        <AddressInput
          control={control}
          name="phone"
          label="Phone Number"
          icon={Phone}
          placeholder="e.g. 9876543210"
          errors={errors}
          theme={theme}
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
          <div className="mt-1.5 flex flex-row items-center gap-2.5">
            <div
              className="flex flex-row items-center gap-[5px] self-start rounded-md border px-2 py-1"
              style={{
                backgroundColor: "rgba(22, 163, 74, 0.1)",
                borderColor: "rgba(22, 163, 74, 0.25)",
              }}
            >
              <ShieldCheck size={14} color="#16a34a" />
              <span className="text-xs font-bold text-[#16a34a]">
                Number Verified
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsPhoneVerified(false);
                setOtpSheetVisible(true);
              }}
              className="cursor-pointer"
            >
              <span
                className="text-xs font-semibold"
                style={{ color: theme.primary }}
              >
                Change
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOtpSheetVisible(true)}
            className="mt-1.5 flex cursor-pointer flex-row items-center gap-1.5 self-start rounded-[10px] border px-3 py-2"
            style={{
              backgroundColor: "rgba(0, 122, 255, 0.08)",
              borderColor: "rgba(0, 122, 255, 0.25)",
            }}
          >
            <WhatsappIcon size={15} color={theme.primary} />
            <span
              className="text-[13px] font-semibold"
              style={{ color: theme.primary }}
            >
              Verify via WhatsApp
            </span>
          </button>
        )}

        <div className="mt-5">
          <LocationFetchButton
            isLocating={isLocating}
            onFetch={handleFetchLocation}
            latitude={latitude}
            longitude={longitude}
            theme={theme}
          />
        </div>

        <AddressTypeSelector
          selectedType={addressType}
          onSelect={(type) => setValue("addressType", type)}
          theme={theme}
        />

        <AddressInput
          control={control}
          name="street"
          label="Street Address"
          icon={MapPin}
          placeholder="House No, Street name..."
          errors={errors}
          theme={theme}
          options={{ multiline: true, numberOfLines: 3 }}
        />

        <div className="flex flex-row gap-4">
          <div className="min-w-0 flex-1">
            <AddressInput
              control={control}
              name="city"
              label="City"
              icon={MapPin}
              placeholder="e.g. Patna"
              errors={errors}
              theme={theme}
            />
          </div>
          <div className="min-w-0 flex-1">
            <AddressInput
              control={control}
              name="state"
              label="State"
              icon={Bookmark}
              placeholder="e.g. Bihar"
              errors={errors}
              theme={theme}
            />
          </div>
        </div>

        <div className="flex flex-row gap-4">
          <div className="min-w-0 flex-1">
            <AddressInput
              control={control}
              name="pincode"
              label="Pincode"
              icon={Bookmark}
              placeholder="6 digits"
              errors={errors}
              theme={theme}
              options={{ keyboardType: "numeric", maxLength: 6 }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <AddressInput
              control={control}
              name="landmark"
              label="Landmark (Opt)"
              icon={Navigation}
              placeholder="Near..."
              errors={errors}
              theme={theme}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit(onSubmit, onInvalidSubmit)}
          disabled={isSaving}
          className="mt-2.5 mb-5 flex h-[58px] w-full cursor-pointer items-center justify-center rounded-[18px] shadow-lg disabled:opacity-70"
          style={{ backgroundColor: theme.primary }}
        >
          {isSaving ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="text-[17px] font-bold text-white">
              {isEditing ? "Update Address" : "Save Address"}
            </span>
          )}
        </button>
        </div>
      </div>

    <IOSAlertDialog
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
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
  </div>
  );
};

export default AddressFormScreen;
