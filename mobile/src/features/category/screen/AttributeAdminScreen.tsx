import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
    ArrowLeft01Icon,
    Add01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import {
    useAttributes,
    useDeleteAttribute,
} from "../hooks/useCategories";
import AttributeAdminCard from "../components/AttributeAdminCard";
import AttributeFormModal from "../components/AttributeFormModal";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import { CategoryAttribute } from "../types/category.types";
import { createCategoryStyles } from "../styles/category.styles";
import * as Haptics from "expo-haptics";

const AttributeAdminScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const styles = createCategoryStyles(theme);
    const { categoryId, categoryName } = useLocalSearchParams<{
        categoryId: string;
        categoryName: string;
    }>();

    // Data Fetching
    const { data: attributes, isLoading, refetch } = useAttributes(categoryId || "");

    // Mutations
    const { mutate: deleteAttribute } = useDeleteAttribute();

    // State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<CategoryAttribute | null>(null);
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
        deleteAttribute(idToDelete, {
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

    const handleEdit = (attribute: CategoryAttribute) => {
        Haptics.selectionAsync();
        setSelectedAttribute(attribute);
        setModalVisible(true);
    };

    const handleAddNew = () => {
        Haptics.selectionAsync();
        setSelectedAttribute(null);
        setModalVisible(true);
    };

    return (
        <SafeViewWrapper>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                        {categoryName || "Attributes"}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.tertiaryText, marginTop: 1 }}>
                        Manage Attributes
                    </Text>
                </View>
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
                ) : attributes?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
                            No attributes found.
                        </Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                            <Text style={{ color: theme.primary, fontWeight: "600" }}>
                                Add your first attribute
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    attributes?.map((attr: CategoryAttribute) => (
                        <AttributeAdminCard
                            key={attr._id}
                            attribute={attr}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={deletingId === attr._id}
                        />
                    ))
                )}
            </ScrollView>

            {categoryId && (
                <AttributeFormModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    categoryId={categoryId}
                    initialData={selectedAttribute}
                />
            )}

            <IOSAlertDialog
                visible={isDeleteAlertVisible}
                onClose={() => setIsDeleteAlertVisible(false)}
                title="Delete Attribute"
                message="Are you sure you want to delete this attribute? Products using this attribute may be affected."
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

export default AttributeAdminScreen;
