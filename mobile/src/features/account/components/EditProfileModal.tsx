import React, { useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { createAccountStyles } from "../styles/accountStyles";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { profileSchema, ProfileFormValues } from "../schema/account.schema";
import { useAccount } from "../hooks/useAccount";
import { useAccountStore } from "../store/accountStore";
import { useAuthStore } from "../../auth/store/authStore";

const EditProfileModal = () => {
    const theme = useTheme();
    const styles = createAccountStyles(theme);
    const user = useAuthStore((state) => state.user);
    const isVisible = useAccountStore((state) => state.isEditModalVisible);
    const setVisible = useAccountStore((state) => state.setEditModalVisible);

    // Alert State
    const [alertVisible, setAlertVisible] = React.useState(false);
    const [alertConfig, setAlertConfig] = React.useState({ title: "", message: "" });

    const { updateProfile, isUpdating } = useAccount();

    const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || "",
            phone: user?.phone || "",
        },
    });

    // Reset form when user changes or modal opens
    useEffect(() => {
        if (isVisible && user) {
            reset({
                fullName: user.fullName,
                phone: user.phone || "",
            });
        }
    }, [isVisible, user, reset]);

    const onSubmit = (data: ProfileFormValues) => {
        console.log("[DEBUG_PROFILE] Modal Submit Button Pressed", data);

        // Edge Case: No Changes
        if (data.fullName === user?.fullName && data.phone === (user?.phone || "")) {
            console.log("[DEBUG_PROFILE] No changes detected, closing modal.");
            setVisible(false);
            return;
        }

        // Dismiss keyboard immediately to prevent layout shifts during transition
        Keyboard.dismiss();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        updateProfile.mutate(data, {
            onSuccess: () => {
                console.log("[DEBUG_PROFILE] Update successful, showing alert.");
                // Show success alert immediately WITHOUT dismissing modal
                setAlertConfig({
                    title: "Profile Updated",
                    message: "Your profile information has been saved successfully."
                });
                setAlertVisible(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
            onError: (error: any) => {
                console.error("[DEBUG_PROFILE] Update failed in component:", error);
                const message = error.response?.data?.message || "Could not update profile. Please try again.";
                setAlertConfig({ title: "Update Failed", message });
                setAlertVisible(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        });
    };

    const handleAlertClose = () => {
        setAlertVisible(false);
        // If it was a success alert, THEN close the drawer
        if (alertConfig.title === "Profile Updated") {
            setVisible(false);
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setVisible(false)}
        >
            <TouchableOpacity
                activeOpacity={1}
                style={styles.modalContainer}
                onPress={() => setVisible(false)}
            >
                <TouchableWithoutFeedback>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : undefined}
                        style={{ width: "100%" }}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.drawerHandle} />

                            <ScrollView
                                keyboardShouldPersistTaps="handled"
                                scrollEnabled={false} // Only used for tap persistence in this layout
                                contentContainerStyle={{ paddingBottom: 10 }}
                            >
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Edit Profile</Text>
                                    <TouchableOpacity
                                        onPress={() => setVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
                                    </TouchableOpacity>
                                </View>

                                {/* Full Name Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                    <Controller
                                        control={control}
                                        name="fullName"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                style={[styles.input, errors.fullName && { borderColor: theme.error }]}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                                placeholder="Enter your full name"
                                                placeholderTextColor={theme.tertiaryText}
                                            />
                                        )}
                                    />
                                    {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
                                </View>

                                {/* Phone Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <Controller
                                        control={control}
                                        name="phone"
                                        render={({ field: { onChange, onBlur, value } }) => (
                                            <TextInput
                                                style={[styles.input, errors.phone && { borderColor: theme.error }]}
                                                onBlur={onBlur}
                                                onChangeText={onChange}
                                                value={value}
                                                placeholder="Enter your phone number"
                                                placeholderTextColor={theme.tertiaryText}
                                                keyboardType="phone-pad"
                                            />
                                        )}
                                    />
                                    {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, isUpdating && { opacity: 0.7 }]}
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </TouchableOpacity>

            <IOSAlertDialog
                visible={alertVisible}
                onClose={handleAlertClose}
                title={alertConfig.title}
                message={alertConfig.message}
                buttons={[{ text: "OK", style: "default" }]}
            />
        </Modal>
    );
};

export default EditProfileModal;
