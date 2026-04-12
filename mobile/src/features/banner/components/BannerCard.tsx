import React, { memo } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Delete02Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import { LinearGradient } from "expo-linear-gradient";
import { createBannerStyles } from "../styles/banner.styles";
import { Banner } from "../types/banner.types";

interface BannerCardProps {
    banner: Banner;
    onDelete: (id: string) => void;
    onEdit: (banner: Banner) => void;
    isDeleting?: boolean;
}

const BannerCard = ({ banner, onDelete, onEdit, isDeleting }: BannerCardProps) => {
    const theme = useTheme();
    const styles = createBannerStyles(theme);

    return (
        <View style={styles.card}>
            <View>
                <Image source={{ uri: banner.image }} style={styles.cardImage} resizeMode="cover" />
                <LinearGradient
                    colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.4)"]}
                    style={styles.cardOverlayGradient}
                />

                <View style={styles.cardOverlay}>
                    <View style={styles.cardBadgeContainer}>
                        <View style={[styles.badge, banner.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                            <Text style={styles.badgeText}>{banner.isActive ? "ACTIVE" : "INACTIVE"}</Text>
                        </View>
                        {banner.isAds && (
                            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.badgeText}>PROMO</Text>
                            </View>
                        )}
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{banner.placement.replace("_", " ").toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, alignSelf: "flex-end" }}>
                        <TouchableOpacity
                            style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.2)", padding: 8 }]}
                            onPress={() => onEdit(banner)}
                            activeOpacity={0.7}
                        >
                            <HugeiconsIcon icon={Edit01Icon} size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.badge,
                                { backgroundColor: "rgba(255, 59, 48, 0.8)", padding: 8, minWidth: 36, alignItems: "center" }
                            ]}
                            onPress={() => onDelete(banner._id)}
                            disabled={isDeleting}
                            activeOpacity={0.7}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <HugeiconsIcon icon={Delete02Icon} size={18} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{banner.title || "Untitled Banner"}</Text>
                {banner.subtitle && (
                    <Text style={[styles.cardSubtitle, { color: theme.secondaryText }]}>{banner.subtitle}</Text>
                )}

                <View style={styles.cardStatsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Clicks</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{banner.clicks.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Impressions</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{banner.impressions.toLocaleString()}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Priority</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{banner.priority}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default memo(BannerCard);
