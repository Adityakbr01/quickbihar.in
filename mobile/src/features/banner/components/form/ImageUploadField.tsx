import React, { memo } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";

interface ImageUploadFieldProps {
    value: any;
    onChange: (value: any) => void;
    theme: any;
    styles: any;
    error?: string;
}

const ImageUploadField = ({ value, onChange, theme, styles, error }: ImageUploadFieldProps) => {
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true, // Reduced constraints for flexibility
            quality: 1, // Maximum quality
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            onChange({
                uri: asset.uri,
                name: asset.fileName || `banner_${Date.now()}.jpg`,
                type: asset.mimeType || "image/jpeg",
            });
        }
    };

    return (
        <View style={styles.formGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Banner Image *</Text>

            <View style={styles.imagePickerContainer}>
                {value ? (
                    <View style={{ flex: 1 }}>
                        <Image
                            source={{ uri: typeof value === 'string' ? value : value.uri }}
                            style={styles.imagePreview}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.removeImageBadge}
                            onPress={() => onChange("")}
                            activeOpacity={0.8}
                        >
                            <HugeiconsIcon icon={Delete02Icon} size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={pickImage}
                        activeOpacity={0.9}
                    >
                        <View style={styles.lottieContainer}>
                            <LottieView
                                source={require("../../../../../assets/lottie/Upload.json")}
                                autoPlay
                                loop
                                style={{ width: "100%", height: "100%" }}
                            />
                        </View>
                        <Text style={[styles.imagePickerText, { color: theme.tertiaryText }]}>
                            Tap to select image
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
            {error && (
                <Text style={{ color: "#FF3B30", fontSize: 12, marginTop: -10, marginBottom: 10 }}>
                    {error}
                </Text>
            )}
        </View>
    );
};

export default memo(ImageUploadField);
