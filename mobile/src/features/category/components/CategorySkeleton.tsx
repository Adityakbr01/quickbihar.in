import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import { spacing } from "@/src/theme/spacing";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    View
} from "react-native";



const CategorySkeleton = () => {
    const theme = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <View style={styles.categoryItem}>
            <Animated.View
                style={[
                    styles.imageContainer,
                    {
                        backgroundColor: theme.tertiaryBackground,
                        borderColor: theme.border,
                        opacity
                    }
                ]}
            />
            <Animated.View
                style={[
                    styles.skeletonTitle,
                    {
                        backgroundColor: theme.tertiaryBackground,
                        opacity
                    }
                ]}
            />
        </View>
    );
};

export default CategorySkeleton;

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.m,
    },
    listContent: {
        paddingHorizontal: spacing.m,
        gap: spacing.m,
    },
    categoryItem: {
        alignItems: "center",
        width: 70,
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        overflow: "hidden",
        marginBottom: spacing.xs,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: "100%",
        height: "100%",
    },
    title: {
        fontSize: 11,
        fontWeight: "500",
        textAlign: "center",
    },
    skeletonTitle: {
        height: 10,
        width: "80%",
        borderRadius: 5,
        marginTop: 4,
    }
});