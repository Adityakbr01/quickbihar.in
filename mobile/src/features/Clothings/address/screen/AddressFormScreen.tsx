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
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AddressInput from "../components/AddressInput";
import AddressTypeSelector from "../components/AddressTypeSelector";
import LocationFetchButton from "../components/LocationFetchButton";
import { useAddressActions } from "../hooks/useAddress";
import { AddressFormValues, addressSchema, AddressType } from "../schema/address.schema";
import { createAddressStyles } from "../style/addressStyles";

const AddressFormScreen = () => {
  const theme = useTheme();
  const [isLocating, setIsLocating] = useState(false);
  const styles = createAddressStyles(theme);
  const router = useRouter();
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
      phone: "",
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

  const handleFetchLocation = async () => {
    try {
      setIsLocating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        showAlert(
          "Location Disabled",
          "Location services are turned off. Please enable them in your device settings.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Please enable location permissions in settings to use this feature.",
          [{ text: "Settings", onPress: () => Platform.OS === 'ios' ? Location.requestForegroundPermissionsAsync() : null }]
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
      setValue("latitude", latitude);
      setValue("longitude", longitude);

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address) {
        if (address.street && address.name) {
          setValue("street", `${address.name}, ${address.street}`);
        }
        if (address.city || address.district) {
          setValue("city", address.city || address.district || "");
        }
        if (address.region) {
          setValue("state", address.region);
        }
        if (address.postalCode) {
          setValue("pincode", address.postalCode);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Location Error:", error);
      showAlert("Location Error", error.message || "Could not fetch your real-time location.");
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
      } catch (err) {
        console.error("Failed to parse address data", err);
      }
    }
  }, [isEditing, data, reset]);

  const onSubmit = async (formData: AddressFormValues) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (isEditing && id) {
        await updateAddress.mutateAsync({ id, data: formData });
      } else {
        await createAddress.mutateAsync(formData);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      showAlert("Save Failed", error.message || "Failed to save address");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.nameText, { marginBottom: 24 }]}>
          {isEditing ? "Edit Delivery Address" : "Add New Delivery Address"}
        </Text>

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

        <AddressInput
          control={control}
          name="phone"
          label="Phone Number"
          icon={CallIcon}
          placeholder="e.g. 9876543210"
          errors={errors}
          theme={theme}
          styles={styles}
          options={{ keyboardType: "phone-pad" }}
        />

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
          onPress={handleSubmit(onSubmit)}
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

      <IOSAlertDialog
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
};

export default AddressFormScreen;
