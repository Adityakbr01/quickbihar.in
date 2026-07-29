import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MapPinCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Theme } from "@/src/theme/Provider/ThemeProvider";

interface LocationFetchButtonProps {
  isLocating: boolean;
  onFetch: () => void;
  latitude?: number;
  longitude?: number;
  theme: Theme;
  styles: any;
}

const LocationFetchButton: React.FC<LocationFetchButtonProps> = ({
  isLocating,
  onFetch,
  latitude,
  longitude,
  theme,
  styles,
}) => {
  return (
    <View>
      <TouchableOpacity
        style={[styles.locationButton, isLocating && { opacity: 0.7 }]}
        onPress={onFetch}
        disabled={isLocating}
      >
        {isLocating ? (
          <ActivityIndicator color={theme.primary} size="small" />
        ) : (
          <>
            <HugeiconsIcon
              icon={MapPinCheckIcon}
              size={20}
              color={theme.primary}
            />
            <Text style={styles.locationButtonText}>Use My Current Location</Text>
          </>
        )}
      </TouchableOpacity>

      {latitude !== 0 && longitude !== 0 && (
        <Text style={styles.coordinateText}>
          GPS: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
        </Text>
      )}
    </View>
  );
};

export default LocationFetchButton;
