import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../../../components/common/Skeleton';
import { useTheme } from '@/src/theme/Provider/ThemeProvider';

export const ProductCardSkeleton = () => {
    const theme = useTheme() as any;

    return (
        <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.background }]}>
            {/* Image Area Skeleton */}
            <Skeleton width="100%" height={200} borderRadius={16} />
            
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
                    <Skeleton width={80} height={20} borderRadius={4} />
                    <Skeleton width={50} height={16} borderRadius={4} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 240,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
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
