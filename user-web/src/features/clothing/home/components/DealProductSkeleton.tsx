import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';
import Skeleton from '@/src/components/common/Skeleton';

interface DealProductSkeletonProps {
    width: number;
}

export const DealProductSkeleton = ({ width }: DealProductSkeletonProps) => {
    const theme = useTheme() as any;

    return (
        <View style={[styles.card, { width, borderColor: theme.border, backgroundColor: theme.background }]}>
            {/* Image Area Skeleton */}
            <Skeleton width="100%" height={160} borderRadius={12} />
            
            <View style={styles.info}>
                {/* Rating Row Skeleton */}
                <Skeleton width={60} height={14} borderRadius={4} />
                
                {/* Title Skeleton */}
                <View style={{ marginTop: 8 }}>
                    <Skeleton width="100%" height={16} borderRadius={4} />
                    <Skeleton width="70%" height={16} borderRadius={4} style={{ marginTop: 4 }} />
                </View>

                {/* Price Row Skeleton */}
                <View style={styles.priceRow}>
                    <Skeleton width={50} height={20} borderRadius={4} />
                    <Skeleton width={40} height={16} borderRadius={4} />
                </View>

                {/* Delivery Skeleton */}
                <View style={{ marginTop: 8 }}>
                    <Skeleton width="60%" height={14} borderRadius={4} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    info: {
        padding: 12,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 8,
    },
});
