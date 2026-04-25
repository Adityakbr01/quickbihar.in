import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
    ArrowLeft01Icon,
    Add01Icon,
    FilterIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import {
    useAdminCategories,
    useDeleteCategory
} from "../hooks/useCategories";
import CategoryAdminCard from "../components/CategoryAdminCard";
import CategoryFormModal from "../components/CategoryFormModal";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { Category } from "../types/category.types";
import { createCategoryStyles } from "../styles/category.styles";
import * as Haptics from "expo-haptics";

const CategoryAdminScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const styles = createCategoryStyles(theme);

    // Data Fetching
    const { data: categories, isLoading, refetch } = useAdminCategories();

    // Mutations
    const { mutate: deleteCategory } = useDeleteCategory();

    // State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleteAlertVisible, setIsDeleteAlertVisible] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);

    const handleDelete = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIdToDelete(id);
        setIsDeleteAlertVisible(true);
    };

    const confirmDelete = () => {
        if (!idToDelete) return;

        setDeletingId(idToDelete);
        deleteCategory(idToDelete, {
            onSuccess: () => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setDeletingId(null);
                setIdToDelete(null);
            },
            onError: () => {
                setDeletingId(null);
                setIdToDelete(null);
            }
        });
    };

    const handleEdit = (category: Category) => {
        Haptics.selectionAsync();
        setSelectedCategory(category);
        setModalVisible(true);
    };

    const handleAddNew = () => {
        Haptics.selectionAsync();
        setSelectedCategory(null);
        setModalVisible(true);
    };

    return (
        <SafeViewWrapper>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Categories</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={handleAddNew}
                >
                    <HugeiconsIcon icon={Add01Icon} size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor={theme.primary}
                    />
                }
            >
                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : categories?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No categories found.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                            <Text style={{ color: theme.primary, fontWeight: "600" }}>Create your first category</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    categories?.map((category: Category) => (
                        <CategoryAdminCard
                            key={category._id}
                            category={category}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            isDeleting={deletingId === category._id}
                        />
                    ))
                )}
            </ScrollView>

            <CategoryFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialData={selectedCategory}
            />

            <IOSAlertDialog
                visible={isDeleteAlertVisible}
                onClose={() => setIsDeleteAlertVisible(false)}
                title="Delete Category"
                message="Are you sure you want to delete this category? All products linked to this category might be affected."
                buttons={[
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: confirmDelete
                    }
                ]}
            />
        </SafeViewWrapper>
    );
};

export default CategoryAdminScreen;
