import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import {
    ArrowLeft01Icon,
    Add01Icon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import SafeViewWrapper from "@/src/provider/SafeViewWrapper";
import {
    useAdminBanners,
    useDeleteBanner,
    useCreateBanner,
    useUpdateBanner
} from "../hooks/useBanners";
import BannerCard from "../components/BannerCard";
import BannerFormModal from "../components/BannerFormModal";
import IOSAlertDialog from "@/src/components/ui/IOSAlertDialog";
import type { Banner } from "../types/banner.types";
import { createBannerStyles } from "../styles/banner.styles";
import * as Haptics from "expo-haptics";

const BannerAdminScreen = () => {
    const theme = useTheme();
    const router = useRouter();
    const styles = createBannerStyles(theme);

    // Data Fetching
    const { data: banners, isLoading, refetch } = useAdminBanners();

    // Mutations
    const { mutate: deleteBanner } = useDeleteBanner();

    // State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
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
        deleteBanner(idToDelete, {
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

    const handleEdit = (banner: Banner) => {
        Haptics.selectionAsync();
        setSelectedBanner(banner);
        setModalVisible(true);
    };

    const handleAddNew = () => {
        Haptics.selectionAsync();
        setSelectedBanner(null);
        setModalVisible(true);
    };


    return (
        <SafeViewWrapper>
            {/* iOS Style Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Banners</Text>
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
                ) : banners?.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No banners found.</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleAddNew}>
                            <Text style={{ color: theme.primary, fontWeight: "600" }}>Create your first banner</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    banners?.map((banner: Banner) => (
                        <BannerCard
                            key={banner._id}
                            banner={banner}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            isDeleting={deletingId === banner._id}
                        />
                    ))
                )}
            </ScrollView>

            <BannerFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                initialData={selectedBanner}
            />

            <IOSAlertDialog
                visible={isDeleteAlertVisible}
                onClose={() => setIsDeleteAlertVisible(false)}
                title="Delete Banner"
                message="This action cannot be undone. Are you sure you want to delete this banner?"
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

export default BannerAdminScreen;
