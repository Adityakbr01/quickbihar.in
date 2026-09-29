import React from 'react';
import { StyleSheet, View, ViewStyle } from '@/components/primitives';
import { useTheme } from '../../theme/Provider/ThemeProvider';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
    const theme = useTheme();

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.border,
                } as any,
                { animation: 'qb-skeleton-pulse 1.6s ease-in-out infinite' },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});

export default Skeleton;
