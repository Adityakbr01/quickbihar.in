import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { 
    PencilEdit01Icon, 
    Delete02Icon, 
    ActivityIcon 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { Category } from "../types/category.types";
import { createCategoryStyles } from "../styles/category.styles";

interface CategoryAdminCardProps {
    category: Category;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
}

const CategoryAdminCard = ({ category, onEdit, onDelete, isDeleting }: CategoryAdminCardProps) => {
    const theme = useTheme();
    const styles = createCategoryStyles(theme);

    return (
        <View style={[styles.card, { backgroundColor: theme.secondaryBackground, borderColor: theme.border }]}>
            <Image source={{ uri: category.image }} style={styles.cardImage} />
            
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
                    {category.title}
                </Text>
                
                <View style={styles.cardBadge}>
                    <HugeiconsIcon 
                        icon={ActivityIcon} 
                        size={12} 
                        color={category.isActive ? theme.success : theme.tertiaryText} 
                    />
                    <Text style={[
                        styles.badgeText, 
                        { color: category.isActive ? theme.success : theme.tertiaryText, marginLeft: 4 }
                    ]}>
                        Priority: {category.priority} • {category.isActive ? "Active" : "Inactive"}
                    </Text>
                </View>
            </View>

            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.primary + "15" }]}
                    onPress={() => onEdit(category)}
                >
                    <HugeiconsIcon icon={PencilEdit01Icon} size={18} color={theme.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: theme.error + "15" }]}
                    onPress={() => onDelete(category._id)}
                    disabled={isDeleting}
                >
                    <HugeiconsIcon icon={Delete02Icon} size={18} color={theme.error} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CategoryAdminCard;
