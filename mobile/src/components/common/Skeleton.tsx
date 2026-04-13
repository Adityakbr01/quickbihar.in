import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    withSequence 
} from 'react-native-reanimated';
import { useTheme } from '../../theme/Provider/ThemeProvider';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
    const theme = useTheme();
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.border,
                },
                animatedStyle,
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
