import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as z from "zod";
import { useCreateCategory, useUpdateCategory } from "../hooks/useCategories";
import { createCategoryStyles } from "../styles/category.styles";
import { Category } from "../types/category.types";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.coerce
    .number()
    .int()
    .min(0, "Priority must be 0 or greater")
    .default(0),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  initialData?: Category | null;
}

const CategoryFormModal = ({
  visible,
  onClose,
  initialData,
}: CategoryFormModalProps) => {
  const theme = useTheme();
  const styles = createCategoryStyles(theme);
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: createCategory } = useCreateCategory();
  const { mutate: updateCategory } = useUpdateCategory();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      priority: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        priority: initialData.priority,
        isActive: initialData.isActive,
      });
      setImage(initialData.image);
    } else {
      reset({
        title: "",
        priority: 0,
        isActive: true,
      });
      setImage(null);
    }
  }, [initialData, reset, visible]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      Haptics.selectionAsync();
    }
  };

  const onSubmit = (data: FormData) => {
    if (!image) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert("Please select a category image");
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("priority", data.priority.toString());
    formData.append("isActive", data.isActive.toString());

    // Handle Image
    if (image && !image.startsWith("http")) {
      const fileName = image.split("/").pop() || "category.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      // @ts-ignore
      formData.append("image", {
        uri: image,
        name: fileName,
        type,
      });
    }

    if (initialData) {
      updateCategory(
        { id: initialData._id, data: formData },
        {
          onSuccess: () => handleSuccess(),
          onError: (error) => handleError(error),
        },
      );
    } else {
      createCategory(formData, {
        onSuccess: () => handleSuccess(),
        onError: (error) => handleError(error),
      });
    }
  };

  const handleSuccess = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    onClose();
  };

  const handleError = (error: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setIsSubmitting(false);
    console.error("Category operation failed:", error);
    alert("Operation failed. Please try again.");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <HugeiconsIcon icon={Cancel01Icon} size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {initialData ? "Edit Category" : "Add New Category"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.formScroll}>
          {/* Image Picker */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Category Image
            </Text>
            <TouchableOpacity
              onPress={pickImage}
              style={[
                styles.imagePickerContainer,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.secondaryBackground,
                },
              ]}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <View style={{ width: 100, height: 100 }}>
                    <LottieView
                      source={require("@/assets/lottie/Upload.json")}
                      autoPlay
                      loop
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.placeholderText,
                      { color: theme.tertiaryText },
                    ]}
                  >
                    Select Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Category Title
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.title ? theme.error : theme.border,
                      backgroundColor: theme.secondaryBackground,
                      color: theme.text,
                    },
                  ]}
                  placeholder="e.g. Mens Fashion"
                  placeholderTextColor={theme.tertiaryText}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && (
              <Text style={{ color: theme.error, fontSize: 12, marginTop: 4 }}>
                {errors.title.message}
              </Text>
            )}
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Priority Order
            </Text>
            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.priority ? theme.error : theme.border,
                      backgroundColor: theme.secondaryBackground,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Higher numbers show first"
                  placeholderTextColor={theme.tertiaryText}
                  keyboardType="numeric"
                  onBlur={onBlur}
                  onChangeText={(val) => onChange(val ? Number(val) : 0)}
                  value={value?.toString()}
                />
              )}
            />
          </View>

          {/* Is Active */}
          <View style={styles.switchContainer}>
            <View>
              <Text
                style={[styles.label, { color: theme.text, marginBottom: 0 }]}
              >
                Is Active
              </Text>
              <Text style={{ color: theme.tertiaryText, fontSize: 12 }}>
                Visible on home screen
              </Text>
            </View>
            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value}
                  onValueChange={onChange}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#fff"
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.submitButtonText}>
                  {initialData ? "Update Category" : "Save Category"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CategoryFormModal;
