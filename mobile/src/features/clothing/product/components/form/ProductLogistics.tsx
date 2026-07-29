import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import * as Location from 'expo-location';
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Location01Icon, Store01Icon } from "@hugeicons/core-free-icons";

interface ProductLogisticsProps {
  theme: Theme;
  styles: any;
  pickupLocation: string;
  setPickupLocation: (v: string) => void;
  warehouseName: string;
  setWarehouseName: (v: string) => void;
  latitude: number | undefined;
  setLatitude: (v: number | undefined) => void;
  longitude: number | undefined;
  setLongitude: (v: number | undefined) => void;
}

const ProductLogistics = ({
  theme,
  styles,
  pickupLocation,
  setPickupLocation,
  warehouseName,
  setWarehouseName,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
}: ProductLogisticsProps) => {
  const [loading, setLoading] = useState(false);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Optional: Reverse geocode to set pickup location automatically
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}`;
        if (!pickupLocation) setPickupLocation(formattedAddress.trim());
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch current location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <HugeiconsIcon icon={Store01Icon} size={20} color={theme.primary} />
        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Logistics & Warehouse</Text>
      </View>

      <Text style={styles.label}>Warehouse Name</Text>
      <TextInput
        style={styles.input}
        value={warehouseName}
        onChangeText={setWarehouseName}
        placeholder="e.g. Main Patna Distribution Center"
        placeholderTextColor={theme.tertiaryText}
      />

      <Text style={styles.label}>Pickup Address / Instructions</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: "top" }]}
        value={pickupLocation}
        onChangeText={setPickupLocation}
        placeholder="Specific address or instructions for pickup staff"
        placeholderTextColor={theme.tertiaryText}
        multiline
      />

      <View style={{ marginTop: 8 }}>
        <Text style={styles.label}>Precise GPS Coordinates</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, backgroundColor: theme.tertiaryBackground, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 10, color: theme.tertiaryText, marginBottom: 4 }}>LATITUDE</Text>
            <Text style={{ fontSize: 14, color: theme.text, fontWeight: "600" }}>{latitude?.toFixed(6) || '—'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: theme.tertiaryBackground, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 10, color: theme.tertiaryText, marginBottom: 4 }}>LONGITUDE</Text>
            <Text style={{ fontSize: 14, color: theme.text, fontWeight: "600" }}>{longitude?.toFixed(6) || '—'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 14,
            backgroundColor: theme.primary + '10',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.primary,
            borderStyle: "dashed"
          }}
          onPress={fetchLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <HugeiconsIcon icon={Location01Icon} size={18} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: "700", marginLeft: 8 }}>Capture Current GPS Location</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={{ fontSize: 11, color: theme.tertiaryText, marginTop: 8, textAlign: "center" }}>
          Stand at the pickup gate/desk and tap above to grab exact coordinates.
        </Text>
      </View>
    </View>
  );
};

export default ProductLogistics;
