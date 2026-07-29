import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import * as z from "zod";
import { useCategories } from "../../category/hooks/useCategories";
import { Category } from "../../category/types/category.types";
import { createBannerStyles } from "../styles/banner.styles";
import { Banner } from "../types/banner.types";
import BadgeSelector from "./form/BadgeSelector";
import ToggleField from "./form/ToggleField";
import ImageUploadField from "./form/ImageUploadField";
import DatePickerField from "./form/DatePickerField";
import { useCreateBanner, useUpdateBanner } from "../hooks/useBanners";
import * as Haptics from "expo-haptics";

const bannerSchema = z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    image: z.any().refine((file) => !!file, "Image is required"),
    redirectType: z.enum(["product", "category", "collection", "external"]),
    redirectId: z.string().optional(),
    externalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    placement: z.enum(["home_top", "home_middle", "category"]),
    priority: z.number().int(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    isActive: z.boolean(),
    isAds: z.boolean(),
});

type BannerFormData = z.infer<typeof bannerSchema>;

interface BannerFormModalProps {
    visible: boolean;
    onClose: () => void;
    initialData?: Banner | null;
}

const BannerFormModal = ({ visible, onClose, initialData }: BannerFormModalProps) => {
    const theme = useTheme();
    const styles = React.useMemo(() => createBannerStyles(theme), [theme]);
    const { data: categories, isLoading: isCategoriesLoading } = useCategories();

    const { mutate: createBanner, isPending: isCreating } = useCreateBanner();
    const { mutate: updateBanner, isPending: isUpdating } = useUpdateBanner();
    const isSubmitting = isCreating || isUpdating;

    const { control, handleSubmit, reset, watch, setValue, setError, formState: { errors } } = useForm<BannerFormData>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: "",
            subtitle: "",
            image: "",
            redirectType: "external",
            redirectId: "",
            externalUrl: "",
            placement: "home_top",
            priority: 0,
            startDate: "",
            endDate: "",
            isActive: true,
            isAds: false,
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title || "",
                subtitle: initialData.subtitle || "",
                image: initialData.image,
                redirectType: initialData.redirectType,
                redirectId: initialData.redirectId || "",
                externalUrl: initialData.externalUrl || "",
                placement: initialData.placement,
                priority: initialData.priority,
                startDate: initialData.startDate || "",
                endDate: initialData.endDate || "",
                isActive: initialData.isActive,
                isAds: initialData.isAds,
            });
        } else {
            reset({
                title: "",
                subtitle: "",
                image: "",
                redirectType: "external",
                redirectId: "",
                externalUrl: "",
                placement: "home_top",
                priority: 0,
                startDate: "",
                endDate: "",
                isActive: true,
                isAds: false,
            });
        }
    }, [initialData, reset, visible]);

    const handleFormSubmit = React.useCallback(async (data: BannerFormData) => {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (key === "image") {
                if (typeof value === "object" && (value as any).uri) {
                    formData.append("image", {
                        uri: (value as any).uri,
                        name: (value as any).name,
                        type: (value as any).type,
                    } as any);
                }
            } else if (value !== undefined && value !== null && value !== "") {
                // Optimization: Don't send empty strings for optional fields to avoid backend Zod failures
                formData.append(key, value.toString());
            }
        });

        const mutationOptions = {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onClose();
            },
            onError: (error: any) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                // Map server-side Zod errors to react-hook-form
                const serverErrors = error?.response?.data?.errors;
                if (Array.isArray(serverErrors)) {
                    serverErrors.forEach((err: any) => {
                        const fieldName = err.path[0] as keyof BannerFormData;
                        setError(fieldName, {
                            type: "server",
                            message: err.message
                        });
                    });
                }
            }
        };

        if (initialData?._id) {
            updateBanner({ id: initialData._id, data: formData }, mutationOptions);
        } else {
            createBanner(formData, mutationOptions);
        }
    }, [initialData, createBanner, updateBanner, onClose, setError]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                style={styles.modalContainer}
            >
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.modalIndicator} />

                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {initialData ? "Edit Banner" : "New Banner"}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 60 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Controller
                            control={control}
                            name="image"
                            render={({ field: { onChange, value } }) => (
                                <ImageUploadField
                                    value={value}
                                    onChange={onChange}
                                    theme={theme}
                                    styles={styles}
                                    error={errors.image?.message as string}
                                />
                            )}
                        />

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Controller
                                    control={control}
                                    name="title"
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.label, { color: theme.text }]}>Title</Text>
                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                placeholder="Summer Collection"
                                                placeholderTextColor={theme.tertiaryText}
                                                value={value}
                                                onChangeText={onChange}
                                            />
                                        </View>
                                    )}
                                />
                            </View>
                            <View style={[styles.flex1, { maxWidth: 100 }]}>
                                <Controller
                                    control={control}
                                    name="priority"
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.label, { color: theme.text }]}>Priority</Text>
                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                keyboardType="numeric"
                                                placeholder="0"
                                                placeholderTextColor={theme.tertiaryText}
                                                value={value.toString()}
                                                onChangeText={(val) => onChange(parseInt(val) || 0)}
                                            />
                                        </View>
                                    )}
                                />
                            </View>
                        </View>

                        <Controller
                            control={control}
                            name="subtitle"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>Subtitle</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { color: theme.text }]}
                                        placeholder="Get up to 50% off on all summer wear"
                                        placeholderTextColor={theme.tertiaryText}
                                        multiline
                                        numberOfLines={3}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Redirect Type</Text>
                            <Controller
                                control={control}
                                name="redirectType"
                                render={({ field: { onChange, value } }) => (
                                    <BadgeSelector
                                        options={["product", "category", "collection", "external"]}
                                        value={value}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                        error={errors.redirectType?.message as string}
                                    />
                                )}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Controller
                                    control={control}
                                    name="redirectId"
                                    render={({ field: { onChange, value } }) => (
                                        <View style={styles.formGroup}>
                                            <Text style={[styles.label, { color: theme.text }]}>Redirect ID</Text>

                                            {watch("redirectType") === "category" && (
                                                <View style={styles.categorySelectContainer}>
                                                    {isCategoriesLoading ? (
                                                        <ActivityIndicator size="small" color={theme.primary} />
                                                    ) : (
                                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                            {categories?.map((cat: Category) => (
                                                                <TouchableOpacity
                                                                    key={cat._id}
                                                                    onPress={() => onChange(cat._id)}
                                                                    style={[
                                                                        styles.categorySelectItem,
                                                                        value === cat._id && styles.selectedCategoryItem
                                                                    ]}
                                                                >
                                                                    <View style={styles.categorySelectImageContainer}>
                                                                        <Image source={{ uri: cat.image }} style={styles.categorySelectImage} />
                                                                    </View>
                                                                    <Text
                                                                        numberOfLines={1}
                                                                        style={[
                                                                            styles.categorySelectText,
                                                                            { color: theme.text },
                                                                            value === cat._id && styles.selectedCategoryText
                                                                        ]}
                                                                    >
                                                                        {cat.title}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            ))}
                                                        </ScrollView>
                                                    )}
                                                </View>
                                            )}

                                            <TextInput
                                                style={[styles.input, { color: theme.text }]}
                                                placeholder="Category/Product ID"
                                                placeholderTextColor={theme.tertiaryText}
                                                value={value}
                                                onChangeText={onChange}
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    )}
                                />
                            </View>
                        </View>

                        <Controller
                            control={control}
                            name="externalUrl"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.formGroup}>
                                    <Text style={[styles.label, { color: theme.text }]}>External URL (if type is External)</Text>
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        placeholder="https://google.com"
                                        placeholderTextColor={theme.tertiaryText}
                                        value={value}
                                        onChangeText={onChange}
                                        autoCapitalize="none"
                                    />
                                    {errors.externalUrl && <Text style={{ color: "#FF3B30", fontSize: 12, marginTop: 4 }}>{errors.externalUrl.message}</Text>}
                                </View>
                            )}
                        />

                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: theme.text }]}>Placement</Text>
                            <Controller
                                control={control}
                                name="placement"
                                render={({ field: { onChange, value } }) => (
                                    <BadgeSelector
                                        options={["home_top", "home_middle", "category"]}
                                        value={value}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                        formatLabel={(label) => label.replace("_", " ").toUpperCase()}
                                        error={errors.placement?.message as string}
                                    />
                                )}
                            />
                        </View>

                        <View style={styles.row}>
                            <Controller
                                control={control}
                                name="startDate"
                                render={({ field: { onChange, value } }) => (
                                    <DatePickerField
                                        label="Start Date"
                                        value={value || ""}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                        error={errors.startDate?.message as string}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="endDate"
                                render={({ field: { onChange, value } }) => (
                                    <DatePickerField
                                        label="End Date"
                                        value={value || ""}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                        error={errors.endDate?.message as string}
                                    />
                                )}
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Controller
                                control={control}
                                name="isActive"
                                render={({ field: { onChange, value } }) => (
                                    <ToggleField
                                        label="Is Active"
                                        value={value}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                    />
                                )}
                            />
                            <Controller
                                control={control}
                                name="isAds"
                                render={({ field: { onChange, value } }) => (
                                    <ToggleField
                                        label="Promotional Ad"
                                        value={value}
                                        onChange={onChange}
                                        theme={theme}
                                        styles={styles}
                                    />
                                )}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitButton, { backgroundColor: theme.primary }]}
                            onPress={handleSubmit(handleFormSubmit)}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {initialData ? "Update Banner" : "Create Banner"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default BannerFormModal;
